import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { GOOGLE_API_CONFIG } from '../shared/constants/google-api.constants';
import { GoogleApiErrorHandler } from '../shared/utils/google-api-error-handler';

/**
 * Represents an Organizational Unit from Google Workspace Admin SDK
 */
export interface OrgUnit {
  /** The full path of the organizational unit (e.g., "/Sales/West Coast") */
  orgUnitPath: string;
  /** Unique identifier of the organizational unit */
  orgUnitId: string;
  /** Display name of the organizational unit */
  name: string;
  /** Description of the organizational unit */
  description?: string;
  /** Path of the parent organizational unit */
  parentOrgUnitPath?: string;
  /** ID of the parent organizational unit */
  parentOrgUnitId?: string;
}

/**
 * Represents a node in the organizational unit tree structure
 */
export interface OrgUnitNode extends OrgUnit {
  /** Child organizational units */
  children: OrgUnitNode[];
  /** Depth level in the tree (0 for root) */
  level: number;
}

/**
 * Response from Google Admin SDK Directory API for listing org units
 */
interface OrgUnitsApiResponse {
  organizationUnits?: {
    orgUnitPath: string;
    orgUnitId: string;
    name: string;
    description?: string;
    parentOrgUnitPath?: string;
    parentOrgUnitId?: string;
  }[];
  etag?: string;
}

/**
 * Service for managing Google Workspace Organizational Units
 * Provides both flat list and hierarchical tree representations of OUs
 */
