import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async login(): Promise<void> {
    await this.authService.loginWithGoogle();
    this.router.navigate(['/']);
  }
}
