import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  CEP_ADMIN_PRIVILEGES,
  GoogleApiUtils,
  Privilege,
} from '../shared/constants/google-api.constants';

export type RolePrivilege = Privilege;

export interface AdminRole {
  kind: string;
  etag?: string;
  roleId?: string;
  roleName: string;
  roleDescription: string;
  rolePrivileges: RolePrivilege[];
  isSystemRole?: boolean;
  isSuperAdminRole?: boolean;
}

export interface RoleCreationResponse {
  kind: string;
  etag: string;
  roleId: string;
  roleName: string;
  roleDescription: string;
  rolePrivileges: RolePrivilege[];
  isSystemRole: boolean;
  isSuperAdminRole: boolean;
}

export interface RoleListResponse {
  kind: string;
  etag?: string;
  items?: AdminRole[];
  nextPageToken?: string;
}

// CEP Admin role configuration using shared privilege definitions
export const CEP_ADMIN_ROLE: Omit<AdminRole, 'kind'> = {
  roleName: 'CEP Admin',
  roleDescription:
    'Chrome Enterprise Plus Administrator - Manages Chrome browsers, profiles, and policies',
  rolePrivileges: CEP_ADMIN_PRIVILEGES,
};

@Injectable({
  providedIn: 'root',
})
export class AdminRoleService {
  private readonly httpClient = inject(HttpClient);

  private readonly BASE_URL = GoogleApiUtils.buildCustomerUrl('roles');

  /**
   * Check if the CEP Admin role already exists
   */
  async checkCepAdminRoleExists(): Promise<{
    exists: boolean;
    role?: AdminRole;
  }> {
    try {
      // Get all roles and search for CEP Admin
      const response = await firstValueFrom(
        this.httpClient.get<RoleListResponse>(this.BASE_URL),
      );

      if (response?.items) {
        const existingRole = response.items.find(
          (role) => role.roleName === CEP_ADMIN_ROLE.roleName,
        );

        if (existingRole) {
          return { exists: true, role: existingRole };
        }
      }

      return { exists: false };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 403
      ) {
        throw new Error(
          'Insufficient permissions. Super Admin role required to manage roles.',
        );
      }
      console.error('Error checking for existing role:', error);
      throw new Error('Failed to check for existing CEP Admin role');
    }
  }

  /**
   * Create the CEP Admin role
   */
  async createCepAdminRole(): Promise<RoleCreationResponse> {
    const rolePayload: AdminRole = {
      kind: 'admin#directory#role',
      ...CEP_ADMIN_ROLE,
    };

    try {
      const response = await firstValueFrom(
        this.httpClient.post<RoleCreationResponse>(this.BASE_URL, rolePayload),
      );

      if (!response) {
        throw new Error('No response received from API');
      }

      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 409) {
          throw new Error('CEP Admin role already exists');
        } else if (error.status === 403) {
          throw new Error(
            'Insufficient permissions. Super Admin role required to create roles.',
          );
        } else if (error.status === 400) {
          console.error('Invalid role configuration:', error);
          throw new Error(
            'Invalid role configuration. Please check the role privileges.',
          );
        }
      }

      console.error('Error creating CEP Admin role:', error);
      throw new Error('Failed to create CEP Admin role');
    }
  }

  /**
   * Get role details by ID
   */
  async getRoleById(roleId: string): Promise<AdminRole> {
    try {
      const response = await firstValueFrom(
        this.httpClient.get<AdminRole>(`${this.BASE_URL}/${roleId}`),
      );

      if (!response) {
        throw new Error('Role not found');
      }

      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 404) {
          throw new Error('Role not found');
        } else if (error.status === 403) {
          throw new Error('Insufficient permissions to view role details');
        }
      }

      console.error('Error fetching role details:', error);
      throw new Error('Failed to fetch role details');
    }
  }

  /**
   * Format privilege name for display
   */
  formatPrivilegeName(privilege: RolePrivilege): string {
    return privilege.privilegeName
      .replace(/^(MANAGE_|READ_)/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Generate admin console URL for role management
   */
  getAdminConsoleUrl(roleId: string): string {
    return `https://admin.google.com/ac/roles/${roleId}/admins`;
  }
}
