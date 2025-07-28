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
import { LoadingSpinnerComponent } from '../../shared/components';

@Component({
  selector: 'app-select-role',
  templateUrl: './select-role.component.html',
  styleUrl: './select-role.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
})
export class SelectRoleComponent implements OnInit {
  public authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // A signal to track the loading state, derived from the user signal.
  public isLoading = computed(() => this.authService.user() === undefined);
  public isSelectingRole = signal(false);

  async ngOnInit(): Promise<void> {
    // Refresh available roles when the component loads
    try {
      await this.authService.refreshAvailableRoles();
    } catch {
      this.notificationService.error(
        'Failed to refresh available roles. Please try again later.',
      );
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
      this.notificationService.error('Failed to select role. Please try again.');
    } finally {
      this.isSelectingRole.set(false);
    }
  }
}
