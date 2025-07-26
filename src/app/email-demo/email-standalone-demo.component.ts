import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { EmailComposerComponent } from '../components/email-composer/email-composer.component';
import { ComposedEmail } from '../services/email-template.service';

/**
 * Standalone demo page for the email composer that doesn't require authentication
 */
@Component({
  selector: 'app-email-standalone-demo',
  template: `
    <mat-toolbar color="primary">
      <mat-icon>email</mat-icon>
      <span>Email Template Service Demo</span>
    </mat-toolbar>
    
    <div class="demo-container">
      <mat-card class="intro-card">
        <mat-card-header>
          <mat-card-title>Email Template Service with Angular 20+</mat-card-title>
          <mat-card-subtitle>
            Standalone component demonstration featuring signal-based state management and Material Design
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>This demo showcases the email template service implementation with:</p>
          <ul>
            <li><strong>Pre-built Templates:</strong> Browser enrollment, user instructions, and security notifications</li>
            <li><strong>Variable Substitution:</strong> Dynamic placeholders with real-time preview</li>
            <li><strong>Rich Text Editing:</strong> Basic HTML editing with formatting helpers</li>
            <li><strong>Integration Features:</strong> Copy to clipboard and Gmail compose integration</li>
            <li><strong>Responsive Design:</strong> Mobile-friendly Material Design interface</li>
          </ul>
        </mat-card-content>
      </mat-card>

      <app-email-composer (emailComposed)="onEmailComposed($event)"></app-email-composer>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .intro-card {
      margin-bottom: 24px;
    }
    
    .intro-card ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    
    .intro-card li {
      margin-bottom: 8px;
    }
    
    @media (max-width: 768px) {
      .demo-container {
        padding: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    EmailComposerComponent,
  ],
})
export class EmailStandaloneDemoComponent {
  /**
   * Handles the composed email event
   */
  onEmailComposed(email: ComposedEmail): void {
    console.log('Composed Email:', email);
    alert(`Email composed successfully for ${email.to.length} recipient(s)!\nCheck the browser console for details.`);
  }
}