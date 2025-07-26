import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmailComposerComponent } from '../components/email-composer/email-composer.component';

/**
 * Standalone demo component for the Quill-powered email composer
 * Shows the rich text editor without authentication requirements
 */
@Component({
  selector: 'app-email-composer-demo',
  template: `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1 style="text-align: center; margin-bottom: 30px; color: #1976d2;">
        Rich Text Email Composer Demo
      </h1>
      <p style="text-align: center; margin-bottom: 30px; color: #666;">
        Simple email composition interface for demonstration purposes
      </p>
      <app-email-composer></app-email-composer>
    </div>
  `,
  imports: [EmailComposerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailComposerDemoComponent {}