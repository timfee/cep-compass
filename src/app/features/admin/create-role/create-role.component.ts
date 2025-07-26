import { 
  ChangeDetectionStrategy, 
  Component, 
  inject, 
  signal, 
  computed 
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

import { 
  AdminRoleService, 
  AdminRole, 
  RoleCreationResponse, 
  CEP_ADMIN_ROLE,
  RolePrivilege
} from '../../../services/admin-role.service';
import { AuthService } from '../../../auth/auth.service';

type ComponentState = 'checking' | 'exists' | 'ready' | 'creating' | 'success' | 'error';

interface RoleCreationState {
  state: ComponentState;
  checking: boolean;
  roleExists: boolean;
  existingRoleId?: string;
  creating: boolean;
  error?: string;
  success: boolean;
  existingRole?: AdminRole;
  createdRole?: RoleCreationResponse;
}

@Component({
  selector: 'app-create-role',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatListModule,
    MatExpansionModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-role.component.html',
  styleUrl: './create-role.component.css'
})
export class CreateRoleComponent {
  private readonly adminRoleService = inject(AdminRoleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  // Component state management with signals
  private readonly componentState = signal<RoleCreationState>({
    state: 'checking',
    checking: true,
    roleExists: false,
    creating: false,
    success: false
  });

  // Computed values for template
  readonly state = computed(() => this.componentState().state);
  readonly checking = computed(() => this.componentState().checking);
  readonly roleExists = computed(() => this.componentState().roleExists);
  readonly creating = computed(() => this.componentState().creating);
  readonly error = computed(() => this.componentState().error);
  readonly success = computed(() => this.componentState().success);
  readonly existingRole = computed(() => this.componentState().existingRole);
  readonly createdRole = computed(() => this.componentState().createdRole);

  // CEP Admin privileges for display
  readonly privileges = CEP_ADMIN_ROLE.rolePrivileges;

  constructor() {
    this.checkForExistingRole();
  }

  private async checkForExistingRole(): Promise<void> {
    try {
      // Check if user has Super Admin role
      const userRoles = this.authService.availableRoles();
      if (!userRoles.isSuperAdmin) {
        this.setError('Super Admin role required to create CEP Admin roles');
        return;
      }

      this.updateState({ checking: true, state: 'checking' });

      const result = await this.adminRoleService.checkCepAdminRoleExists();
      
      if (result.exists && result.role) {
        this.updateState({
          checking: false,
          roleExists: true,
          state: 'exists',
          existingRole: result.role,
          existingRoleId: result.role.roleId
        });
      } else {
        this.updateState({
          checking: false,
          roleExists: false,
          state: 'ready'
        });
      }
    } catch (error) {
      console.error('Error checking for existing role:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to check for existing role');
    }
  }

  async createRole(): Promise<void> {
    try {
      this.updateState({ creating: true, state: 'creating' });

      const createdRole = await this.adminRoleService.createCepAdminRole();
      
      this.updateState({
        creating: false,
        success: true,
        state: 'success',
        createdRole
      });

      this.snackBar.open('CEP Admin role created successfully!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error creating role:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to create CEP Admin role');
    }
  }

  openAdminConsole(): void {
    const roleId = this.existingRole()?.roleId || this.createdRole()?.roleId;
    if (roleId) {
      const url = this.adminRoleService.getAdminConsoleUrl(roleId);
      window.open(url, '_blank');
    }
  }

  copyRoleId(): void {
    const roleId = this.existingRole()?.roleId || this.createdRole()?.roleId;
    if (roleId) {
      this.clipboard.copy(roleId);
      this.snackBar.open('Role ID copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }

  retry(): void {
    this.checkForExistingRole();
  }

  private updateState(updates: Partial<RoleCreationState>): void {
    this.componentState.update(current => ({ ...current, ...updates }));
  }

  formatPrivilege(privilege: RolePrivilege): string {
    return privilege.privilegeName;
  }

  private setError(errorMessage: string): void {
    this.updateState({
      checking: false,
      creating: false,
      state: 'error',
      error: errorMessage
    });
  }
}