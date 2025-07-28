import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Loading spinner component with optional message
 */
@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="loading-container" [class.inline]="inline()">
      <mat-spinner 
        [diameter]="diameter()" 
        [strokeWidth]="strokeWidth()">
      </mat-spinner>
      @if (message()) {
        <p class="loading-message">{{ message() }}</p>
      }
    </div>
  `,
  styles: [
    `
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatProgressSpinnerModule],
})
export class LoadingSpinnerComponent {
  message = input<string>();
  diameter = input<number>(40);
  strokeWidth = input<number>(4);
  inline = input<boolean>(false);
}