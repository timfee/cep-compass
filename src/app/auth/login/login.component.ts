import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
})
export class LoginComponent {
  public authService = inject(AuthService);

  async login(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
      // Navigation is now handled by the auth guards and effects.
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
}
