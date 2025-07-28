import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { SkeletonCardComponent, SkeletonListComponent, LoadingSpinnerComponent } from '../shared/components';

/**
 * Demo component to showcase loading states and skeleton screens
 */
@Component({
  selector: 'app-demo-loading',
  template: `
    <div class="demo-container">
      <mat-card class="demo-header">
        <mat-card-header>
          <mat-card-title>Loading States Demo</mat-card-title>
          <mat-card-subtitle>Demonstration of skeleton screens and loading components</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>This page demonstrates the loading states implemented to improve perceived performance:</p>
          <ul>
            <li>Skeleton cards that match the layout of dashboard cards</li>
            <li>Skeleton lists for user/group data loading</li>
            <li>Loading spinners with messages</li>
          </ul>
        </mat-card-content>
      </mat-card>

      <div class="demo-section">
        <h2>Skeleton Cards</h2>
        <p>Used in Dashboard and Directory Stats during initial data loading</p>
        <div class="cards-grid">
          @for (item of [1, 2, 3]; track $index) {
            <app-skeleton-card [elevated]="true"></app-skeleton-card>
          }
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="demo-section">
        <h2>Skeleton Lists</h2>
        <p>Used for user and group listings while data loads</p>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Directory Results</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-skeleton-list [items]="[1, 2, 3, 4, 5]"></app-skeleton-list>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-divider></mat-divider>

      <div class="demo-section">
        <h2>Loading Spinners</h2>
        <p>Used for operations with progress messages</p>
        <div class="spinners-grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Role Selection Loading</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-loading-spinner 
                message="Loading available roles..." 
                [diameter]="40">
              </app-loading-spinner>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Inline Loading</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-loading-spinner 
                message="Refreshing data..." 
                [diameter]="24"
                [inline]="true">
              </app-loading-spinner>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div class="demo-section">
        <h2>Controls</h2>
        <button mat-raised-button color="primary" (click)="toggleDemo()">
          {{ showSkeletons() ? 'Hide' : 'Show' }} Loading States
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .demo-header {
        margin-bottom: 24px;
      }

      .demo-section {
        margin: 24px 0;
      }

      .demo-section h2 {
        color: var(--mat-app-primary);
        margin-bottom: 8px;
      }

      .demo-section p {
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 16px;
      }

      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }

      .spinners-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }

      mat-divider {
        margin: 32px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    SkeletonCardComponent,
    SkeletonListComponent,
    LoadingSpinnerComponent,
  ],
})
export class DemoLoadingComponent {
  showSkeletons = signal(true);

  toggleDemo(): void {
    this.showSkeletons.update(value => !value);
  }
}