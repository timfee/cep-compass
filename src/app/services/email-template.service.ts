import { Injectable, computed, signal } from '@angular/core';

/**
 * Represents an email template with variables and metadata
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML content
  variables: EmailVariable[];
  category: 'enrollment' | 'onboarding' | 'security' | 'general';
}

/**
 * Represents a variable that can be substituted in email templates
 */
export interface EmailVariable {
  key: string; // e.g., {{companyName}}
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[]; // for select type
  required: boolean;
  defaultValue?: string;
}

/**
 * Represents a composed email ready to send
 */
export interface ComposedEmail {
  to: string[];
  cc?: string[];
  subject: string;
  body: string; // Final HTML after substitution
  attachments?: EmailAttachment[];
}

/**
 * Represents an email attachment
 */
export interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded content
  mimeType: string;
}

/**
 * Service for managing email templates and composition
 * Provides pre-built templates and variable substitution
 */
@Injectable({
  providedIn: 'root',
})
export class EmailTemplateService {
  // Private state signals
  private readonly _templates = signal<EmailTemplate[]>([]);
  private readonly _customTemplates = signal<EmailTemplate[]>([]);
  private readonly _selectedTemplate = signal<EmailTemplate | null>(null);
  private readonly _variableValues = signal<Record<string, string>>({});

  /**
   * Signal containing all available templates (pre-built + custom)
   */
  public readonly templates = computed(() => [
    ...this.getPrebuiltTemplates(),
    ...this._customTemplates(),
  ]);

  /**
   * Signal containing the currently selected template
   */
  public readonly selectedTemplate = this._selectedTemplate.asReadonly();

  /**
   * Signal containing current variable values
   */
  public readonly variableValues = this._variableValues.asReadonly();

  /**
   * Signal for preview HTML with variables substituted
   */
  public readonly previewHtml = computed(() => {
    const template = this._selectedTemplate();
    const values = this._variableValues();

    if (!template) return '';

    return this.substituteVariables(template.body, values);
  });

  /**
   * Signal for preview subject with variables substituted
   */
  public readonly previewSubject = computed(() => {
    const template = this._selectedTemplate();
    const values = this._variableValues();

    if (!template) return '';

    return this.substituteVariables(template.subject, values);
  });

  constructor() {
    this.loadCustomTemplatesFromStorage();
  }

