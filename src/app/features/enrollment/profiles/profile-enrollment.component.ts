import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { DirectoryService } from '../../../services/directory.service';
import {
  EmailTemplateService,
  ComposedEmail,
} from '../../../services/email-template.service';
import { AuthService } from '../../../services/auth.service';
import { EmailComposerComponent } from '../../../components/email-composer/email-composer.component';

/**
 * Profile Enrollment Component
 * Guides users in enrolling their Chrome profiles by signing in with managed accounts.
 * Displays directory statistics and provides email templates for user education.
 */
@Component({
  selector: 'app-profile-enrollment',
  templateUrl: './profile-enrollment.component.html',
  styleUrl: './profile-enrollment.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
    EmailComposerComponent,
  ],
})
export class ProfileEnrollmentComponent implements OnInit {
  // Injected services
  private readonly directoryService = inject(DirectoryService);
  private readonly emailService = inject(EmailTemplateService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  public readonly showEmailComposer = signal(false);
  public readonly selectedRecipients = signal<string[]>([]);
  public readonly bulkEmailMode = signal(false);

  // Computed signals
  public readonly userStats = computed(() => this.directoryService.stats());
  public readonly isLoading = this.directoryService.isLoading;
  public readonly error = this.directoryService.error;

  // Profile enrollment template
  public readonly profileEnrollmentTemplate = computed(() =>
    this.emailService.templates().find((t) => t.id === 'profile-enrollment'),
  );

  /**
   * Refreshes directory statistics
   */
  async refreshStats(): Promise<void> {
    try {
      await this.directoryService.refreshStats();
      this.snackBar.open('Statistics refreshed successfully', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Failed to refresh statistics', 'Close', {
        duration: 5000,
      });
      console.error('Failed to refresh stats:', error);
    }
  }

  /**
   * Drafts a single email for individual sending
   */
  draftSingleEmail(): void {
    const template = this.profileEnrollmentTemplate();
    if (template) {
      this.emailService.selectTemplate(template.id);
      this.bulkEmailMode.set(false);
      this.showEmailComposer.set(true);
    } else {
      this.snackBar.open('Profile enrollment template not found', 'Close', {
        duration: 5000,
      });
    }
  }

  /**
   * Drafts a bulk email for multiple recipients
   */
  draftBulkEmail(): void {
    const template = this.profileEnrollmentTemplate();
    if (template) {
      // Get all active users as potential recipients
      const activeUsers = this.directoryService
        .users()
        .filter((user) => !user.suspended);
      const emails = activeUsers.map((user) => user.primaryEmail);

      this.emailService.selectTemplate(template.id);
      this.selectedRecipients.set(emails);
      this.bulkEmailMode.set(true);
      this.showEmailComposer.set(true);
    } else {
      this.snackBar.open('Profile enrollment template not found', 'Close', {
        duration: 5000,
      });
    }
  }

  /**
   * Exports user list to CSV
   */
  exportUserList(): void {
    const users = this.directoryService.users();
    if (users.length === 0) {
      this.snackBar.open('No users to export', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Create CSV content
    const headers = ['Email', 'Name', 'Status', 'Org Unit', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...users.map((user) =>
        [
          user.primaryEmail,
          `"${user.name.fullName}"`,
          user.suspended ? 'Suspended' : 'Active',
          `"${user.orgUnitPath}"`,
          user.lastLoginTime || 'Never',
        ].join(','),
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('User list exported successfully', 'Close', {
      duration: 3000,
    });
  }

  /**
   * Gets email variables with default values
   */
  getEmailVariables(): Record<string, string> {
    return {
      companyName: 'Your Company',
      ssoProvider: 'Google Workspace',
      helpDeskEmail: 'support@yourcompany.com',
      deadline: 'end of this week',
      senderName: 'IT Administrator',
      senderTitle: 'IT Administrator',
    };
  }

  /**
   * Handles email composition completion
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEmailComposed(_email: ComposedEmail): void {
    // Email has been composed and is ready to send
    // In a real application, this might send the email or save it as a draft
    this.snackBar.open('Email composed successfully', 'Close', {
      duration: 3000,
    });
    this.showEmailComposer.set(false);
  }

  /**
   * Initializes the component by fetching initial directory data
   */
  ngOnInit(): void {
    // Fetch initial directory data if not already loaded
    this.directoryService.fetchInitialData().catch((error) => {
      console.error('Failed to fetch initial directory data:', error);
    });
  }
}
