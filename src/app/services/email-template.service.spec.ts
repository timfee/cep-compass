import { TestBed } from '@angular/core/testing';
import { EmailTemplateService, EmailVariable } from './email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailTemplateService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Template Management', () => {
    it('should load pre-built templates', () => {
      const templates = service.templates();
      expect(templates.length).toBeGreaterThan(0);

      // Check for expected pre-built templates
      const templateIds = templates.map((t) => t.id);
      expect(templateIds).toContain('browser-enrollment');
      expect(templateIds).toContain('user-chrome-profile-login');
      expect(templateIds).toContain('security-policy-notification');
    });

    it('should select a template by ID', () => {
      const templates = service.templates();
      const firstTemplate = templates[0];

      service.selectTemplate(firstTemplate.id);

      expect(service.selectedTemplate()).toEqual(firstTemplate);
    });

    it('should initialize variable values with defaults when selecting template', () => {
      const templates = service.templates();
      const templateWithDefaults = templates.find((t) =>
        t.variables.some((v) => v.defaultValue),
      );

      if (templateWithDefaults) {
        service.selectTemplate(templateWithDefaults.id);

        const values = service.variableValues();
        const defaultVariables = templateWithDefaults.variables.filter(
          (v) => v.defaultValue,
        );

        defaultVariables.forEach((variable) => {
          expect(values[variable.key]).toBe(variable.defaultValue || '');
        });
      }
    });
  });

  describe('Variable Management', () => {
    beforeEach(() => {
      // Select a template for testing
      const templates = service.templates();
      service.selectTemplate(templates[0].id);
    });

    it('should set variable value', () => {
      const testKey = 'testKey';
      const testValue = 'testValue';

      service.setVariableValue(testKey, testValue);

      expect(service.variableValues()[testKey]).toBe(testValue);
    });

    it('should set multiple variable values', () => {
      const testValues = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };

      service.setVariableValues(testValues);

      const values = service.variableValues();
      Object.entries(testValues).forEach(([key, value]) => {
        expect(values[key]).toBe(value);
      });
    });

    it('should clear variable values', () => {
      service.setVariableValue('test', 'value');
      expect(Object.keys(service.variableValues()).length).toBeGreaterThan(0);

      service.clearVariableValues();

      expect(Object.keys(service.variableValues()).length).toBe(0);
    });
  });

  describe('Variable Substitution', () => {
    beforeEach(() => {
      const templates = service.templates();
      service.selectTemplate(templates[0].id);
    });

    it('should substitute variables in preview HTML', () => {
      const template = service.selectedTemplate();
      if (template && template.variables.length > 0) {
        const variable = template.variables[0];
        const testValue = 'Test Value';

        service.setVariableValue(variable.key, testValue);

        const preview = service.previewHtml();
        expect(preview).toContain(testValue);
        expect(preview).not.toContain(`{{${variable.key}}}`);
      }
    });

    it('should substitute variables in preview subject', () => {
      const template = service.selectedTemplate();
      if (template && template.variables.length > 0) {
        const variable = template.variables[0];
        const testValue = 'Test Value';

        service.setVariableValue(variable.key, testValue);

        const preview = service.previewSubject();
        if (template.subject.includes(`{{${variable.key}}}`)) {
          expect(preview).toContain(testValue);
          expect(preview).not.toContain(`{{${variable.key}}}`);
        }
      }
    });

    it('should leave unsubstituted variables as placeholders', () => {
      const template = service.selectedTemplate();
      if (template && template.variables.length > 0) {
        const variable = template.variables[0];

        // Don't set any value for the variable
        const preview = service.previewHtml();
        expect(preview).toContain(`{{${variable.key}}}`);
      }
    });
  });

  describe('Email Composition', () => {
    beforeEach(() => {
      const templates = service.templates();
      service.selectTemplate(templates[0].id);
    });

    it('should compose email with all required variables', () => {
      const template = service.selectedTemplate();
      if (template) {
        // Set all required variables
        template.variables.forEach((variable) => {
          if (variable.required) {
            service.setVariableValue(variable.key, `test-${variable.key}`);
          }
        });

        const recipients = ['test@example.com'];
        const composedEmail = service.composeEmail(recipients);

        expect(composedEmail).toBeTruthy();
        expect(composedEmail!.to).toEqual(recipients);
        expect(composedEmail!.subject).toBeTruthy();
        expect(composedEmail!.body).toBeTruthy();
      }
    });

    it('should throw error when required variables are missing', () => {
      const template = service.selectedTemplate();
      if (template && template.variables.some((v) => v.required)) {
        const recipients = ['test@example.com'];

        expect(() => service.composeEmail(recipients)).toThrowError(
          /Missing required variables/,
        );
      }
    });

    it('should include CC recipients when provided', () => {
      const template = service.selectedTemplate();
      if (template) {
        // Set all required variables
        template.variables.forEach((variable) => {
          if (variable.required) {
            service.setVariableValue(variable.key, `test-${variable.key}`);
          }
        });

        const recipients = ['test@example.com'];
        const cc = ['cc@example.com'];
        const composedEmail = service.composeEmail(recipients, cc);

        expect(composedEmail!.cc).toEqual(cc);
      }
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      const templates = service.templates();
      service.selectTemplate(templates[0].id);
    });

    it('should validate required variables correctly', () => {
      const template = service.selectedTemplate();
      if (template) {
        const requiredVariables = template.variables.filter((v) => v.required);

        if (requiredVariables.length > 0) {
          // Initially should be invalid
          let validation = service.validateRequiredVariables();
          expect(validation.isValid).toBeFalse();
          expect(validation.missingVariables.length).toBeGreaterThan(0);

          // Set all required variables
          requiredVariables.forEach((variable) => {
            service.setVariableValue(variable.key, `test-${variable.key}`);
          });

          // Should now be valid
          validation = service.validateRequiredVariables();
          expect(validation.isValid).toBeTrue();
          expect(validation.missingVariables.length).toBe(0);
        }
      }
    });
  });

  describe('Custom Templates', () => {
    it('should save custom template', () => {
      const customTemplate = {
        name: 'Test Template',
        subject: 'Test Subject {{name}}',
        body: '<p>Hello {{name}}</p>',
        variables: [
          {
            key: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          } as EmailVariable,
        ],
        category: 'general' as const,
      };

      const initialCount = service.templates().length;
      service.saveCustomTemplate(customTemplate);

      expect(service.templates().length).toBe(initialCount + 1);

      const savedTemplate = service
        .templates()
        .find((t) => t.name === customTemplate.name);
      expect(savedTemplate).toBeTruthy();
      expect(savedTemplate!.id).toContain('custom-');
    });

    it('should delete custom template', () => {
      const customTemplate = {
        name: 'Test Template',
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
        variables: [],
        category: 'general' as const,
      };

      service.saveCustomTemplate(customTemplate);
      const savedTemplate = service
        .templates()
        .find((t) => t.name === customTemplate.name);

      if (savedTemplate) {
        const initialCount = service.templates().length;
        service.deleteCustomTemplate(savedTemplate.id);

        expect(service.templates().length).toBe(initialCount - 1);
        expect(
          service.templates().find((t) => t.id === savedTemplate.id),
        ).toBeFalsy();
      }
    });

    it('should export and import templates', () => {
      const customTemplate = {
        name: 'Export Test Template',
        subject: 'Export Test',
        body: '<p>Export Test</p>',
        variables: [],
        category: 'general' as const,
      };

      service.saveCustomTemplate(customTemplate);

      const exportData = service.exportTemplates();
      expect(exportData).toBeTruthy();

      // Clear custom templates
      const savedTemplate = service
        .templates()
        .find((t) => t.name === customTemplate.name);
      if (savedTemplate) {
        service.deleteCustomTemplate(savedTemplate.id);
      }

      // Import them back
      service.importTemplates(exportData);

      const importedTemplate = service
        .templates()
        .find((t) => t.name === customTemplate.name);
      expect(importedTemplate).toBeTruthy();
    });
  });

  describe('Utility Functions', () => {
    it('should generate Gmail compose URL', () => {
      const recipients = ['test@example.com'];
      const subject = 'Test Subject';
      const body = '<p>Test Body</p>';

      const url = service.getGmailComposeUrl(recipients, subject, body);

      expect(url).toContain('https://mail.google.com/mail/');
      expect(url).toContain('view=cm');
      expect(url).toContain('to=test%40example.com');
      expect(url).toContain('subject=Test+Subject');
      expect(url).toContain('body=Test+Body');
    });

    it('should copy to clipboard', async () => {
      // Mock clipboard API
      const mockWriteText = jasmine
        .createSpy('writeText')
        .and.returnValue(Promise.resolve());
      
      // Use defineProperty to mock the clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        configurable: true
      });
      
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
      });

      const testText = 'Test text to copy';
      await service.copyToClipboard(testText);

      expect(mockWriteText).toHaveBeenCalledWith(testText);
    });
  });
});
