import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>CEP Compass</mat-card-title>
          <mat-card-subtitle>Please sign in to continue</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <button mat-fab extended (click)="login()" [disabled]="isLoading()">
            @if (isLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>login</mat-icon>
            }
            Sign in with Google
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class LoginComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  public isLoading = signal(false);

  async login(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    try {
      await this.authService.loginWithGoogle();
      // Add explicit navigation after successful OAuth
      await this.router.navigate(['/select-role']);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
