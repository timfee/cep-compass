import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { GOOGLE_API_CONFIG } from '../shared/constants/google-api.constants';
import { GoogleApiErrorHandler } from '../shared/constants/google-api.constants';
import { BaseApiService } from '../core/base-api.service';
import { SEARCH_CONFIG } from '../shared/constants/app.constants';
import { ApiUrlBuilder, PaginationUtils } from '../shared/utils/api.utils';

export interface DirectoryUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  suspended: boolean;
  orgUnitPath: string;
  isAdmin: boolean;
  isDelegatedAdmin: boolean;
  lastLoginTime: string;
  creationTime: string;
  thumbnailPhotoUrl?: string;
  emails: {
    address: string;
    primary: boolean;
  }[];
}

export interface DirectoryGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: string;
  adminCreated: boolean;
  aliases?: string[];
}

export interface DirectoryStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalGroups: number;
  lastSyncTime: Date;
}

// API Response interfaces
interface UsersApiResponse {
  users?: {
    id?: string;
    primaryEmail?: string;
    name?: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    suspended?: boolean;
    orgUnitPath?: string;
    isAdmin?: boolean;
    isDelegatedAdmin?: boolean;
    lastLoginTime?: string;
    creationTime?: string;
    thumbnailPhotoUrl?: string;
    emails?: {
      address?: string;
      primary?: boolean;
    }[];
  }[];
  nextPageToken?: string;
  etag?: string;
}

interface GroupsApiResponse {
  groups?: {
    id?: string;
    email?: string;
    name?: string;
    description?: string;
    directMembersCount?: string;
    adminCreated?: boolean;
    aliases?: string[];
  }[];
  nextPageToken?: string;
  etag?: string;
}

interface GroupMembersApiResponse {
  members?: {
    id?: string;
    email?: string;
    role?: string;
    type?: string;
  }[];
  nextPageToken?: string;
  etag?: string;
}

// Type guards for safe API response validation
function isValidUserApiResponse(
  data: unknown,
): data is NonNullable<UsersApiResponse['users']>[0] {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const user = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof user['id'] !== 'string' ||
    typeof user['primaryEmail'] !== 'string'
  ) {
    return false;
  }

  // Validate name object structure if present
  if (user['name'] !== undefined) {
    if (typeof user['name'] !== 'object' || user['name'] === null) {
      return false;
    }
    const name = user['name'] as Record<string, unknown>;
    if (
      name['givenName'] !== undefined &&
      typeof name['givenName'] !== 'string'
    )
      return false;
    if (
      name['familyName'] !== undefined &&
      typeof name['familyName'] !== 'string'
    )
      return false;
    if (name['fullName'] !== undefined && typeof name['fullName'] !== 'string')
      return false;
  }

  // Validate emails array if present
  if (user['emails'] !== undefined) {
    if (!Array.isArray(user['emails'])) {
      return false;
    }
    for (const email of user['emails']) {
      if (email && typeof email === 'object') {
        const emailObj = email as Record<string, unknown>;
        if (
          emailObj['address'] !== undefined &&
          typeof emailObj['address'] !== 'string'
        )
          return false;
        if (
          emailObj['primary'] !== undefined &&
          typeof emailObj['primary'] !== 'boolean'
        )
          return false;
      }
    }
  }

  return true;
}

function isValidGroupApiResponse(
  data: unknown,
): data is NonNullable<GroupsApiResponse['groups']>[0] {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const group = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof group['id'] !== 'string' ||
    typeof group['email'] !== 'string' ||
    typeof group['name'] !== 'string'
  ) {
    return false;
  }

  // Validate optional fields
  if (
    group['description'] !== undefined &&
    typeof group['description'] !== 'string'
  )
    return false;
  if (
    group['directMembersCount'] !== undefined &&
    typeof group['directMembersCount'] !== 'string'
  )
    return false;
  if (
    group['adminCreated'] !== undefined &&
    typeof group['adminCreated'] !== 'boolean'
  )
    return false;

  // Validate aliases array if present
  if (group['aliases'] !== undefined) {
    if (!Array.isArray(group['aliases'])) {
      return false;
    }
    for (const alias of group['aliases']) {
      if (typeof alias !== 'string') return false;
    }
  }

  return true;
}

/**
 * Service for managing Google Workspace Directory Users and Groups
 * Provides efficient pagination, search, and caching capabilities
 */
