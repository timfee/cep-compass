import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuillModule } from 'ngx-quill';

import {
  EmailTemplateService,
  EmailTemplate,
  ComposedEmail,
  EmailVariable,
} from '../../services/email-template.service';
import { NotificationService } from '../../core/notification.service';
import { ErrorDisplayComponent } from '../../shared/components';
import { copyToClipboard } from '../../shared/clipboard.utils';
import { EmailValidator } from '../../shared/email-validator.utils';

/**
 * Email composer component with ngx-quill rich text editor integration
 * Provides rich text editing with template selection and variable substitution
 */
@Component({
  selector: 'app-email-composer',
  templateUrl: './email-composer.component.html',
  styleUrl: './email-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    QuillModule,
    ErrorDisplayComponent,
  ],
})
export class EmailComposerComponent implements OnInit {
  // Injected dependencies
  private readonly emailService = inject(EmailTemplateService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Input signals
  template = input<EmailTemplate>();
  recipients = input<string[]>([]);

  // Output signals
  emailComposed = output<ComposedEmail>();

  // Component state signals
  private readonly _isPreviewMode = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  public editorContent = signal('');

  // Form and editor state
  public readonly emailForm: FormGroup;
  public readonly recipientChips = signal<string[]>([]);
  public readonly ccChips = signal<string[]>([]);

  // Public computed signals
  public readonly templates = this.emailService.templates;
  public readonly selectedTemplate = this.emailService.selectedTemplate;
  public readonly variableValues = this.emailService.variableValues;
  public readonly previewHtml = this.emailService.previewHtml;
  public readonly previewSubject = this.emailService.previewSubject;
  public readonly isPreviewMode = this._isPreviewMode.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Editor configuration for Quill rich text editing
  public readonly editorConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
      ['link'],
    ],
  };

  public readonly editorStyle = {
    height: '300px',
  };

  public readonly editorReadOnly = computed(() => this._isPreviewMode());

  constructor() {
    // Initialize form
    this.emailForm = this.formBuilder.group({
      templateId: ['', Validators.required],
      subject: ['', Validators.required],
      recipientInput: [''],
      ccInput: [''],
    });

    // Initialize recipients from input
    const initialRecipients = this.recipients();
    if (initialRecipients.length > 0) {
      this.recipientChips.set([...initialRecipients]);
    }

    // Watch for template input changes
    const templateInput = this.template();
    if (templateInput) {
      this.loadTemplate(templateInput.id);
    }
  }

  async ngOnInit(): Promise<void> {
    // Watch for template changes and update form
    const templateInput = this.template();
    if (templateInput) {
      await this.loadTemplate(templateInput.id);
    }
  }

  /**
   * Loads a template by ID
   */
  async loadTemplate(templateId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      this.emailService.selectTemplate(templateId);
      const template = this.selectedTemplate();

      if (template) {
        this.emailForm.patchValue(
          {
            templateId: template.id,
            subject: template.subject,
          },
          { emitEvent: false },
        );

        // Update editor content
        this.editorContent.set(template.body);
      } else {
        throw new Error('Template not found');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load template';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Template loading error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sets the value for a template variable
   */
  setVariable(key: string, value: string): void {
    this.emailService.setVariableValue(key, value);

    // Update subject if it contains this variable
    const updatedSubject = this.previewSubject();
    this.emailForm.patchValue(
      { subject: updatedSubject },
      { emitEvent: false },
    );
  }

  /**
   * Adds a recipient email
   */
  addRecipient(email: string): void {
    if (email && this.isValidEmail(email)) {
      const current = this.recipientChips();
      if (!current.includes(email)) {
        this.recipientChips.set([...current, email]);
        this.emailForm.patchValue({ recipientInput: '' });
      }
    }
  }

  /**
   * Removes a recipient email
   */
  removeRecipient(email: string): void {
    const current = this.recipientChips();
    this.recipientChips.set(current.filter((r) => r !== email));
  }

  /**
   * Adds a CC email
   */
  addCc(email: string): void {
    if (email && this.isValidEmail(email)) {
      const current = this.ccChips();
      if (!current.includes(email)) {
        this.ccChips.set([...current, email]);
        this.emailForm.patchValue({ ccInput: '' });
      }
    }
  }

  /**
   * Removes a CC email
   */
  removeCc(email: string): void {
    const current = this.ccChips();
    this.ccChips.set(current.filter((c) => c !== email));
  }

  /**
   * Handles Enter key in recipient/CC inputs
   */
  onEmailInputKeydown(event: KeyboardEvent, type: 'recipient' | 'cc'): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const email = input.value.trim();

      if (type === 'recipient') {
        this.addRecipient(email);
      } else {
        this.addCc(email);
      }
    }
  }

  /**
   * Toggles between edit and preview mode
   */
  togglePreview(): void {
    this._isPreviewMode.set(!this._isPreviewMode());
  }

  /**
   * Gets the current preview HTML
   */
  getPreview(): string {
    if (this._isPreviewMode()) {
      return this.previewHtml();
    }

    const content = this.editorContent();
    const values = this.variableValues();
    return this.substituteVariables(content, values);
  }

  /**
   * Handles Quill editor content changes
   */
  onQuillContentChange(event: {
    html: string | null;
    text: string | null;
  }): void {
    const content = event.html || event.text || '';
    this.editorContent.set(content);
  }

  /**
   * Updates editor content (for Quill integration)
   */
  onEditorContentChange(content: string): void {
    this.editorContent.set(content);
  }

  /**
   * Copies email content to clipboard
   */
  async copyToClipboard(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const preview = this.getPreview();
      await copyToClipboard(preview);
      this.notificationService.success('Email content copied to clipboard');
    } catch (error) {
      const errorMessage = 'Failed to copy to clipboard';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Clipboard error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Opens email in Gmail compose
   */
  openInGmail(): void {
    try {
      this._error.set(null);

      const recipients = this.recipientChips();
      const subject = this.previewSubject();
      const body = this.getPreview();

      if (recipients.length === 0) {
        this.notificationService.warning('Please add at least one recipient');
        return;
      }

      const gmailUrl = this.emailService.getGmailComposeUrl(
        recipients,
        subject,
        body,
      );
      window.open(gmailUrl, '_blank');
    } catch (error) {
      const errorMessage = 'Failed to open Gmail composer';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Gmail compose error:', error);
    }
  }

  /**
   * Composes and emits the final email
   */
  async composeEmail(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const validation = this.emailService.validateRequiredVariables();
      if (!validation.isValid) {
        this.notificationService.warning(
          `Please fill in required variables: ${validation.missingVariables.join(', ')}`,
        );
        return;
      }

      const recipients = this.recipientChips();
      if (recipients.length === 0) {
        this.notificationService.warning('Please add at least one recipient');
        return;
      }

      const composedEmail = this.emailService.composeEmail(
        recipients,
        this.ccChips().length > 0 ? this.ccChips() : undefined,
      );

      if (composedEmail) {
        this.emailComposed.emit(composedEmail);
        this.notificationService.success('Email composed successfully');
      } else {
        throw new Error('Failed to compose email');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to compose email';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Email composition error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Inserts a variable placeholder at cursor position
   */
  insertVariable(variable: EmailVariable): void {
    const placeholder = `{{${variable.key}}}`;
    const currentContent = this.editorContent();

    // For Quill, we append to the content (cursor position would require more complex implementation)
    const updatedContent = currentContent
      ? `${currentContent} ${placeholder}`
      : placeholder;

    this.editorContent.set(updatedContent);
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    return EmailValidator.isValid(email);
  }

  /**
   * Substitutes variables in text (local helper)
   */
  private substituteVariables(
    text: string,
    values: Record<string, string>,
  ): string {
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });
    return result;
  }

  /**
   * Retries the last failed operation
   */
  async retry(): Promise<void> {
    this._error.set(null);
    const templateInput = this.template();
    if (templateInput) {
      await this.loadTemplate(templateInput.id);
    }
  }

  /**
   * Gets category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      enrollment: 'Enrollment',
      onboarding: 'Onboarding',
      security: 'Security',
      general: 'General',
    };
    return categoryMap[category] || category;
  }

  /**
   * Gets category color
   */
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      enrollment: 'primary',
      onboarding: 'accent',
      security: 'warn',
      general: 'basic',
    };
    return colorMap[category] || 'basic';
  }
}
