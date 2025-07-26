import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { OrgUnitsService } from '../services/org-units.service';

/**
 * Demo component to test OrgUnitsService integration
 * This component demonstrates the service functionality
 */
@Component({
  selector: 'app-org-units-demo',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Organizational Units Service Demo</mat-card-title>
        <mat-card-subtitle
          >Testing Google Workspace OU integration</mat-card-subtitle
        >
      </mat-card-header>

      <mat-card-content>
        <div class="actions">
          <button
            mat-raised-button
            color="primary"
            (click)="fetchOrgUnits()"
            [disabled]="orgUnitsService.isLoading()"
          >
            <mat-icon>refresh</mat-icon>
            Fetch Org Units
          </button>

          <button
            mat-raised-button
            (click)="clearCache()"
            [disabled]="orgUnitsService.isLoading()"
          >
            <mat-icon>clear</mat-icon>
            Clear Cache
          </button>
        </div>

        @if (orgUnitsService.isLoading()) {
          <div class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading organizational units...</p>
          </div>
        }

        @if (orgUnitsService.error()) {
          <mat-card class="error-card">
            <mat-card-content>
              <mat-icon color="warn">error</mat-icon>
              <p>{{ orgUnitsService.error() }}</p>
            </mat-card-content>
          </mat-card>
        }

        @if (
          orgUnitsService.orgUnits().length > 0 && !orgUnitsService.isLoading()
        ) {
          <div class="results">
            <h3>Flat List ({{ orgUnitsService.orgUnits().length }} units):</h3>
            <ul class="org-units-list">
              @for (unit of orgUnitsService.orgUnits(); track unit.orgUnitId) {
                <li>
                  <strong>{{ unit.name }}</strong> - {{ unit.orgUnitPath }}
                  @if (unit.description) {
                    <br /><small>{{ unit.description }}</small>
                  }
                </li>
              }
            </ul>

            <h3>Tree Structure:</h3>
            <div class="tree-container">
              @for (
                node of orgUnitsService.orgUnitTree();
                track node.orgUnitId
              ) {
                <div class="tree-node" [style.margin-left.px]="node.level * 20">
                  <mat-icon>{{
                    node.children.length > 0 ? 'folder' : 'folder_open'
                  }}</mat-icon>
                  <span>{{ node.name }} ({{ node.orgUnitPath }})</span>
                  @if (node.children.length > 0) {
                    <small>({{ node.children.length }} children)</small>
                  }
                </div>
                @for (child of node.children; track child.orgUnitId) {
                  <div
                    class="tree-node"
                    [style.margin-left.px]="child.level * 20"
                  >
                    <mat-icon>{{
                      child.children.length > 0 ? 'folder' : 'folder_open'
                    }}</mat-icon>
                    <span>{{ child.name }} ({{ child.orgUnitPath }})</span>
                    @if (child.children.length > 0) {
                      <small>({{ child.children.length }} children)</small>
                    }
                  </div>
                }
              }
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      mat-card {
        margin: 16px;
        max-width: 800px;
      }

      .actions {
        margin-bottom: 16px;
        display: flex;
        gap: 8px;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
      }

      .loading p {
        margin-top: 8px;
        color: #666;
      }

      .error-card {
        background-color: #ffebee;
        margin: 16px 0;
      }

      .error-card mat-card-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .results {
        margin-top: 16px;
      }

      .org-units-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
      }

      .org-units-list li {
        margin-bottom: 8px;
        padding: 4px;
        border-bottom: 1px solid #eee;
      }

      .tree-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
      }

      .tree-node {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px;
        margin: 2px 0;
      }

      .tree-node mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .tree-node small {
        color: #666;
        margin-left: 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTreeModule,
  ],
})
export class OrgUnitsDemoComponent {
  protected readonly orgUnitsService = inject(OrgUnitsService);

  fetchOrgUnits(): void {
    this.orgUnitsService.fetchOrgUnits();
  }

  clearCache(): void {
    this.orgUnitsService.clearCache();
  }
}
