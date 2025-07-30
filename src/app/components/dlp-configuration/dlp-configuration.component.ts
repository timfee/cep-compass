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
import { NotificationService } from '../../core/notification.service';
import { copyToClipboard } from '../../shared/clipboard.utils';

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  severity: string;
}

/**
 * DLP Configuration Component
 * Guides administrators through creating safe audit-only DLP policies
 * for Chrome with step-by-step instructions and templates
 */
@Component({
  selector: 'app-dlp-configuration',
  templateUrl: './dlp-configuration.component.html',
  styles: [
    `
      .dlp-configuration-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }

      .info-card {
        background-color: #e3f2fd;
        margin-bottom: 24px;
      }

      .info-card mat-card-content {
        display: flex;
        gap: 16px;
      }

      .info-card mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
      }

      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }

      .template-card {
        cursor: pointer;
        transition: all 0.2s;
      }

      .template-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .template-card.selected {
        border: 2px solid var(--primary-color);
      }

      .template-card mat-chip-set {
        margin-top: 8px;
      }

      .template-card mat-chip {
        background-color: #e3f2fd;
        color: var(--primary-color);
      }

      .policy-details {
        margin-top: 24px;
      }

      .policy-config {
        background-color: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
      }

      .policy-config h4 {
        margin-top: 0;
      }

      .policy-config button {
        margin-top: 16px;
      }

      .step-note {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }

      .warning-card {
        background-color: #fff3e0;
        margin: 16px 0;
      }

      .warning-card mat-card-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .resource-links {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .resource-links a {
        text-decoration: none;
      }

      /* Mobile responsive adjustments */
      @media (max-width: 768px) {
        .dlp-configuration-container {
          padding: 16px;
        }

        .template-grid {
          grid-template-columns: 1fr;
        }

        .resource-links {
          flex-direction: column;
        }

        .resource-links a {
          width: 100%;
        }

        .info-card mat-card-content {
          flex-direction: column;
          text-align: center;
        }
      }

      /* Stepper customizations */
      mat-stepper {
        margin: 16px 0;
      }

      .mat-step-header {
        pointer-events: none;
      }

      /* Success snackbar styling */
      ::ng-deep .success-snackbar {
        background-color: #4caf50;
        color: white;
      }

      /* Enhanced accessibility */
      .template-card:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    `,
  ],
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
export class DlpConfigurationComponent {
  private readonly notificationService = inject(NotificationService);

  // State signals
  selectedPolicyTemplate = signal<string>('');
  showPolicyDetails = signal(false);
  dlpActivated = signal(false);

  // Policy templates
  readonly auditPolicyTemplates: PolicyTemplate[] = [
    {
      id: 'sensitive-data-audit',
      name: 'Sensitive Data Monitoring',
      description:
        'Monitor uploads of files containing SSN, credit cards, or API keys',
      icon: 'credit_card',
      severity: 'low',
    },
    {
      id: 'external-sharing-audit',
      name: 'External Sharing Tracking',
      description: 'Track when users share files with external domains',
      icon: 'share',
      severity: 'low',
    },
    {
      id: 'download-monitoring',
      name: 'Download Activity Logging',
      description: 'Log downloads of documents from corporate sites',
      icon: 'download',
      severity: 'low',
    },
  ];

  constructor() {
    // Load DLP activation state from localStorage
    this.loadActivationState();
  }

  /**
   * Opens Google Admin Console DLP configuration page
   */
  openDlpConsole(): void {
    const dlpConsoleUrl =
      'https://admin.google.com/ac/chrome/datalossPrevention';
    window.open(dlpConsoleUrl, '_blank', 'noopener,noreferrer');

    this.notificationService.info('DLP Configuration page opened in new tab');
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
      (template) => template.id === this.selectedPolicyTemplate(),
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
      await copyToClipboard(configText);
      this.notificationService.success(
        'Policy configuration copied to clipboard!',
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.notificationService.error('Failed to copy to clipboard');
    }
  }

  /**
   * Marks DLP as configured and saves to localStorage
   */
  markAsConfigured(): void {
    this.dlpActivated.set(true);
    this.saveActivationState();

    this.notificationService.success('DLP Configuration marked as completed!');
  }

  /**
   * Opens external link in new tab
   */
  openExternalLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Loads activation state from localStorage
   */
  private loadActivationState(): void {
    try {
      const storedState = localStorage.getItem('cep-compass-dlp');
      if (storedState) {
        const state = JSON.parse(storedState);
        this.dlpActivated.set(state.activated || false);
      }
    } catch (error) {
      console.warn(
        'Failed to load DLP activation state from localStorage:',
        error,
      );
    }
  }

  /**
   * Saves activation state to localStorage
   */
  private saveActivationState(): void {
    try {
      const state = {
        activated: this.dlpActivated(),
        activatedDate: new Date().toISOString(),
      };
      localStorage.setItem('cep-compass-dlp', JSON.stringify(state));
    } catch (error) {
      console.warn(
        'Failed to save DLP activation state to localStorage:',
        error,
      );
    }
  }
}
