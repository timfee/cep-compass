import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { EnrollmentTokenService } from '../../services/enrollment-token.service';
import { DirectoryService } from '../../services/directory.service';
import { NotificationService } from '../../core/notification.service';

interface OneClickState {
  activated: boolean;
  activatedDate?: string;
  lastPrerequisiteCheck?: string;
}

interface OneClickActivationState {
  hasEnrolledBrowsers: boolean;
  hasEnrolledProfiles: boolean;
  isActivated: boolean;
  lastChecked: Date | null;
  isCheckingPrerequisites: boolean;
  error: string | null;
}

/**
 * One-Click Security Activation Component
 * Guides administrators through Chrome One-Click protection activation
 * with prerequisite checking and step-by-step instructions
 */
@Component({
  selector: 'app-one-click-activation',
  templateUrl: './one-click-activation.component.html',
  styles: [
    `
      .one-click-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 24px;
      }

      .prerequisites-section {
        margin-bottom: 24px;
      }

      .refresh-button {
        margin-top: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .last-checked {
        margin-top: 8px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
      }

      .error-card {
        margin: 16px 0;
        background-color: #ffebee;
      }

      .error-card mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .error-card mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }

      .feature-card {
        text-align: center;
      }

      .feature-card mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin: 0 auto 16px;
        display: block;
      }

      .feature-card h4 {
        margin: 8px 0;
        font-weight: 500;
      }

      .feature-card p {
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
        line-height: 1.4;
      }

      .warning-card,
      .success-card {
        margin: 16px 0;
      }

      .warning-card {
        background-color: #fff3e0;
      }

      .success-card {
        background-color: #e8f5e8;
      }

      .warning-card mat-card-content,
      .success-card mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .warning-card mat-icon,
      .success-card mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
        flex-shrink: 0;
      }

      .success-content {
        flex: 1;
      }

      .success-content h4 {
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .success-content p {
        margin: 0 0 16px 0;
        color: rgba(0, 0, 0, 0.7);
      }

      .step-actions {
        margin-top: 16px;
        display: flex;
        gap: 8px;
      }

      .resources-section {
        margin-top: 32px;
      }

      .resource-link {
        text-decoration: none;
        color: var(--primary-color);
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        width: 100%;
        text-align: left;
      }

      .resource-link:hover {
        text-decoration: underline;
        background-color: rgba(0, 0, 0, 0.04);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .one-click-container {
          padding: 16px;
        }

        .feature-grid {
          grid-template-columns: 1fr;
        }

        .warning-card mat-card-content,
        .success-card mat-card-content {
          flex-direction: column;
          align-items: flex-start;
          text-align: center;
        }

        .success-content {
          text-align: center;
        }
      }

      /* Material list item adjustments */
      mat-list-item {
        margin-bottom: 8px;
      }

      mat-list-item button {
        margin-left: auto;
      }

      /* Stepper customization */
      mat-stepper {
        margin: 16px 0;
      }

      .mat-step-header {
        pointer-events: auto;
      }

      /* Spinner in button */
      mat-spinner {
        margin-right: 8px;
      }

      /* Card header styling */
      mat-card-header {
        margin-bottom: 16px;
      }

      mat-card-header mat-icon[mat-card-avatar] {
        background-color: transparent;
        color: var(--primary-color);
      }

      /* Section spacing */
      section {
        margin: 24px 0;
      }

      section h3 {
        margin: 0 0 16px 0;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      /* Divider spacing */
      mat-divider {
        margin: 32px 0;
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
    MatProgressSpinnerModule,
  ],
})
export class OneClickActivationComponent implements OnInit {
  // Injected services
  private readonly enrollmentService = inject(EnrollmentTokenService);
  private readonly directoryService = inject(DirectoryService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // Component state signal
  private readonly _state = signal<OneClickActivationState>({
    hasEnrolledBrowsers: false,
    hasEnrolledProfiles: false,
    isActivated: false,
    lastChecked: null,
    isCheckingPrerequisites: false,
    error: null,
  });

  // Public computed signals
  readonly hasEnrolledBrowsers = computed(
    () => this._state().hasEnrolledBrowsers,
  );
  readonly hasEnrolledProfiles = computed(
    () => this._state().hasEnrolledProfiles,
  );
  readonly prerequisitesMet = computed(
    () => this.hasEnrolledBrowsers() && this.hasEnrolledProfiles(),
  );
  readonly isActivated = computed(() => this._state().isActivated);
  readonly lastChecked = computed(() => this._state().lastChecked);
  readonly isCheckingPrerequisites = computed(
    () => this._state().isCheckingPrerequisites,
  );
  readonly error = computed(() => this._state().error);

  // Feature cards data
  readonly features = [
    {
      icon: 'shield',
      title: 'Real-time Threat Detection',
      description:
        'Identifies and blocks malicious downloads, phishing sites, and suspicious extensions',
    },
    {
      icon: 'analytics',
      title: 'Security Insights Dashboard',
      description:
        'Comprehensive view of security events across your organization',
    },
    {
      icon: 'notifications_active',
      title: 'Automated Alerts',
      description: 'Instant notifications for critical security events',
    },
    {
      icon: 'policy',
      title: 'Policy Recommendations',
      description: 'AI-powered suggestions to improve your security posture',
    },
  ];

  // Learning resources
  readonly resources = [
    {
      icon: 'article',
      title: 'One-Click Protection Documentation',
      url: 'https://support.google.com/chrome/a/answer/13728522',
    },
    {
      icon: 'play_circle',
      title: 'Video: Chrome Security Best Practices',
      url: 'https://www.youtube.com/watch?v=chrome-security',
    },
    {
      icon: 'help',
      title: 'Chrome Enterprise Help Center',
      url: 'https://support.google.com/chrome/a/',
    },
  ];

  async ngOnInit(): Promise<void> {
    // Load activation state from localStorage
    this.loadActivationState();

    // Check prerequisites on component load
    await this.checkPrerequisites();
  }

  /**
   * Checks prerequisites for One-Click protection activation
   */
  async checkPrerequisites(): Promise<void> {
    this._state.update((state) => ({
      ...state,
      isCheckingPrerequisites: true,
      error: null,
    }));

    try {
      // Check browser enrollment status
      const tokens = await this.enrollmentService.listTokens();
      const hasActiveBrowserTokens = tokens.some((token) =>
        this.enrollmentService.isTokenActive(token),
      );

      // Check profile enrollment status by looking at directory users
      await this.directoryService.fetchInitialData();
      const users = this.directoryService.users();
      const hasActiveProfiles =
        users.length > 0 &&
        users.some(
          (user) =>
            !user.suspended &&
            user.lastLoginTime !== null &&
            user.lastLoginTime !== undefined &&
            user.lastLoginTime !== '',
        );

      this._state.update((state) => ({
        ...state,
        hasEnrolledBrowsers: hasActiveBrowserTokens,
        hasEnrolledProfiles: hasActiveProfiles,
        lastChecked: new Date(),
        isCheckingPrerequisites: false,
        error: null,
      }));

      // Save check time to localStorage
      this.savePrerequisiteCheckTime();
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
      this._state.update((state) => ({
        ...state,
        isCheckingPrerequisites: false,
        error: 'Failed to check prerequisites. Please try again.',
      }));
    }
  }

  /**
   * Opens Google Admin Console Security Insights page
   */
  openSecurityInsights(): void {
    const securityInsightsUrl =
      'https://admin.google.com/ac/chrome/reports/securityinsights';
    window.open(securityInsightsUrl, '_blank', 'noopener,noreferrer');

    this.notificationService.info('Security Insights page opened in new tab');
  }

  /**
   * Marks One-Click protection as activated and saves to localStorage
   */
  markAsActivated(): void {
    this._state.update((state) => ({
      ...state,
      isActivated: true,
    }));

    this.saveActivationState();

    this.notificationService.success(
      'One-Click Protection marked as activated!',
    );
  }

  /**
   * Navigate to browser enrollment page
   */
  navigateToBrowserEnrollment(): void {
    this.router.navigate(['/enrollment/browsers']);
  }

  /**
   * Navigate to profile enrollment page
   */
  navigateToProfileEnrollment(): void {
    this.router.navigate(['/enrollment/profiles']);
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
      const storedState = localStorage.getItem('cep-compass-one-click');
      if (storedState) {
        const state: OneClickState = JSON.parse(storedState);
        this._state.update((currentState) => ({
          ...currentState,
          isActivated: state.activated || false,
        }));
      }
    } catch (error) {
      console.warn('Failed to load activation state from localStorage:', error);
    }
  }

  /**
   * Saves activation state to localStorage
   */
  private saveActivationState(): void {
    try {
      const state: OneClickState = {
        activated: true,
        activatedDate: new Date().toISOString(),
        lastPrerequisiteCheck: new Date().toISOString(),
      };
      localStorage.setItem('cep-compass-one-click', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save activation state to localStorage:', error);
    }
  }

  /**
   * Saves prerequisite check time to localStorage
   */
  private savePrerequisiteCheckTime(): void {
    try {
      const existingState = localStorage.getItem('cep-compass-one-click');
      const state: OneClickState = existingState
        ? JSON.parse(existingState)
        : { activated: false };

      state.lastPrerequisiteCheck = new Date().toISOString();
      localStorage.setItem('cep-compass-one-click', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save prerequisite check time:', error);
    }
  }
}
