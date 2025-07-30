import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

/**
 * Unified loading component supporting spinners and skeleton states
 */
@Component({
  selector: 'app-loading',
  template: `
    @if (type() === 'spinner') {
      <div class="loading-container" [class.inline]="inline()">
        <mat-spinner [diameter]="diameter()" [strokeWidth]="strokeWidth()">
        </mat-spinner>
        @if (message()) {
          <p class="loading-message">{{ message() }}</p>
        }
      </div>
    } @else if (type() === 'skeleton-card') {
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
    } @else if (type() === 'skeleton-list') {
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
    }
  `,
  styles: [
    `
      /* Spinner styles */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        min-height: 200px;
      }

      .loading-container.inline {
        min-height: auto;
        padding: 16px;
      }

      .loading-message {
        margin-top: 16px;
        margin-bottom: 0;
        color: var(--mat-sys-color-on-surface-variant);
        font-size: 14px;
        text-align: center;
      }

      /* Skeleton animation */
      @keyframes skeleton-loading {
        0% {
          background-position: -200px 0;
        }
        100% {
          background-position: calc(200px + 100%) 0;
        }
      }

      .skeleton-avatar,
      .skeleton-title,
      .skeleton-subtitle,
      .skeleton-line,
      .skeleton-button,
      .skeleton-icon {
        background: linear-gradient(
          90deg,
          var(--mat-sys-color-surface-container) 25%,
          var(--mat-sys-color-surface-container-high) 50%,
          var(--mat-sys-color-surface-container) 75%
        );
        background-size: 200px 100%;
        animation: skeleton-loading 1.2s ease-in-out infinite;
        border-radius: var(--mat-sys-shape-corner-extra-small);
      }

      /* Card skeleton styles */
      .skeleton-card {
        margin: 16px;
        border-radius: var(--mat-sys-shape-corner-medium);
      }

      .skeleton-card.elevated {
        box-shadow: var(--mat-sys-elevation-level2);
      }

      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 16px 0;
      }

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-title-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-title {
        height: 16px;
        width: 80%;
      }

      .skeleton-subtitle {
        height: 12px;
        width: 60%;
      }

      .skeleton-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-line.full {
        height: 14px;
        width: 100%;
      }

      .skeleton-line.medium {
        height: 14px;
        width: 75%;
      }

      .skeleton-line.small {
        height: 14px;
        width: 50%;
      }

      .skeleton-actions {
        padding: 8px 16px 16px;
      }

      .skeleton-button {
        height: 36px;
        width: 100px;
        border-radius: var(--mat-sys-shape-corner-full);
      }

      /* List skeleton styles */
      .skeleton-list-item {
        display: flex;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--mat-sys-color-outline-variant);
      }

      .skeleton-list-item:last-child {
        border-bottom: none;
      }

      .skeleton-list-item .skeleton-avatar {
        margin-right: 16px;
      }

      .skeleton-list-item .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0;
      }

      .skeleton-line.primary {
        height: 16px;
        width: 80%;
      }

      .skeleton-line.secondary {
        height: 12px;
        width: 60%;
      }

      .skeleton-icon {
        width: 24px;
        height: 24px;
        border-radius: var(--mat-sys-shape-corner-extra-small);
        margin-left: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule],
})
export class LoadingComponent {
  type = input<'spinner' | 'skeleton-card' | 'skeleton-list'>('spinner');
  message = input<string>();
  diameter = input<number>(40);
  strokeWidth = input<number>(4);
  inline = input<boolean>(false);
  elevated = input(false);
  items = input<number[]>([1, 2, 3]);
}
