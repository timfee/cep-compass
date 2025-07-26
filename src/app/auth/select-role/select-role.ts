import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, SelectedRole } from '../auth.service';

@Component({
  selector: 'app-select-role',
  templateUrl: './select-role.html',
  styleUrl: './select-role.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
})
export class SelectRoleComponent {
  public authService = inject(AuthService);

  // A signal to track the loading state, derived from the user signal.
  public isLoading = computed(() => this.authService.user() === undefined);

  selectRole(role: SelectedRole): void {
    if (!role) return;
    this.authService.selectRole(role);
    // No need to navigate, the app component will react to the role change.
  }
}
