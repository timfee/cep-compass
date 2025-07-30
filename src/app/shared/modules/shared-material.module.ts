/**
 * Shared Angular Material module to avoid repeated imports across components
 * Contains the most commonly used Material modules in the application
 */

import { NgModule } from '@angular/core';

// Material modules commonly used throughout the application
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

const MATERIAL_MODULES = [
  // Core UI modules
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  
  // Form modules
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatRadioModule,
  MatSlideToggleModule,
  
  // Layout modules
  MatToolbarModule,
  MatDividerModule,
  MatListModule,
  MatExpansionModule,
  MatTabsModule,
  
  // Data modules
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  
  // Feedback modules
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatDialogModule,
  
  // Navigation modules
  MatMenuModule,
  MatChipsModule,
];

/**
 * Shared Material module that exports commonly used Material components
 * Import this instead of individual Material modules to reduce duplication
 */
@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES,
})
export class SharedMaterialModule {}

/**
 * For standalone components, use this constant to import common Material modules
 * Usage: imports: [CommonModule, ...COMMON_MATERIAL_IMPORTS]
 */
export const COMMON_MATERIAL_IMPORTS = [
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
] as const;

/**
 * Form-specific Material modules for components dealing with forms
 */
export const FORM_MATERIAL_IMPORTS = [
  ...COMMON_MATERIAL_IMPORTS,
  MatCheckboxModule,
  MatRadioModule,
  MatSlideToggleModule,
] as const;

/**
 * Table-specific Material modules for components displaying data tables
 */
export const TABLE_MATERIAL_IMPORTS = [
  ...COMMON_MATERIAL_IMPORTS,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
] as const;