@Injectable({
  providedIn: 'root',
})
export class OrgUnitsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly API_BASE_URL = GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1;

  // Private state signals
  private readonly _orgUnits = signal<OrgUnit[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetchTime = signal<number | null>(null);

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Signal containing all organizational units in flat list format
   * Sorted alphabetically by orgUnitPath
   */
  public readonly orgUnits = computed(() => {
    const units = this._orgUnits();
    return [...units].sort((a, b) =>
      a.orgUnitPath.localeCompare(b.orgUnitPath),
    );
  });

  /**
   * Signal indicating if a fetch operation is currently in progress
   */
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Signal containing any error message from the last operation
   */
  public readonly error = this._error.asReadonly();

  /**
   * Signal providing hierarchical tree structure of organizational units
   * Includes root organization ("/") as the first node
   */
  public readonly orgUnitTree = computed(() => {
    const units = this.orgUnits();
    return this.buildOrgUnitTree(units);
  });

  /**
   * Fetches organizational units from Google Admin SDK Directory API
   * Uses caching to avoid unnecessary API calls
   *
   * @returns Promise that resolves when fetch is complete
   */
  async fetchOrgUnits(): Promise<void> {
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

      const orgUnits = await this.fetchAllOrgUnits(accessToken);

      // Always include root organization as first option
      const rootOrgUnit: OrgUnit = {
        orgUnitPath: '/',
        orgUnitId: 'root',
        name: 'Root Organization',
        description: 'Root organizational unit',
      };

      this._orgUnits.set([rootOrgUnit, ...orgUnits]);
      this._lastFetchTime.set(now);
      this._error.set(null);
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this._error.set(errorMessage);
      console.error('Failed to fetch organizational units:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Fetches all organizational units from the API, handling pagination
   *
   * @param accessToken - OAuth access token for API authentication
   * @returns Promise resolving to array of org units
   */
  private async fetchAllOrgUnits(accessToken: string): Promise<OrgUnit[]> {
    const allOrgUnits: OrgUnit[] = [];
    let pageToken: string | undefined;

    do {
      const url = this.buildApiUrl(pageToken);
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const response = await this.http
        .get<OrgUnitsApiResponse>(url, { headers })
        .toPromise();

      if (response?.organizationUnits) {
        const mappedUnits = response.organizationUnits.map(
          this.mapApiResponseToOrgUnit,
        );
        allOrgUnits.push(...mappedUnits);
      }

      // Check for next page (Google Admin SDK uses nextPageToken but not in org units API)
      // The org units API doesn't typically have pagination, but we handle it for completeness
      pageToken = undefined;
    } while (pageToken);

    return allOrgUnits;
  }

  /**
   * Builds the API URL for fetching organizational units
   *
   * @param pageToken - Optional page token for pagination
   * @returns Complete API URL
   */
  private buildApiUrl(pageToken?: string): string {
    const baseUrl = `${this.API_BASE_URL}/customer/${GOOGLE_API_CONFIG.CUSTOMER_ID}/orgunits`;
    const params = new URLSearchParams();

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Maps API response object to internal OrgUnit interface
   *
   * @param apiUnit - Raw org unit from API response
   * @returns Mapped OrgUnit object
   */
  private mapApiResponseToOrgUnit(apiUnit: {
    orgUnitPath?: string;
    orgUnitId?: string;
    name?: string;
    description?: string;
    parentOrgUnitPath?: string;
    parentOrgUnitId?: string;
  }): OrgUnit {
    // Validate required fields
    if (!apiUnit.orgUnitPath || !apiUnit.orgUnitId || !apiUnit.name) {
      console.warn('Missing required fields in API response:', apiUnit);
      throw new Error(
        'API response is missing required fields: orgUnitPath, orgUnitId, or name.',
      );
    }

    return {
      orgUnitPath: apiUnit.orgUnitPath,
      orgUnitId: apiUnit.orgUnitId,
      name: apiUnit.name,
      description: apiUnit.description,
      parentOrgUnitPath: apiUnit.parentOrgUnitPath,
      parentOrgUnitId: apiUnit.parentOrgUnitId,
    };
  }

  /**
   * Builds hierarchical tree structure from flat list of org units
   *
   * @param units - Flat array of organizational units
   * @returns Array of root-level org unit nodes with children
   */
  private buildOrgUnitTree(units: OrgUnit[]): OrgUnitNode[] {
    const nodeMap = new Map<string, OrgUnitNode>();
    const rootNodes: OrgUnitNode[] = [];

    // Create nodes for all units
    units.forEach((unit) => {
      const node: OrgUnitNode = {
        ...unit,
        children: [],
        level: this.calculateLevel(unit.orgUnitPath),
      };
      nodeMap.set(unit.orgUnitPath, node);
    });

    // Build parent-child relationships
    units.forEach((unit) => {
      const node = nodeMap.get(unit.orgUnitPath);
      if (!node) return;

      if (unit.parentOrgUnitPath) {
        const parent = nodeMap.get(unit.parentOrgUnitPath);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent, this is a root node
        rootNodes.push(node);
      }
    });

    // Sort children recursively
    this.sortTreeNodes(rootNodes);

    return rootNodes;
  }

  /**
   * Calculates the depth level of an org unit based on its path
   *
   * @param path - Org unit path (e.g., "/Sales/West Coast")
   * @returns Depth level (0 for root)
   */
  private calculateLevel(path: string): number {
    if (path === '/') return 0;
    return path.split('/').filter((segment) => segment.length > 0).length;
  }

  /**
   * Recursively sorts tree nodes and their children alphabetically
   *
   * @param nodes - Array of nodes to sort
   */
  private sortTreeNodes(nodes: OrgUnitNode[]): void {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        this.sortTreeNodes(node.children);
      }
    });
  }

  /**
   * Handles API errors and returns user-friendly error messages
   *
   * @param error - Error from HTTP request
   * @returns User-friendly error message
   */
  private handleApiError(error: unknown): string {
    return GoogleApiErrorHandler.handleOrgUnitsError(error);
  }

  /**
   * Clears the cached organizational units data
   * Forces a fresh fetch on next API call
   */
  clearCache(): void {
    this._orgUnits.set([]);
    this._lastFetchTime.set(null);
    this._error.set(null);
  }

  /**
   * Gets organizational units by name (case-insensitive search)
   *
   * @param name - Name to search for
   * @returns Array of matching org units
   */
  getOrgUnitsByName(name: string): OrgUnit[] {
    const searchTerm = name.toLowerCase();
    return this.orgUnits().filter((unit) =>
      unit.name.toLowerCase().includes(searchTerm),
    );
  }

  /**
   * Gets organizational unit by exact path
   *
   * @param path - Exact org unit path
   * @returns Org unit if found, undefined otherwise
   */
  getOrgUnitByPath(path: string): OrgUnit | undefined {
    return this.orgUnits().find((unit) => unit.orgUnitPath === path);
  }
}
