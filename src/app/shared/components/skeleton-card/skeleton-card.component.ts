import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

/**
 * Skeleton card component for loading states
 */
@Component({
  selector: 'app-skeleton-card',
  template: `
    <mat-card class="skeleton-card" [class.elevated]="elevated()">
      <mat-card-header class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-title-section">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
        </div>
      </mat-card-header>
      <mat-card-content class="skeleton-content">
        <div class="skeleton-line full"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line small"></div>
      </mat-card-content>
      <mat-card-actions class="skeleton-actions">
        <div class="skeleton-button"></div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .skeleton-card {
        margin: 16px 0;
        min-height: 200px;
      }

      .skeleton-card.elevated {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .skeleton-header {
        padding: 16px;
      }

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-title-section {
        flex: 1;
        margin-left: 16px;
      }

      .skeleton-title {
        height: 20px;
        width: 60%;
        margin-bottom: 8px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      .skeleton-subtitle {
        height: 16px;
        width: 40%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      .skeleton-content {
        padding: 0 16px 16px;
      }

      .skeleton-line {
        height: 16px;
        margin-bottom: 8px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      .skeleton-line.full {
        width: 100%;
      }

      .skeleton-line.medium {
        width: 75%;
      }

      .skeleton-line.small {
        width: 50%;
      }

      .skeleton-actions {
        padding: 0 16px 16px;
      }

      .skeleton-button {
        height: 36px;
        width: 120px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
})
export class SkeletonCardComponent {
  elevated = input<boolean>(false);
}