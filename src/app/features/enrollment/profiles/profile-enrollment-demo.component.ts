import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { DirectoryStats } from '../../../services/directory.service';

/**
 * Standalone Demo Component for Profile Enrollment
 * Demonstrates the Profile Enrollment UI without requiring authentication
 */
@Component({
  selector: 'app-profile-enrollment-demo',
  template: `
    <div class="profile-enrollment-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>account_circle</mat-icon>
          <mat-card-title>User Profile Enrollment</mat-card-title>
          <mat-card-subtitle
            >Help users sign in to Chrome with managed
            accounts</mat-card-subtitle
          >
        </mat-card-header>

        <mat-card-content>
          <!-- Directory Statistics Section -->
          <section class="stats-section">
            <h3>Directory Overview</h3>

            @if (isLoading()) {
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            }

            @if (error()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                <span>{{ error() }}</span>
                <button mat-button (click)="refreshStats()">Retry</button>
              </div>
            }

            <div class="stats-grid">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ mockStats().totalUsers }}</div>
                  <div class="stat-label">Total Users</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ mockStats().activeUsers }}</div>
                  <div class="stat-label">Active Users</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ mockStats().suspendedUsers }}</div>
                  <div class="stat-label">Suspended</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ mockStats().totalGroups }}</div>
                  <div class="stat-label">Groups</div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="sync-info">
              <mat-icon>sync</mat-icon>
              <span
                >Last synced:
                {{ mockStats().lastSyncTime | date: 'short' }}</span
              >
              <button
                mat-icon-button
                (click)="refreshStats()"
                matTooltip="Refresh"
                [disabled]="isLoading()"
              >
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Email Instructions Section -->
          <section class="email-section">
            <h3>User Instructions</h3>
            <p>
              Draft an email to educate users about signing in to Chrome with
              their work accounts.
            </p>

            <div class="email-actions">
              <button
                mat-raised-button
                color="primary"
                (click)="draftSingleEmail()"
              >
                <mat-icon>email</mat-icon>
                Draft Individual Email
              </button>

              <button
                mat-raised-button
                color="accent"
                (click)="draftBulkEmail()"
              >
                <mat-icon>mail_outline</mat-icon>
                Prepare Bulk Email
              </button>
            </div>

            <mat-expansion-panel class="instructions-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>info</mat-icon>
                  Quick Reference: User Sign-in Steps
                </mat-panel-title>
              </mat-expansion-panel-header>

              <mat-list>
                <mat-list-item>
                  <mat-icon matListItemIcon>looks_one</mat-icon>
                  <span matListItemTitle
                    >Open Chrome and click profile icon</span
                  >
                </mat-list-item>
                <mat-list-item>
                  <mat-icon matListItemIcon>looks_two</mat-icon>
                  <span matListItemTitle
                    >Click "Turn on sync" or "Sign in to Chrome"</span
                  >
                </mat-list-item>
                <mat-list-item>
                  <mat-icon matListItemIcon>looks_3</mat-icon>
                  <span matListItemTitle>Enter work email address</span>
                </mat-list-item>
                <mat-list-item>
                  <mat-icon matListItemIcon>looks_4</mat-icon>
                  <span matListItemTitle>Complete SSO authentication</span>
                </mat-list-item>
                <mat-list-item>
                  <mat-icon matListItemIcon>looks_5</mat-icon>
                  <span matListItemTitle>Accept sync and management</span>
                </mat-list-item>
              </mat-list>
            </mat-expansion-panel>
          </section>

          <mat-divider></mat-divider>

          <!-- Additional Resources -->
          <section class="resources-section">
            <h3>Additional Actions</h3>

            <button mat-stroked-button (click)="exportUserList()">
              <mat-icon>download</mat-icon>
              Export User List
            </button>

            <a
              mat-stroked-button
              href="https://support.google.com/chrome/a/answer/7394216"
              target="_blank"
            >
              <mat-icon>help</mat-icon>
              Chrome Sign-in Guide
            </a>
          </section>
        </mat-card-content>
      </mat-card>

      <!-- Demo Note -->
      <mat-card class="demo-note">
        <mat-card-content>
          <mat-icon>info</mat-icon>
          <strong>Demo Mode:</strong> This is a demonstration of the Profile
          Enrollment component. In a real environment, this would integrate with
          Google Workspace Directory API and Email Template services.
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './profile-enrollment.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
})
export class ProfileEnrollmentDemoComponent {
  private readonly snackBar = signal(null); // Mock inject

  // Mock state signals
  public readonly isLoading = signal(false);
  public readonly error = signal<string | null>(null);

  // Mock directory stats
  public readonly mockStats = signal<DirectoryStats>({
    totalUsers: 1247,
    activeUsers: 1189,
    suspendedUsers: 58,
    totalGroups: 142,
    lastSyncTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  });

  /**
   * Mock refresh functionality
   */
  refreshStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Simulate API call delay
    setTimeout(() => {
      // Update stats with slightly different numbers
      const currentStats = this.mockStats();
      this.mockStats.set({
        ...currentStats,
        lastSyncTime: new Date(),
        totalUsers: currentStats.totalUsers + Math.floor(Math.random() * 5),
      });
      this.isLoading.set(false);
    }, 1500);
  }

  /**
   * Mock email drafting
   */
  draftSingleEmail(): void {
    alert('Demo: Would open email composer for individual email template');
  }

  /**
   * Mock bulk email drafting
   */
  draftBulkEmail(): void {
    alert(
      'Demo: Would open email composer for bulk email to all active users (1189 recipients)',
    );
  }

  /**
   * Mock user list export
   */
  exportUserList(): void {
    alert('Demo: Would export CSV file with user list (1247 users)');
  }
}
