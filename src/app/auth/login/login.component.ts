import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
})
export class LoginComponent {
  public authService = inject(AuthService);
  private router = inject(Router);
  
  public isLoggingIn = signal(false);

  async login(): Promise<void> {
    if (this.isLoggingIn()) return;
    
    this.isLoggingIn.set(true);
    try {
      await this.authService.loginWithGoogle();
      // Explicitly navigate to role selection after successful login
      await this.router.navigate(['/select-role']);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this.isLoggingIn.set(false);
    }
  }
}
