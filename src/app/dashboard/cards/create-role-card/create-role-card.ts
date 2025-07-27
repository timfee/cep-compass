import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';
import { AdminRoleService } from '../../../services/admin-role.service';

@Component({
  selector: 'app-create-role-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-role-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRoleCardComponent {
  public authService = inject(AuthService);
  private adminRoleService = inject(AdminRoleService);

  public isCreating = signal(false);
  public error = signal<string | null>(null);

  async createRole(): Promise<void> {
    this.isCreating.set(true);
    this.error.set(null);

    try {
      const newRole = await this.adminRoleService.createCepAdminRole();
      const roleId = newRole.roleId;
      // Open the admin console in a new tab for the user to assign admins.
      window.open(
        `https://admin.google.com/ac/roles/${roleId}/admins`,
        '_blank'
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(errorMessage);
      console.error(e);
    } finally {
      this.isCreating.set(false);
    }
  }
}
