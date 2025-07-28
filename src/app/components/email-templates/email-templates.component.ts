import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { EmailComposerComponent } from '../email-composer/email-composer.component';
import { ComposedEmail } from '../../services/email-template.service';
import { NotificationService } from '../../core/notification.service';

/**
 * Email Templates page for managing and composing email templates
 */
@Component({
  selector: 'app-email-templates',
  template: `
    <div class="email-templates-container">
      <mat-card class="templates-card">
        <mat-card-header>
          <mat-card-title>Email Templates</mat-card-title>
          <mat-card-subtitle>
            Compose and manage email templates with variable substitution for Chrome
            Enterprise Premium
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <app-email-composer
        (emailComposed)="onEmailComposed($event)"
      ></app-email-composer>
    </div>
  `,
  styles: [
    `
      .email-templates-container {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .templates-card {
        margin-bottom: 20px;
      }

      @media (max-width: 768px) {
        .email-templates-container {
          padding: 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, EmailComposerComponent],
})
export class EmailTemplatesComponent {
  private readonly notificationService = inject(NotificationService);

  /**
   * Handles the composed email event
   */
  onEmailComposed(email: ComposedEmail): void {
    console.log('Composed Email:', email);
    this.notificationService.info(
      `Email composed for ${email.to.length} recipient(s)`,
    );
  }
}
