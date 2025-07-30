import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable error display component with consistent styling and retry functionality
 */
@Component({
  selector: 'app-error-display',
  template: `
    <mat-card class="error-card">
      <mat-card-content>
        <div class="error-content">
          <mat-icon color="warn" class="error-icon">{{ icon() }}</mat-icon>
          <div class="error-text">
            <h3 class="error-title">{{ title() }}</h3>
            <p class="error-message">{{ message() }}</p>
          </div>
          @if (showRetry()) {
            <button
              mat-raised-button
              color="primary"
              (click)="retry.emit()"
              [disabled]="retryDisabled()"
              class="retry-button"
            >
              <mat-icon>refresh</mat-icon>
              {{ retryButtonText() }}
            </button>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .error-card {
        background-color: var(--mdc-snackbar-container-color, #ffdad6);
        border-left: 4px solid var(--mat-badge-warn-background-color, #ba1a1a);
        margin: 16px 0;
      }

      .error-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .error-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .error-text {
        flex: 1;
      }

      .error-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--mdc-snackbar-supporting-text-color, #93000a);
      }

      .error-message {
        margin: 0;
        color: var(--mat-optgroup-label-text-color, #46464f);
        line-height: 1.4;
      }

      .retry-button {
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .error-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .retry-button {
          align-self: stretch;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
})
export class ErrorDisplayComponent {
  /** Error message to display */
  message = input.required<string>();

  /** Error title - defaults to "Error" */
  title = input<string>('Error');

  /** Material icon name - defaults to "error" */
  icon = input<string>('error');

  /** Whether to show the retry button */
  showRetry = input<boolean>(true);

  /** Whether the retry button should be disabled */
  retryDisabled = input<boolean>(false);

  /** Text for the retry button */
  retryButtonText = input<string>('Try Again');

  /** Emitted when the retry button is clicked */
  retry = output<void>();
}