@Injectable({
  providedIn: 'root',
})
export class DirectoryService extends BaseApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly API_BASE_URL = GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1;

  // Pagination state
  private userPageToken: string | null = null;
  private groupPageToken: string | null = null;

  // Private state signals
  private readonly _users = signal<DirectoryUser[]>([]);
  private readonly _groups = signal<DirectoryGroup[]>([]);
  private readonly _hasMoreUsers = signal<boolean>(true);
  private readonly _hasMoreGroups = signal<boolean>(true);

  /**
   * Signal containing all loaded users
   */
  public readonly users = this._users.asReadonly();

  /**
   * Signal containing all loaded groups
   */
  public readonly groups = this._groups.asReadonly();

  /**
   * Signal indicating if more users can be loaded
   */
  public readonly hasMoreUsers = this._hasMoreUsers.asReadonly();

  /**
   * Signal indicating if more groups can be loaded
   */
  public readonly hasMoreGroups = this._hasMoreGroups.asReadonly();

  /**
   * Computed signal providing directory statistics
   */
  public readonly stats = computed<DirectoryStats>(() => {
    const users = this._users();
    const groups = this._groups();
    const lastFetch = this.lastFetchTime();

    const activeUsers = users.filter((user) => !user.suspended).length;
    const suspendedUsers = users.filter((user) => user.suspended).length;

    return {
      totalUsers: users.length,
      activeUsers,
      suspendedUsers,
      totalGroups: groups.length,
      lastSyncTime: lastFetch ? new Date(lastFetch) : new Date(),
    };
  });

  /**
   * Fetches initial data: first 100 users and 50 groups
   */
  async fetchInitialData(): Promise<void> {
    // Check if we have cached data that's still valid
    if (this.isCacheValid()) {
      return;
    }

    // Check if user is authenticated
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.setError('User not authenticated');
      return;
    }

    this.setLoading(true);

    try {
      // Reset pagination tokens and data
      this.userPageToken = null;
      this.groupPageToken = null;
      this._users.set([]);
      this._groups.set([]);
      this._hasMoreUsers.set(true);
      this._hasMoreGroups.set(true);

      // Fetch initial users and groups concurrently
      await Promise.all([
        this.loadUsersPage(PaginationUtils.getPageSize('users')),
        this.loadGroupsPage(PaginationUtils.getPageSize('groups')),
      ]);

      this.updateFetchTime();
    } catch (error) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      this.setError(errorMessage);
      console.error('Failed to fetch initial directory data:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Loads more users (pagination)
   */
  async loadMoreUsers(): Promise<void> {
    if (!this._hasMoreUsers() || this.isLoading()) {
      return;
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.setError('User not authenticated');
      return;
    }

    this.setLoading(true);

    try {
      await this.loadUsersPage(PaginationUtils.getPageSize('users'));
    } catch (error) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      this.setError(errorMessage);
      console.error('Failed to load more users:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Loads more groups (pagination)
   */
  async loadMoreGroups(): Promise<void> {
    if (!this._hasMoreGroups() || this.isLoading()) {
      return;
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.setError('User not authenticated');
      return;
    }

    this.setLoading(true);

    try {
      await this.loadGroupsPage(PaginationUtils.getPageSize('groups'));
    } catch (error) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      this.setError(errorMessage);
      console.error('Failed to load more groups:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Searches users by query string
   */
  async searchUsers(query: string): Promise<DirectoryUser[]> {
    if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return this._users().filter((user) => this.matchesUserQuery(user, query));
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const url = this.buildUsersApiUrl(
      undefined,
      SEARCH_CONFIG.DEFAULT_LIMIT,
      query,
    );

    try {
      const response = await firstValueFrom(
        this.http.get<UsersApiResponse>(url),
      );

      if (response?.users) {
        return response.users.map(this.mapApiResponseToUser);
      }

      return [];
    } catch (error: unknown) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      console.error('Failed to search users:', error);
      throw new Error(`Failed to search users: ${errorMessage}`);
    }
  }

  /**
   * Searches groups by query string
   */
  async searchGroups(query: string): Promise<DirectoryGroup[]> {
    if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return this._groups().filter((group) =>
        this.matchesGroupQuery(group, query),
      );
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const url = this.buildGroupsApiUrl(
      undefined,
      SEARCH_CONFIG.DEFAULT_LIMIT,
      undefined,
      query,
    );

    try {
      const response = await firstValueFrom(
        this.http.get<GroupsApiResponse>(url),
      );

      if (response?.groups) {
        return response.groups.map(this.mapApiResponseToGroup);
      }

      return [];
    } catch (error: unknown) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      console.error('Failed to search groups:', error);
      throw new Error(`Failed to search groups: ${errorMessage}`);
    }
  }

  /**
   * Gets groups that a user belongs to
   */
  async getUserGroups(userEmail: string): Promise<DirectoryGroup[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const url = this.buildGroupsApiUrl(
      undefined,
      SEARCH_CONFIG.DEFAULT_LIMIT,
      userEmail,
    );

    try {
      const response = await firstValueFrom(
        this.http.get<GroupsApiResponse>(url),
      );

      if (response?.groups) {
        return response.groups.map(this.mapApiResponseToGroup);
      }

      return [];
    } catch (error: unknown) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      console.error('Failed to get user groups:', error);
      throw new Error(`Failed to get user groups: ${errorMessage}`);
    }
  }

  /**
   * Gets members of a group
   */
  async getGroupMembers(groupEmail: string): Promise<DirectoryUser[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const allMembers: DirectoryUser[] = [];
    let pageToken: string | undefined;

    try {
      do {
        const url = this.buildGroupMembersApiUrl(
          groupEmail,
          pageToken,
          SEARCH_CONFIG.DEFAULT_LIMIT,
        );

        const response = await firstValueFrom(
          this.http.get<GroupMembersApiResponse>(url),
        );

        if (response?.members) {
          // Get full user details for each member
          const memberEmails = response.members
            .filter((member) => member.email)
            .map((member) => member.email!);

          for (const email of memberEmails) {
            try {
              const user = await this.getUserByEmail(email);
              if (user) {
                allMembers.push(user);
              }
            } catch (error) {
              console.warn(`Failed to get details for user ${email}:`, error);
            }
          }
        }

        pageToken = response?.nextPageToken;
      } while (pageToken);

      return allMembers;
    } catch (error: unknown) {
      const errorMessage = GoogleApiErrorHandler.handleDirectoryError(error);
      console.error('Failed to get group members:', error);
      throw new Error(`Failed to get group members: ${errorMessage}`);
    }
  }

  /**
   * Refreshes cached statistics
   */
  async refreshStats(): Promise<void> {
    this.clearState(); // Clear cache
    await this.fetchInitialData();
  }

  /**
   * Clears all cached data
   */
  clearCache(): void {
    this._users.set([]);
    this._groups.set([]);
    this.clearState();
    this.userPageToken = null;
    this.groupPageToken = null;
    this._hasMoreUsers.set(true);
    this._hasMoreGroups.set(true);
  }

  private async loadUsersPage(maxResults: number): Promise<void> {
    const url = this.buildUsersApiUrl(this.userPageToken, maxResults);

    try {
      const response = await firstValueFrom(
        this.http.get<UsersApiResponse>(url),
      );

      if (response?.users) {
        const newUsers = response.users.map(this.mapApiResponseToUser);
        const currentUsers = this._users();
        this._users.set([...currentUsers, ...newUsers]);
      }

      this.userPageToken = response?.nextPageToken || null;
      this._hasMoreUsers.set(!!this.userPageToken);
    } catch (error: unknown) {
      console.error('Failed to load users page:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  private async loadGroupsPage(maxResults: number): Promise<void> {
    const url = this.buildGroupsApiUrl(this.groupPageToken, maxResults);

    try {
      const response = await firstValueFrom(
        this.http.get<GroupsApiResponse>(url),
      );

      if (response?.groups) {
        const newGroups = response.groups.map(this.mapApiResponseToGroup);
        const currentGroups = this._groups();
        this._groups.set([...currentGroups, ...newGroups]);
      }

      this.groupPageToken = response?.nextPageToken || null;
      this._hasMoreGroups.set(!!this.groupPageToken);
    } catch (error: unknown) {
      console.error('Failed to load groups page:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  private async getUserByEmail(email: string): Promise<DirectoryUser | null> {
    const url = `${this.API_BASE_URL}/users/${encodeURIComponent(email)}`;

    try {
      const response = await firstValueFrom(this.http.get<unknown>(url));

      if (response) {
        return this.mapApiResponseToUser(response);
      }
    } catch (error) {
      console.warn(`Failed to get user details for ${email}:`, error);
    }

    return null;
  }

  private buildUsersApiUrl(
    pageToken?: string | null,
    maxResults?: number,
    query?: string,
  ): string {
    const baseUrl = `${this.API_BASE_URL}/users`;

    return ApiUrlBuilder.buildPaginatedUrl(baseUrl, {
      pageToken,
      maxResults: maxResults
        ? PaginationUtils.clampPageSize(maxResults, 'users')
        : undefined,
      fields:
        'users(id,primaryEmail,name,suspended,orgUnitPath,isAdmin,isDelegatedAdmin,lastLoginTime,creationTime,thumbnailPhotoUrl,emails),nextPageToken',
      additionalParams: query ? { query } : {},
    });
  }

  private buildGroupsApiUrl(
    pageToken?: string | null,
    maxResults?: number,
    userKey?: string,
    query?: string,
  ): string {
    const baseUrl = `${this.API_BASE_URL}/groups`;

    const additionalParams: Record<string, string> = {};
    if (userKey) additionalParams['userKey'] = userKey;
    if (query) additionalParams['query'] = query;

    return ApiUrlBuilder.buildPaginatedUrl(baseUrl, {
      pageToken,
      maxResults: maxResults
        ? PaginationUtils.clampPageSize(maxResults, 'groups')
        : undefined,
      fields:
        'groups(id,email,name,description,directMembersCount,adminCreated,aliases),nextPageToken',
      additionalParams,
    });
  }

  private buildGroupMembersApiUrl(
    groupEmail: string,
    pageToken?: string,
    maxResults?: number,
  ): string {
    const baseUrl = `${this.API_BASE_URL}/groups/${encodeURIComponent(groupEmail)}/members`;
    const params = new URLSearchParams();

    if (maxResults) {
      params.set('maxResults', Math.min(maxResults, 200).toString());
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    // Request only needed fields
    params.set('fields', 'members(id,email,role,type),nextPageToken');

    return `${baseUrl}?${params.toString()}`;
  }

  private mapApiResponseToUser(apiUser: unknown): DirectoryUser {
    if (!isValidUserApiResponse(apiUser)) {
      throw new Error('Invalid user API response structure');
    }

    const user = apiUser;

    return {
      id: user.id!, // Type guard ensures this exists
      primaryEmail: user.primaryEmail!, // Type guard ensures this exists
      name: {
        givenName: user.name?.givenName || '',
        familyName: user.name?.familyName || '',
        fullName: user.name?.fullName || user.primaryEmail!,
      },
      suspended: user.suspended || false,
      orgUnitPath: user.orgUnitPath || '/',
      isAdmin: user.isAdmin || false,
      isDelegatedAdmin: user.isDelegatedAdmin || false,
      lastLoginTime: user.lastLoginTime || '',
      creationTime: user.creationTime || '',
      thumbnailPhotoUrl: user.thumbnailPhotoUrl,
      emails: user.emails?.map((email) => ({
        address: email.address || '',
        primary: email.primary || false,
      })) || [{ address: user.primaryEmail!, primary: true }],
    };
  }

  private mapApiResponseToGroup(apiGroup: unknown): DirectoryGroup {
    if (!isValidGroupApiResponse(apiGroup)) {
      throw new Error('Invalid group API response structure');
    }

    const group = apiGroup;

    return {
      id: group.id!, // Type guard ensures this exists
      email: group.email!, // Type guard ensures this exists
      name: group.name!, // Type guard ensures this exists
      description: group.description,
      directMembersCount: group.directMembersCount || '0',
      adminCreated: group.adminCreated || false,
      aliases: group.aliases || [],
    };
  }

  private matchesUserQuery(user: DirectoryUser, query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      user.name.fullName.toLowerCase().includes(searchTerm) ||
      user.primaryEmail.toLowerCase().includes(searchTerm) ||
      user.orgUnitPath.toLowerCase().includes(searchTerm) ||
      user.name.givenName.toLowerCase().includes(searchTerm) ||
      user.name.familyName.toLowerCase().includes(searchTerm)
    );
  }

  private matchesGroupQuery(group: DirectoryGroup, query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchTerm) ||
      group.email.toLowerCase().includes(searchTerm) ||
      (group.description
        ? group.description.toLowerCase().includes(searchTerm)
        : false)
    );
  }
}
