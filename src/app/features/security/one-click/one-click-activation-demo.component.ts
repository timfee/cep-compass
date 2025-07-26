import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface OneClickActivationState {
  hasEnrolledBrowsers: boolean;
  hasEnrolledProfiles: boolean;
  isActivated: boolean;
  lastChecked: Date | null;
  isCheckingPrerequisites: boolean;
  error: string | null;
}

/**
 * One-Click Security Activation Demo Component
 * Standalone demo version for testing the UI without authentication
 */
@Component({
  selector: 'app-one-click-activation-demo',
  templateUrl: './one-click-activation-demo.component.html',
  styleUrl: './one-click-activation-demo.component.css',
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
export class OneClickActivationDemoComponent implements OnInit {
  // Component state signal
  private readonly _state = signal<OneClickActivationState>({
    hasEnrolledBrowsers: false,
    hasEnrolledProfiles: true, // Simulate some prerequisites met
    isActivated: false,
    lastChecked: new Date(),
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

  ngOnInit(): void {
    // Simulate checking prerequisites after a delay
    setTimeout(() => {
      this.simulatePrerequisiteCheck();
    }, 1000);
  }

  /**
   * Simulates checking prerequisites for demo purposes
   */
  async checkPrerequisites(): Promise<void> {
    this._state.update((state) => ({
      ...state,
      isCheckingPrerequisites: true,
      error: null,
    }));

    // Simulate API call delay
    setTimeout(() => {
      this.simulatePrerequisiteCheck();
    }, 2000);
  }

  /**
   * Simulates opening Google Admin Console Security Insights page
   */
  openSecurityInsights(): void {
    console.log(
      'Would open: https://admin.google.com/ac/chrome/reports/securityinsights',
    );
    alert('Demo: Would open Security Insights page in new tab');
  }

  /**
   * Simulates marking One-Click protection as activated
   */
  markAsActivated(): void {
    this._state.update((state) => ({
      ...state,
      isActivated: true,
    }));

    console.log('Demo: One-Click Protection marked as activated');
    alert('Demo: One-Click Protection marked as activated!');
  }

  /**
   * Simulates navigation to browser enrollment page
   */
  navigateToBrowserEnrollment(): void {
    console.log('Would navigate to: /enrollment/browsers');
    alert('Demo: Would navigate to Browser Enrollment page');
  }

  /**
   * Simulates navigation to profile enrollment page
   */
  navigateToProfileEnrollment(): void {
    console.log('Would navigate to: /enrollment/profiles');
    alert('Demo: Would navigate to Profile Enrollment page');
  }

  /**
   * Simulates opening external link in new tab
   */
  openExternalLink(url: string): void {
    console.log('Would open:', url);
    alert(`Demo: Would open ${url} in new tab`);
  }

  /**
   * Toggle browser enrollment status for demo
   */
  toggleBrowserEnrollment(): void {
    this._state.update((state) => ({
      ...state,
      hasEnrolledBrowsers: !state.hasEnrolledBrowsers,
      lastChecked: new Date(),
    }));
  }

  /**
   * Toggle profile enrollment status for demo
   */
  toggleProfileEnrollment(): void {
    this._state.update((state) => ({
      ...state,
      hasEnrolledProfiles: !state.hasEnrolledProfiles,
      lastChecked: new Date(),
    }));
  }

  // --- PRIVATE METHODS ---

  private simulatePrerequisiteCheck(): void {
    // Randomly update statuses for demo
    const hasEnrolledBrowsers = Math.random() > 0.5;
    const hasEnrolledProfiles = Math.random() > 0.3;

    this._state.update((state) => ({
      ...state,
      hasEnrolledBrowsers,
      hasEnrolledProfiles,
      lastChecked: new Date(),
      isCheckingPrerequisites: false,
      error: null,
    }));
  }
}
