import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="main-toolbar">
      <span>CEP Compass</span>
      <span class="spacer"></span>

      @if (authService.user(); as user) {
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
          @if (user.photoURL) {
            <img [src]="user.photoURL" alt="User Photo" class="user-avatar" />
          } @else {
            <mat-icon>account_circle</mat-icon>
          }
          <span>{{ user.displayName }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="changeRole()">
            <mat-icon>swap_horiz</mat-icon>
            <span>Change Role</span>
          </button>
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      }
    </mat-toolbar>

    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  public authService = inject(AuthService);
  private router = inject(Router);

  changeRole(): void {
    this.authService.selectRole(null);
    this.router.navigate(['/select-role']);
  }
}