  /**
   * Gets pre-built email templates
   */
  private getPrebuiltTemplates(): EmailTemplate[] {
    return [
      {
        id: 'browser-enrollment',
        name: 'Browser Enrollment Instructions',
        subject: 'Chrome Browser Enrollment Token - {{orgUnitName}}',
        body: `
          <p>Hello {{adminName}},</p>
          
          <p>Here is the Chrome browser enrollment token for <strong>{{orgUnitName}}</strong>:</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; font-family: monospace;">
            {{enrollmentToken}}
          </div>
          
          <p><strong>Token expires on:</strong> {{expirationDate}}</p>
          
          <h3>Deployment Instructions:</h3>
          
          <h4>Windows (Group Policy or Registry):</h4>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">reg add HKLM\\Software\\Policies\\Google\\Chrome\\CloudManagementEnrollmentToken /v CloudManagementEnrollmentToken /t REG_SZ /d {{enrollmentToken}} /f</pre>
          
          <h4>macOS (Configuration Profile or Terminal):</h4>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">sudo defaults write com.google.Chrome CloudManagementEnrollmentToken -string "{{enrollmentToken}}"</pre>
          
          <h4>Linux (Policy File):</h4>
          <p>Create <code>/etc/opt/chrome/policies/managed/enrollment.json</code>:</p>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">{"CloudManagementEnrollmentToken": "{{enrollmentToken}}"}</pre>
          
          <p><strong>Important:</strong> After applying the token, users must restart Chrome for enrollment to take effect.</p>
          
          <p>For more information, visit the <a href="https://support.google.com/chrome/a/answer/9116852">Chrome Browser Cloud Management documentation</a>.</p>
          
          <p>Best regards,<br>
          {{senderName}}</p>
        `,
        variables: [
          {
            key: 'adminName',
            label: 'IT Admin Name',
            type: 'text',
            required: true,
          },
          {
            key: 'orgUnitName',
            label: 'Organizational Unit',
            type: 'text',
            required: true,
          },
          {
            key: 'enrollmentToken',
            label: 'Enrollment Token',
            type: 'text',
            required: true,
          },
          {
            key: 'expirationDate',
            label: 'Token Expiration Date',
            type: 'text',
            required: true,
          },
          {
            key: 'senderName',
            label: 'Your Name',
            type: 'text',
            required: true,
          },
        ],
        category: 'enrollment',
      },
      {
        id: 'user-chrome-profile-login',
        name: 'User Chrome Profile Login Instructions',
        subject: 'Sign in to Chrome with Your Work Account',
        body: `
          <h2>Chrome Profile Setup Instructions</h2>
          <p>Hello,</p>
          <p>To access {{companyName}} resources through Chrome, please follow these steps:</p>
          <ol>
            <li>Open Google Chrome</li>
            <li>Click on your profile icon in the top right corner</li>
            <li>Select "Add" to create a new profile</li>
            <li>Sign in with your {{companyName}} work account</li>
            <li>Allow Chrome to sync your work data</li>
          </ol>
          <p><strong>SSO Provider:</strong> {{ssoProvider}}</p>
          <p>If you encounter any issues, please contact our help desk at: <a href="mailto:{{helpDeskEmail}}">{{helpDeskEmail}}</a></p>
          <p>Best regards,<br>IT Support Team</p>
        `,
        variables: [
          {
            key: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true,
          },
          {
            key: 'helpDeskEmail',
            label: 'Help Desk Email',
            type: 'text',
            required: true,
          },
          {
            key: 'ssoProvider',
            label: 'SSO Provider',
            type: 'select',
            options: ['Google', 'Microsoft', 'Okta', 'SAML'],
            required: true,
          },
        ],
        category: 'onboarding',
      },
      {
        id: 'security-policy-notification',
        name: 'Security Policy Notification',
        subject: 'New Chrome Security Policies Active',
        body: `
          <h2>Security Policy Update</h2>
          <p>Dear Team,</p>
          <p>We're notifying you that new Chrome security policies have been activated for your organization.</p>
          <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <strong>Policy Name:</strong> {{policyName}}<br>
            <strong>Effective Date:</strong> {{effectiveDate}}<br>
            <strong>Affected Users:</strong> {{affectedUsers}}
          </div>
          <p>These policies are designed to enhance the security of your Chrome browsing experience and protect company data.</p>
          <p>If you have any questions about these changes, please contact the IT security team.</p>
          <p>Thank you for your cooperation,<br>IT Security Team</p>
        `,
        variables: [
          {
            key: 'policyName',
            label: 'Policy Name',
            type: 'text',
            required: true,
          },
          {
            key: 'effectiveDate',
            label: 'Effective Date',
            type: 'text',
            required: true,
          },
          {
            key: 'affectedUsers',
            label: 'Affected Users',
            type: 'text',
            required: true,
          },
        ],
        category: 'security',
      },
      {
        id: 'profile-enrollment',
        name: 'Chrome Profile Sign-in Instructions',
        subject:
          'Action Required: Sign in to Chrome with Your {{companyName}} Account',
        category: 'enrollment',
        body: `
          <p>Dear {{userName}},</p>
          
          <p>To ensure you have access to all {{companyName}} resources and maintain security compliance, please sign in to Chrome with your work account.</p>
          
          <h3>Why Sign In to Chrome?</h3>
          <ul>
            <li>Access bookmarks and passwords across devices</li>
            <li>Automatic security updates and protections</li>
            <li>Seamless access to company applications</li>
            <li>Enhanced browsing security and data protection</li>
          </ul>
          
          <h3>How to Sign In:</h3>
          <ol>
            <li><strong>Open Chrome</strong> and click your profile icon (top-right corner)</li>
            <li>Click <strong>"Turn on sync"</strong> or <strong>"Sign in to Chrome"</strong></li>
            <li>Enter your work email: <strong>{{userEmail}}</strong></li>
            <li>You'll be redirected to {{ssoProvider}} - complete the sign-in process</li>
            <li>Click <strong>"Yes, I'm in"</strong> when asked about sync</li>
          </ol>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0;">
            <strong>⚠️ Important:</strong> Make sure to use your <strong>work email address</strong>, not a personal Gmail account.
          </div>
          
          <h3>Need Help?</h3>
          <p>If you encounter any issues:</p>
          <ul>
            <li>Contact IT Support at {{helpDeskEmail}}</li>
            <li>Visit our <a href="{{helpDeskUrl}}">Help Center</a></li>
            <li>Review the <a href="https://support.google.com/chrome/a/answer/7394216">Chrome Sign-in Guide</a></li>
          </ul>
          
          <p>Please complete this process by <strong>{{deadline}}</strong> to ensure uninterrupted access to company resources.</p>
          
          <p>Thank you for your cooperation!</p>
          
          <p>Best regards,<br>
          {{senderName}}<br>
          {{senderTitle}}</p>
        `,
        variables: [
          {
            key: 'userName',
            label: 'User Name',
            type: 'text',
            required: false,
            defaultValue: 'Team',
          },
          {
            key: 'userEmail',
            label: 'User Email',
            type: 'text',
            required: false,
            defaultValue: 'your work email',
          },
          {
            key: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true,
          },
          {
            key: 'ssoProvider',
            label: 'SSO Provider',
            type: 'select',
            required: true,
            options: [
              'Google Workspace',
              'Microsoft Azure AD',
              'Okta',
              'OneLogin',
              'Other SSO',
            ],
          },
          {
            key: 'helpDeskEmail',
            label: 'IT Support Email',
            type: 'text',
            required: true,
          },
          {
            key: 'helpDeskUrl',
            label: 'Help Center URL',
            type: 'text',
            required: false,
          },
          {
            key: 'deadline',
            label: 'Completion Deadline',
            type: 'text',
            required: true,
            defaultValue: 'end of this week',
          },
          {
            key: 'senderName',
            label: 'Your Name',
            type: 'text',
            required: true,
          },
          {
            key: 'senderTitle',
            label: 'Your Title',
            type: 'text',
            required: true,
            defaultValue: 'IT Administrator',
          },
        ],
      },
    ];
  }

