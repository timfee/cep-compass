import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
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
import { Clipboard } from '@angular/cdk/clipboard';

import {
  AdminRoleService,
  AdminRole,
  RoleCreationResponse,
  CEP_ADMIN_ROLE,
  RolePrivilege,
} from '../../services/admin-role.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';

type ComponentState =
  | 'checking'
  | 'exists'
  | 'ready'
  | 'creating'
  | 'success'
  | 'error';

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
    MatExpansionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-role.component.html',
  styles: [`
    .create-role-card {
      max-width: 800px;
      margin: 2rem auto;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }

    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
    }

    .existing-role-content,
    .ready-content,
    .success-content,
    .error-content {
      padding: 1rem;
      text-align: center;
    }

    .large-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
    }

    .success-icon {
      color: #4caf50;
    }

    .status-text {
      margin-top: 1rem;
      font-size: 1.1rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .status-detail {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .role-info {
      margin: 1rem 0;
      font-size: 1rem;
    }

    .description {
      margin: 1rem 0;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
    }

    .privileges-section {
      margin: 2rem 0;
    }

    .privileges-section h4 {
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .privileges-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }

    .privileges-list mat-list-item {
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .privileges-list mat-list-item:last-child {
      border-bottom: none;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 2rem;
    }

    .primary-action,
    .create-button,
    .retry-button {
      min-width: 200px;
    }

    .secondary-action {
      min-width: 150px;
    }

    .next-steps {
      margin-top: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .steps-list {
      padding-left: 1.5rem;
      line-height: 1.8;
    }

    .steps-list li {
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: #f44336;
      font-weight: 500;
      margin: 1rem 0;
      padding: 1rem;
      background-color: #ffebee;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .create-role-card {
        margin: 1rem;
        max-width: none;
      }

      .center-content,
      .existing-role-content,
      .ready-content,
      .success-content,
      .error-content {
        padding: 1rem 0.5rem;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .primary-action,
      .secondary-action,
      .create-button,
      .retry-button {
        min-width: auto;
        width: 100%;
        max-width: 300px;
      }

      .large-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }

      .privileges-list {
        max-height: 200px;
      }
    }

    /* Accessibility improvements */
    .create-button:focus,
    .primary-action:focus,
    .retry-button:focus {
      outline: 2px solid #3f51b5;
      outline-offset: 2px;
    }

    .secondary-action:focus {
      outline: 2px solid rgba(0, 0, 0, 0.54);
      outline-offset: 2px;
    }

    /* Animation for state transitions */
    .center-content,
    .existing-role-content,
    .ready-content,
    .success-content,
    .error-content {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Progress bar styling */
    mat-progress-bar {
      margin-bottom: 1rem;
      width: 100%;
      max-width: 400px;
    }

    /* Expansion panel styling */
    .next-steps mat-expansion-panel-header {
      font-weight: 500;
    }

    /* List item icon styling */
    mat-list-item mat-icon[matListItemIcon] {
      color: #4caf50;
    }
  `],
})
export class CreateRoleComponent {
  private readonly adminRoleService = inject(AdminRoleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly clipboard = inject(Clipboard);

  // Component state management with signals
  private readonly componentState = signal<RoleCreationState>({
    state: 'checking',
    checking: true,
    roleExists: false,
    creating: false,
    success: false,
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
          existingRoleId: result.role.roleId,
        });
      } else {
        this.updateState({
          checking: false,
          roleExists: false,
          state: 'ready',
        });
      }
    } catch (error) {
      console.error('Error checking for existing role:', error);
      this.setError(
        error instanceof Error
          ? error.message
          : 'Failed to check for existing role',
      );
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
        createdRole,
      });

      this.notificationService.success('CEP Admin role created successfully!');
    } catch (error) {
      console.error('Error creating role:', error);
      this.setError(
        error instanceof Error
          ? error.message
          : 'Failed to create CEP Admin role',
      );
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
      this.notificationService.success('Role ID copied to clipboard!');
    }
  }

  retry(): void {
    this.checkForExistingRole();
  }

  private updateState(updates: Partial<RoleCreationState>): void {
    this.componentState.update((current) => ({ ...current, ...updates }));
  }

  formatPrivilege(privilege: RolePrivilege): string {
    return privilege.privilegeName;
  }

  private setError(errorMessage: string): void {
    this.updateState({
      checking: false,
      creating: false,
      state: 'error',
      error: errorMessage,
    });
  }
}
