import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, SelectedRole } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';

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
  ],
})
export class SelectRoleComponent implements OnInit {
  public authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // A signal to track the loading state, derived from the user signal.
  public isLoading = computed(() => this.authService.user() === undefined);

  async ngOnInit(): Promise<void> {
    // Refresh available roles when the component loads
    try {
      await this.authService.refreshAvailableRoles();
    } catch {
      this.notificationService.error('Failed to refresh available roles. Please try again later.');
    }
  }

  selectRole(role: SelectedRole): void {
    if (!role) return;
    this.authService.selectRole(role);
    // No need to navigate, the app component will react to the role change.
  }
}
