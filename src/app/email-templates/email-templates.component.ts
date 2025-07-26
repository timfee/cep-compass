import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EmailComposerComponent } from '../components/email-composer/email-composer.component';
import { ComposedEmail } from '../services/email-template.service';

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
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Handles the composed email event
   */
  onEmailComposed(email: ComposedEmail): void {
    console.log('Composed Email:', email);
    this.snackBar.open(
      `Email composed for ${email.to.length} recipient(s)`,
      'Close',
      { duration: 3000 },
    );
  }
}
