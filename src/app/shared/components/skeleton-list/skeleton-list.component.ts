import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton list component for loading states
 */
@Component({
  selector: 'app-skeleton-list',
  template: `
    @for (item of items(); track $index) {
      <div class="skeleton-list-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line primary"></div>
          <div class="skeleton-line secondary"></div>
        </div>
        <div class="skeleton-icon"></div>
      </div>
    }
  `,
  styles: [
    `
      .skeleton-list-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
      }

      .skeleton-list-item:last-child {
        border-bottom: none;
      }

      .skeleton-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        flex-shrink: 0;
      }

      .skeleton-content {
        flex: 1;
        margin-left: 12px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 4px;
      }

      .skeleton-line:last-child {
        margin-bottom: 0;
      }

      .skeleton-line.primary {
        width: 70%;
        height: 18px;
      }

      .skeleton-line.secondary {
        width: 50%;
        height: 14px;
      }

      .skeleton-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        flex-shrink: 0;
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
  imports: [CommonModule],
})
export class SkeletonListComponent {
  items = input<unknown[]>([1, 2, 3, 4, 5]);
}