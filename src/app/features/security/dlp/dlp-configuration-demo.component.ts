import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  severity: string;
}

/**
 * DLP Configuration Demo Component
 * Standalone demo version for testing the UI without authentication
 */
@Component({
  selector: 'app-dlp-configuration-demo',
  templateUrl: './dlp-configuration.component.html',
  styleUrl: './dlp-configuration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatStepperModule,
    MatExpansionModule,
    MatChipsModule,
  ],
})
export class DlpConfigurationDemoComponent {
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  selectedPolicyTemplate = signal<string>('');
  showPolicyDetails = signal(false);
  dlpActivated = signal(false);

  // Policy templates
  readonly auditPolicyTemplates: PolicyTemplate[] = [
    {
      id: 'sensitive-data-audit',
      name: 'Sensitive Data Monitoring',
      description: 'Monitor uploads of files containing SSN, credit cards, or API keys',
      icon: 'credit_card',
      severity: 'low'
    },
    {
      id: 'external-sharing-audit',
      name: 'External Sharing Tracking',
      description: 'Track when users share files with external domains',
      icon: 'share',
      severity: 'low'
    },
    {
      id: 'download-monitoring',
      name: 'Download Activity Logging',
      description: 'Log downloads of documents from corporate sites',
      icon: 'download',
      severity: 'low'
    }
  ];

  /**
   * Opens Google Admin Console DLP configuration page
   */
  openDlpConsole(): void {
    const dlpConsoleUrl = 'https://admin.google.com/ac/chrome/datalossPrevention';
    window.open(dlpConsoleUrl, '_blank', 'noopener,noreferrer');
    
    this.snackBar.open(
      'DLP Configuration page opened in new tab', 
      'Close', 
      { duration: 3000 }
    );
  }

  /**
   * Selects a policy template
   */
  selectTemplate(templateId: string): void {
    this.selectedPolicyTemplate.set(templateId);
    this.showPolicyDetails.set(true);
  }

  /**
   * Copies policy configuration to clipboard
   */
  async copyPolicyConfig(): Promise<void> {
    const selectedTemplate = this.auditPolicyTemplates.find(
      template => template.id === this.selectedPolicyTemplate()
    );

    if (!selectedTemplate) {
      return;
    }

    let configText = '';

    switch (selectedTemplate.id) {
      case 'sensitive-data-audit':
        configText = `DLP Rule Configuration - Sensitive Data Monitoring

Rule Name: "Audit Sensitive Data Uploads"

Conditions:
- Content contains: Credit card numbers (via regex)
- Content contains: Social Security numbers (via regex)  
- Content contains: API keys or passwords

Actions: Log only (no blocking)
Scope: All users, all destinations`;
        break;
        
      case 'external-sharing-audit':
        configText = `DLP Rule Configuration - External Sharing Tracking

Rule Name: "Audit External File Sharing"

Conditions:
- Destination: External domains
- File types: Documents, spreadsheets, presentations
- Action: Upload or share

Actions: Log only (no blocking)
Scope: All users`;
        break;
        
      case 'download-monitoring':
        configText = `DLP Rule Configuration - Download Activity Logging

Rule Name: "Audit Corporate Downloads"

Conditions:
- Source: Corporate Google Drive or intranet
- Action: Download
- File size: Over 10MB

Actions: Log only (no blocking)
Scope: All users`;
        break;
    }

    try {
      await navigator.clipboard.writeText(configText);
      this.snackBar.open(
        'Policy configuration copied to clipboard!', 
        'Close', 
        { 
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.snackBar.open(
        'Failed to copy to clipboard', 
        'Close', 
        { duration: 3000 }
      );
    }
  }

  /**
   * Marks DLP as configured (demo version - just shows feedback)
   */
  markAsConfigured(): void {
    this.dlpActivated.set(true);
    
    this.snackBar.open(
      'DLP Configuration marked as completed! (Demo mode)', 
      'Close', 
      { 
        duration: 5000,
        panelClass: ['success-snackbar']
      }
    );
  }

  /**
   * Opens external link in new tab
   */
  openExternalLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}