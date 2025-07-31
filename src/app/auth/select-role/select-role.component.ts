import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, SelectedRole } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';
import { LoadingComponent } from '../../shared/components';
import { UserRole } from '../../shared/constants/enums';

@Component({
  selector: 'app-select-role',
  template: `
    <div class="role-selection-container">
      @if (isLoading()) {
        <app-loading
          type="spinner"
          message="Loading available roles..."
          [diameter]="50"
        >
        </app-loading>
      } @else {
        <mat-card>
          <mat-card-header>
            <mat-card-title>Select a Role</mat-card-title>
            <mat-card-subtitle
              >Choose a role to assume for this session.</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content>
            <div class="role-options">
              <button
                mat-flat-button
                color="primary"
                [disabled]="
                  !authService.availableRoles().isSuperAdmin ||
                  isSelectingRole()
                "
                (click)="selectRole(UserRole.SUPER_ADMIN)"
                [attr.aria-label]="'Select Super Admin role. ' + 
                  (!authService.availableRoles().isSuperAdmin 
                    ? 'Not available - Super Admin privileges required.'
                    : 'Available and ready to select.')"
              >
                @if (isSelectingRole()) {
                  <mat-spinner diameter="20"></mat-spinner>
                }
                Super Admin
              </button>
              <button
                mat-flat-button
                color="accent"
                [disabled]="
                  !authService.availableRoles().isCepAdmin || isSelectingRole()
                "
                (click)="selectRole(UserRole.CEP_ADMIN)"
                [attr.aria-label]="'Select CEP Delegated Admin role. ' + 
                  (!authService.availableRoles().isCepAdmin 
                    ? 'Not available - Required privileges missing.'
                    : 'Available and ready to select.')"
              >
                @if (isSelectingRole()) {
                  <mat-spinner diameter="20"></mat-spinner>
                }
                CEP Delegated Admin
              </button>
            </div>

            @if (
              !authService.availableRoles().isCepAdmin &&
              authService.availableRoles().missingPrivileges?.length
            ) {
              <div class="error-message">
                <h4>CEP Delegated Admin Role Unavailable</h4>
                <p>
                  The CEP Delegated Admin role is not available because your
                  assigned roles are missing the following required privileges:
                </p>
                <ul>
                  @for (
                    priv of authService.availableRoles().missingPrivileges;
                    track priv.privilegeName
                  ) {
                    <li>
                      <strong>{{ priv.privilegeName }}</strong>
                      <span>(Service ID: {{ priv.serviceId }})</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .role-selection-container {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      mat-card {
        width: 100%;
        max-width: 400px;
      }

      .role-options {
        display: flex;
        justify-content: center;
        gap: 16px;
        padding-top: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    LoadingComponent,
  ],
})
export class SelectRoleComponent implements OnInit {
  public authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Expose enum for template usage
  public readonly UserRole = UserRole;

  // A signal to track the loading state, derived from the user signal.
  public isLoading = computed(() => this.authService.user() === undefined);
  public isSelectingRole = signal(false);

  async ngOnInit(): Promise<void> {
    // Refresh available roles when the component loads
    try {
      this.isSelectingRole.set(true);
      await this.authService.refreshAvailableRoles();
    } catch (error) {
      console.error('Failed to refresh available roles:', error);
      this.notificationService.error(
        'Failed to load role information. Please try refreshing the page.',
      );
    } finally {
      this.isSelectingRole.set(false);
    }
  }

  async selectRole(role: SelectedRole): Promise<void> {
    if (!role || this.isSelectingRole()) return;

    this.isSelectingRole.set(true);
    try {
      this.authService.selectRole(role);
      // Add automatic navigation to dashboard after role selection
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Role selection failed:', error);
      this.notificationService.error(
        'Failed to select role. Please try again.',
      );
    } finally {
      this.isSelectingRole.set(false);
    }
  }
}
