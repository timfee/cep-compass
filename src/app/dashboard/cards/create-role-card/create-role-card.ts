import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../auth/auth.service';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { admin_directory_v1 } from 'googleapis';
import { signal } from '@angular/core';

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
  private functions = inject(Functions);

  public isCreating = signal(false);
  public error = signal<string | null>(null);

  async createRole(): Promise<void> {
    this.isCreating.set(true);
    this.error.set(null);
    const createRoleFn = httpsCallableData<
      void,
      admin_directory_v1.Schema$Role
    >(this.functions, 'createCepAdminRole');

    try {
      const newRole = await createRoleFn();
      const roleId = newRole.roleId;
      // Open the admin console in a new tab for the user to assign admins.
      window.open(
        `https://admin.google.com/ac/roles/${roleId}/admins`,
        '_blank'
      );
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    } finally {
      this.isCreating.set(false);
    }
  }
}
