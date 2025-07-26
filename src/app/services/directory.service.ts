import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

// --- TYPE DEFINITIONS ---

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

/**
 * Service for managing Google Workspace Directory Users and Groups
 * Provides efficient pagination, search, and caching capabilities
 */
@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly API_BASE_URL =
    'https://www.googleapis.com/admin/directory/v1';

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Pagination state
  private userPageToken: string | null = null;
  private groupPageToken: string | null = null;

  // Private state signals
  private readonly _users = signal<DirectoryUser[]>([]);
  private readonly _groups = signal<DirectoryGroup[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetchTime = signal<number | null>(null);
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
   * Signal indicating if a fetch operation is currently in progress
   */
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Signal containing any error message from the last operation
   */
  public readonly error = this._error.asReadonly();

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
    const lastFetch = this._lastFetchTime();

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
    const lastFetch = this._lastFetchTime();
    const now = Date.now();
    if (lastFetch && now - lastFetch < this.CACHE_DURATION) {
      return;
    }

    // Check if user is authenticated
    const currentUser = this.authService.user();
    if (!currentUser) {
      this._error.set('User not authenticated');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const accessToken = await this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      // Reset pagination tokens and data
      this.userPageToken = null;
      this.groupPageToken = null;
      this._users.set([]);
      this._groups.set([]);
      this._hasMoreUsers.set(true);
      this._hasMoreGroups.set(true);

      // Fetch initial users and groups concurrently
      await Promise.all([
        this.loadUsersPage(accessToken, 100),
        this.loadGroupsPage(accessToken, 50),
      ]);

      this._lastFetchTime.set(now);
      this._error.set(null);
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this._error.set(errorMessage);
      console.error('Failed to fetch initial directory data:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Loads more users (pagination)
   */
  async loadMoreUsers(): Promise<void> {
    if (!this._hasMoreUsers() || this._isLoading()) {
      return;
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      this._error.set('User not authenticated');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const accessToken = await this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      await this.loadUsersPage(accessToken, 100);
      this._error.set(null);
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this._error.set(errorMessage);
      console.error('Failed to load more users:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Loads more groups (pagination)
   */
  async loadMoreGroups(): Promise<void> {
    if (!this._hasMoreGroups() || this._isLoading()) {
      return;
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      this._error.set('User not authenticated');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const accessToken = await this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      await this.loadGroupsPage(accessToken, 100);
      this._error.set(null);
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this._error.set(errorMessage);
      console.error('Failed to load more groups:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Searches users by query string
   */
  async searchUsers(query: string): Promise<DirectoryUser[]> {
    if (query.length < 3) {
      return this._users().filter((user) => this.matchesUserQuery(user, query));
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const accessToken = await this.authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const url = this.buildUsersApiUrl(undefined, 200, query);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.http
      .get<UsersApiResponse>(url, { headers })
      .toPromise();

    if (response?.users) {
      return response.users.map(this.mapApiResponseToUser);
    }

    return [];
  }

  /**
   * Searches groups by query string
   */
  async searchGroups(query: string): Promise<DirectoryGroup[]> {
    if (query.length < 3) {
      return this._groups().filter((group) =>
        this.matchesGroupQuery(group, query),
      );
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const accessToken = await this.authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const url = this.buildGroupsApiUrl(undefined, 200, undefined, query);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.http
      .get<GroupsApiResponse>(url, { headers })
      .toPromise();

    if (response?.groups) {
      return response.groups.map(this.mapApiResponseToGroup);
    }

    return [];
  }

  /**
   * Gets groups that a user belongs to
   */
  async getUserGroups(userEmail: string): Promise<DirectoryGroup[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const accessToken = await this.authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const url = this.buildGroupsApiUrl(undefined, 200, userEmail);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.http
      .get<GroupsApiResponse>(url, { headers })
      .toPromise();

    if (response?.groups) {
      return response.groups.map(this.mapApiResponseToGroup);
    }

    return [];
  }

  /**
   * Gets members of a group
   */
  async getGroupMembers(groupEmail: string): Promise<DirectoryUser[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const accessToken = await this.authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const allMembers: DirectoryUser[] = [];
    let pageToken: string | undefined;

    do {
      const url = this.buildGroupMembersApiUrl(groupEmail, pageToken, 200);
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const response = await this.http
        .get<GroupMembersApiResponse>(url, { headers })
        .toPromise();

      if (response?.members) {
        // Get full user details for each member
        const memberEmails = response.members
          .filter((member) => member.email)
          .map((member) => member.email!);

        for (const email of memberEmails) {
          try {
            const user = await this.getUserByEmail(email, accessToken);
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
  }

  /**
   * Refreshes cached statistics
   */
  async refreshStats(): Promise<void> {
    this._lastFetchTime.set(null); // Clear cache
    await this.fetchInitialData();
  }

  /**
   * Clears all cached data
   */
  clearCache(): void {
    this._users.set([]);
    this._groups.set([]);
    this._lastFetchTime.set(null);
    this._error.set(null);
    this.userPageToken = null;
    this.groupPageToken = null;
    this._hasMoreUsers.set(true);
    this._hasMoreGroups.set(true);
  }

  // --- PRIVATE METHODS ---

  private async loadUsersPage(
    accessToken: string,
    maxResults: number,
  ): Promise<void> {
    const url = this.buildUsersApiUrl(this.userPageToken, maxResults);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.http
      .get<UsersApiResponse>(url, { headers })
      .toPromise();

    if (response?.users) {
      const newUsers = response.users.map(this.mapApiResponseToUser);
      const currentUsers = this._users();
      this._users.set([...currentUsers, ...newUsers]);
    }

    this.userPageToken = response?.nextPageToken || null;
    this._hasMoreUsers.set(!!this.userPageToken);
  }

  private async loadGroupsPage(
    accessToken: string,
    maxResults: number,
  ): Promise<void> {
    const url = this.buildGroupsApiUrl(this.groupPageToken, maxResults);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.http
      .get<GroupsApiResponse>(url, { headers })
      .toPromise();

    if (response?.groups) {
      const newGroups = response.groups.map(this.mapApiResponseToGroup);
      const currentGroups = this._groups();
      this._groups.set([...currentGroups, ...newGroups]);
    }

    this.groupPageToken = response?.nextPageToken || null;
    this._hasMoreGroups.set(!!this.groupPageToken);
  }

  private async getUserByEmail(
    email: string,
    accessToken: string,
  ): Promise<DirectoryUser | null> {
    const url = `${this.API_BASE_URL}/users/${encodeURIComponent(email)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await this.http
        .get<unknown>(url, { headers })
        .toPromise();

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
    const params = new URLSearchParams();

    params.set('customer', 'my_customer');

    if (maxResults) {
      params.set('maxResults', Math.min(maxResults, 500).toString());
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    if (query) {
      params.set('query', query);
    }

    // Request only needed fields for performance
    params.set(
      'fields',
      'users(id,primaryEmail,name,suspended,orgUnitPath,isAdmin,isDelegatedAdmin,lastLoginTime,creationTime,thumbnailPhotoUrl,emails),nextPageToken',
    );

    return `${baseUrl}?${params.toString()}`;
  }

  private buildGroupsApiUrl(
    pageToken?: string | null,
    maxResults?: number,
    userKey?: string,
    query?: string,
  ): string {
    const baseUrl = `${this.API_BASE_URL}/groups`;
    const params = new URLSearchParams();

    params.set('customer', 'my_customer');

    if (maxResults) {
      params.set('maxResults', Math.min(maxResults, 200).toString());
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    if (userKey) {
      params.set('userKey', userKey);
    }

    if (query) {
      params.set('query', query);
    }

    // Request only needed fields for performance
    params.set(
      'fields',
      'groups(id,email,name,description,directMembersCount,adminCreated,aliases),nextPageToken',
    );

    return `${baseUrl}?${params.toString()}`;
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
    const user = apiUser as {
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
    };

    // Validate required fields
    if (!user.id || !user.primaryEmail) {
      throw new Error('API response is missing required user fields');
    }

    return {
      id: user.id,
      primaryEmail: user.primaryEmail,
      name: {
        givenName: user.name?.givenName || '',
        familyName: user.name?.familyName || '',
        fullName: user.name?.fullName || user.primaryEmail,
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
      })) || [{ address: user.primaryEmail, primary: true }],
    };
  }

  private mapApiResponseToGroup(apiGroup: unknown): DirectoryGroup {
    const group = apiGroup as {
      id?: string;
      email?: string;
      name?: string;
      description?: string;
      directMembersCount?: string;
      adminCreated?: boolean;
      aliases?: string[];
    };

    // Validate required fields
    if (!group.id || !group.email || !group.name) {
      throw new Error('API response is missing required group fields');
    }

    return {
      id: group.id,
      email: group.email,
      name: group.name,
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

  private handleApiError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'Insufficient permissions to access directory. Please ensure you have the required admin privileges.';
        case 404:
          return 'Directory service not found. Please check your Google Workspace configuration.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Google service temporarily unavailable. Please try again later.';
        default:
          return `Failed to fetch directory data: ${error.message || 'Unknown error'}`;
      }
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return `Error: ${(error as Error).message}`;
    }

    return 'Failed to fetch directory data. Please try again.';
  }
}
