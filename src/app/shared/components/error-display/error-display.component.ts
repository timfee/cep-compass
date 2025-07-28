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
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
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