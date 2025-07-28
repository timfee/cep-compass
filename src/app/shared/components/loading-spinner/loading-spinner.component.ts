import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatProgressSpinnerModule],
})
export class LoadingSpinnerComponent {
  /** Message to display below the spinner */
  message = input<string>('Loading...');
  
  /** Size of the spinner */
  diameter = input<number>(40);
}