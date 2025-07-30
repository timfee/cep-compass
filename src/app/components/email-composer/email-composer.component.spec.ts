import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QuillModule } from 'ngx-quill';

import { EmailComposerComponent } from './email-composer.component';
import { EmailTemplateService } from '../../services/email-template.service';

describe('EmailComposerComponent', () => {
  let component: EmailComposerComponent;
  let fixture: ComponentFixture<EmailComposerComponent>;
  let emailService: jasmine.SpyObj<EmailTemplateService>;

  const mockTemplate = {
    id: 'test-template',
    name: 'Test Template',
    subject: 'Test Subject {{name}}',
    body: '<p>Hello {{name}}</p>',
    variables: [
      { key: 'name', label: 'Name', type: 'text' as const, required: true },
    ],
    category: 'general' as const,
  };

  beforeEach(async () => {
    const emailServiceSpy = jasmine.createSpyObj(
      'EmailTemplateService',
      [
        'selectTemplate',
        'setVariableValue',
        'composeEmail',
        'validateRequiredVariables',
        'getGmailComposeUrl',
      ],
      {
        templates: () => [mockTemplate],
        selectedTemplate: () => mockTemplate,
        variableValues: () => ({}),
        previewHtml: () => '<p>Hello Test</p>',
        previewSubject: () => 'Test Subject Test',
      },
    );

    await TestBed.configureTestingModule({
      imports: [
        EmailComposerComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        QuillModule.forRoot(),
      ],
      providers: [{ provide: EmailTemplateService, useValue: emailServiceSpy }],
    }).compileComponents();

    emailService = TestBed.inject(
      EmailTemplateService,
    ) as jasmine.SpyObj<EmailTemplateService>;
    fixture = TestBed.createComponent(EmailComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Template Loading', () => {
    it('should load template when ID is provided', () => {
      component.loadTemplate('test-template');

      expect(emailService.selectTemplate).toHaveBeenCalledWith('test-template');
    });

    it('should update form when template is loaded', () => {
      component.loadTemplate('test-template');

      expect(component.emailForm.get('templateId')?.value).toBe(
        'test-template',
      );
    });
  });

  describe('Variable Management', () => {
    it('should set variable value in service', () => {
      const key = 'name';
      const value = 'Test Value';

      component.setVariable(key, value);

      expect(emailService.setVariableValue).toHaveBeenCalledWith(key, value);
    });
  });

  describe('Recipient Management', () => {
    it('should add valid recipient email', () => {
      const email = 'test@example.com';

      component.addRecipient(email);

      expect(component.recipientChips()).toContain(email);
    });

    it('should not add invalid recipient email', () => {
      const invalidEmail = 'invalid-email';

      component.addRecipient(invalidEmail);

      expect(component.recipientChips()).not.toContain(invalidEmail);
    });

    it('should not add duplicate recipient email', () => {
      const email = 'test@example.com';

      component.addRecipient(email);
      component.addRecipient(email);

      expect(component.recipientChips().filter((r) => r === email).length).toBe(
        1,
      );
    });

    it('should remove recipient email', () => {
      const email = 'test@example.com';

      component.addRecipient(email);
      expect(component.recipientChips()).toContain(email);

      component.removeRecipient(email);
      expect(component.recipientChips()).not.toContain(email);
    });
  });

  describe('CC Management', () => {
    it('should add valid CC email', () => {
      const email = 'cc@example.com';

      component.addCc(email);

      expect(component.ccChips()).toContain(email);
    });

    it('should not add invalid CC email', () => {
      const invalidEmail = 'invalid-email';

      component.addCc(invalidEmail);

      expect(component.ccChips()).not.toContain(invalidEmail);
    });

    it('should remove CC email', () => {
      const email = 'cc@example.com';

      component.addCc(email);
      expect(component.ccChips()).toContain(email);

      component.removeCc(email);
      expect(component.ccChips()).not.toContain(email);
    });
  });

  describe('Email Input Handling', () => {
    it('should add recipient on Enter key', () => {
      const email = 'test@example.com';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(event, 'target', {
        value: { value: email },
        writable: false,
      });

      spyOn(event, 'preventDefault');
      spyOn(component, 'addRecipient');

      component.onEmailInputKeydown(event, 'recipient');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.addRecipient).toHaveBeenCalledWith(email);
    });

    it('should add CC on Enter key', () => {
      const email = 'cc@example.com';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(event, 'target', {
        value: { value: email },
        writable: false,
      });

      spyOn(event, 'preventDefault');
      spyOn(component, 'addCc');

      component.onEmailInputKeydown(event, 'cc');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.addCc).toHaveBeenCalledWith(email);
    });
  });

  describe('Preview Mode', () => {
    it('should toggle preview mode', () => {
      expect(component.isPreviewMode()).toBeFalse();

      component.togglePreview();

      expect(component.isPreviewMode()).toBeTrue();
    });

    it('should get preview content', () => {
      component.editorContent.set('Test content');
      const preview = component.getPreview();

      expect(preview).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should copy to clipboard', async () => {
      // Mock the navigator clipboard API
      const writeTextSpy = jasmine
        .createSpy()
        .and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        configurable: true,
      });

      await component.copyToClipboard();

      expect(writeTextSpy).toHaveBeenCalled();
    });

    it('should open in Gmail', () => {
      const gmailUrl =
        'https://mail.google.com/mail/?view=cm&fs=1&to=test@example.com';
      emailService.getGmailComposeUrl.and.returnValue(gmailUrl);
      spyOn(window, 'open');

      component.addRecipient('test@example.com');
      component.openInGmail();

      expect(window.open).toHaveBeenCalledWith(gmailUrl, '_blank');
    });

    it('should compose email when validation passes', () => {
      const mockComposedEmail = {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      emailService.validateRequiredVariables.and.returnValue({
        isValid: true,
        missingVariables: [],
      });
      emailService.composeEmail.and.returnValue(mockComposedEmail);
      spyOn(component.emailComposed, 'emit');

      component.addRecipient('test@example.com');
      component.composeEmail();

      expect(component.emailComposed.emit).toHaveBeenCalledWith(
        mockComposedEmail,
      );
    });

    it('should not compose email when validation fails', () => {
      emailService.validateRequiredVariables.and.returnValue({
        isValid: false,
        missingVariables: ['Name'],
      });
      spyOn(component.emailComposed, 'emit');

      component.addRecipient('test@example.com');
      component.composeEmail();

      expect(component.emailComposed.emit).not.toHaveBeenCalled();
    });

    it('should not compose email without recipients', () => {
      emailService.validateRequiredVariables.and.returnValue({
        isValid: true,
        missingVariables: [],
      });
      spyOn(component.emailComposed, 'emit');

      component.composeEmail();

      expect(component.emailComposed.emit).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should validate email format correctly', () => {
      expect(
        (
          component as unknown as { isValidEmail: (email: string) => boolean }
        ).isValidEmail('test@example.com'),
      ).toBeTrue();
      expect(
        (
          component as unknown as { isValidEmail: (email: string) => boolean }
        ).isValidEmail('invalid-email'),
      ).toBeFalse();
      expect(
        (
          component as unknown as { isValidEmail: (email: string) => boolean }
        ).isValidEmail('test@'),
      ).toBeFalse();
      expect(
        (
          component as unknown as { isValidEmail: (email: string) => boolean }
        ).isValidEmail('@example.com'),
      ).toBeFalse();
    });

    it('should get category display name', () => {
      expect(component.getCategoryDisplayName('enrollment')).toBe('Enrollment');
      expect(component.getCategoryDisplayName('onboarding')).toBe('Onboarding');
      expect(component.getCategoryDisplayName('security')).toBe('Security');
      expect(component.getCategoryDisplayName('general')).toBe('General');
      expect(component.getCategoryDisplayName('unknown')).toBe('unknown');
    });

    it('should get category color', () => {
      expect(component.getCategoryColor('enrollment')).toBe('primary');
      expect(component.getCategoryColor('onboarding')).toBe('accent');
      expect(component.getCategoryColor('security')).toBe('warn');
      expect(component.getCategoryColor('general')).toBe('basic');
      expect(component.getCategoryColor('unknown')).toBe('basic');
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute variables in text', () => {
      const text = 'Hello {{name}}, welcome to {{company}}';
      const values = { name: 'John', company: 'Acme Corp' };

      const result = (
        component as unknown as {
          substituteVariables: (
            text: string,
            values: Record<string, string>,
          ) => string;
        }
      ).substituteVariables(text, values);

      expect(result).toBe('Hello John, welcome to Acme Corp');
    });

    it('should leave unmatched variables as placeholders', () => {
      const text = 'Hello {{name}}, welcome to {{company}}';
      const values = { name: 'John' };

      const result = (
        component as unknown as {
          substituteVariables: (
            text: string,
            values: Record<string, string>,
          ) => string;
        }
      ).substituteVariables(text, values);

      expect(result).toBe('Hello John, welcome to {{company}}');
    });
  });
});
