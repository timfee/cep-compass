import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { EmailComposerComponent } from '../components/email-composer/email-composer.component';
import { ComposedEmail } from '../services/email-template.service';
import { NotificationService } from '../core/notification.service';

/**
 * Email Templates page for managing and composing email templates
 */
@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.component.html',
  styleUrl: './email-templates.component.css',
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
      `Email composed for ${email.to.length} recipient(s)`
    );
  }
}