  /**
   * Selects a template by ID
   */
  selectTemplate(templateId: string): void {
    const template = this.templates().find((t) => t.id === templateId);
    if (template) {
      this._selectedTemplate.set(template);
      // Initialize variables with default values
      const defaultValues: Record<string, string> = {};
      template.variables.forEach((variable) => {
        if (variable.defaultValue) {
          defaultValues[variable.key] = variable.defaultValue;
        }
      });
      this._variableValues.set(defaultValues);
    }
  }

  /**
   * Sets the value for a specific variable
   */
  setVariableValue(key: string, value: string): void {
    const currentValues = this._variableValues();
    this._variableValues.set({
      ...currentValues,
      [key]: value,
    });
  }

  /**
   * Sets multiple variable values at once
   */
  setVariableValues(values: Record<string, string>): void {
    const currentValues = this._variableValues();
    this._variableValues.set({
      ...currentValues,
      ...values,
    });
  }

  /**
   * Clears all variable values
   */
  clearVariableValues(): void {
    this._variableValues.set({});
  }

  /**
   * Substitutes variables in a text string
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
   * Validates that all required variables have values
   */
  validateRequiredVariables(): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const template = this._selectedTemplate();
    const values = this._variableValues();

    if (!template) {
      return { isValid: false, missingVariables: [] };
    }

    const missingVariables: string[] = [];
    template.variables.forEach((variable) => {
      if (
        variable.required &&
        (!values[variable.key] || values[variable.key].trim() === '')
      ) {
        missingVariables.push(variable.label);
      }
    });

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Composes the final email with all variables substituted
   */
  composeEmail(recipients: string[], cc?: string[]): ComposedEmail | null {
    const template = this._selectedTemplate();
    const values = this._variableValues();

    if (!template) return null;

    const validation = this.validateRequiredVariables();
    if (!validation.isValid) {
      throw new Error(
        `Missing required variables: ${validation.missingVariables.join(', ')}`,
      );
    }

    return {
      to: recipients,
      cc,
      subject: this.substituteVariables(template.subject, values),
      body: this.substituteVariables(template.body, values),
    };
  }

  /**
   * Saves a custom template to localStorage
   */
  saveCustomTemplate(template: Omit<EmailTemplate, 'id'>): void {
    const id = `custom-${Date.now()}`;
    const customTemplate: EmailTemplate = { ...template, id };

    const currentCustom = this._customTemplates();
    this._customTemplates.set([...currentCustom, customTemplate]);
    this.saveCustomTemplatesToStorage();
  }

  /**
   * Deletes a custom template
   */
  deleteCustomTemplate(templateId: string): void {
    const currentCustom = this._customTemplates();
    this._customTemplates.set(currentCustom.filter((t) => t.id !== templateId));
    this.saveCustomTemplatesToStorage();
  }

  /**
   * Exports templates as JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this._customTemplates(), null, 2);
  }

  /**
   * Imports templates from JSON
   */
  importTemplates(jsonData: string): void {
    try {
      const templates = JSON.parse(jsonData) as EmailTemplate[];
      // Validate templates
      const validTemplates = templates.filter(
        (t) =>
          t.id && t.name && t.subject && t.body && t.variables && t.category,
      );
      this._customTemplates.set(validTemplates);
      this.saveCustomTemplatesToStorage();
    } catch {
      throw new Error('Invalid template data format');
    }
  }

  /**
   * Loads custom templates from localStorage
   */
  private loadCustomTemplatesFromStorage(): void {
    try {
      const stored = localStorage.getItem('customEmailTemplates');
      if (stored) {
        const templates = JSON.parse(stored) as EmailTemplate[];
        this._customTemplates.set(templates);
      }
    } catch (error) {
      console.warn('Failed to load custom templates from storage:', error);
    }
  }

  /**
   * Saves custom templates to localStorage
   */
  private saveCustomTemplatesToStorage(): void {
    try {
      localStorage.setItem(
        'customEmailTemplates',
        JSON.stringify(this._customTemplates()),
      );
    } catch (err) {
      console.warn('Failed to save custom templates to storage:', err);
    }
  }

  /**
   * Gets the mailto URL for opening in Gmail
   */
  getGmailComposeUrl(
    recipients: string[],
    subject: string,
    body: string,
  ): string {
    const params = new URLSearchParams({
      to: recipients.join(','),
      subject,
      body: this.htmlToPlainText(body),
    });
    return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
  }

  /**
   * Converts HTML to plain text for mailto links
   */
  private htmlToPlainText(html: string): string {
    // Use DOMParser to safely parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  /**
   * Copies text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      try {
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
      } finally {
        // Ensure the textarea is removed from the DOM
        document.body.removeChild(textArea);
      }
    }
  }
}
