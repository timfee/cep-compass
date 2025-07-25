import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SelectedRole } from '../auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-select-role',
  templateUrl: './select-role.html',
  styleUrl: './select-role.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
})
export class SelectRoleComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  selectRole(role: SelectedRole): void {
    if (!role) return;
    this.authService.selectRole(role);
    this.router.navigate(['/']);
  }
}
