import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { SkeletonListComponent } from '../shared/components/skeleton-list/skeleton-list.component';
import { SkeletonCardComponent } from '../shared/components/skeleton-card/skeleton-card.component';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-demo-loading',
  templateUrl: './demo-loading.component.html',
  styleUrl: './demo-loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    SkeletonListComponent,
    SkeletonCardComponent,
    LoadingSpinnerComponent,
  ],
})
export class DemoLoadingComponent {}