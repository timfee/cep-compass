import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-list',
  templateUrl: './skeleton-list.component.html',
  styleUrl: './skeleton-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SkeletonListComponent {
  /** Number of skeleton items to display */
  items = input<number>(5);

  /** Get array of items for template iteration */
  get itemsArray(): number[] {
    return Array.from({ length: this.items() }, (_, i) => i);
  }
}