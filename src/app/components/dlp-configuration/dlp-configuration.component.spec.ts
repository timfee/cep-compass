import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DlpConfigurationComponent } from './dlp-configuration.component';
import { NotificationService } from '../../core/notification.service';

interface ClipboardMock {
  writeText: jasmine.Spy<(text: string) => Promise<void>>;
}

describe('DlpConfigurationComponent', () => {
  let component: DlpConfigurationComponent;
  let fixture: ComponentFixture<DlpConfigurationComponent>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    // Clear localStorage before each test
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DlpConfigurationComponent, NoopAnimationsModule],
      providers: [{ provide: NotificationService, useValue: notificationServiceSpy }],
    }).compileComponents();

    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture = TestBed.createComponent(DlpConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.selectedPolicyTemplate()).toBe('');
    expect(component.showPolicyDetails()).toBeFalse();
    expect(component.dlpActivated()).toBeFalse();
  });

  it('should have audit policy templates', () => {
    expect(component.auditPolicyTemplates).toBeDefined();
    expect(component.auditPolicyTemplates.length).toBe(3);
    expect(component.auditPolicyTemplates[0].id).toBe('sensitive-data-audit');
    expect(component.auditPolicyTemplates[1].id).toBe('external-sharing-audit');
    expect(component.auditPolicyTemplates[2].id).toBe('download-monitoring');
  });

  describe('openDlpConsole', () => {
    it('should open DLP console and show snackbar', () => {
      spyOn(window, 'open');

      component.openDlpConsole();

      expect(window.open).toHaveBeenCalledWith(
        'https://admin.google.com/ac/chrome/datalossPrevention',
        '_blank',
        'noopener,noreferrer',
      );
      expect(notificationService.info).toHaveBeenCalledWith(
        'DLP Configuration page opened in new tab',
      );
    });
  });

  describe('selectTemplate', () => {
    it('should select template and show details', () => {
      component.selectTemplate('sensitive-data-audit');

      expect(component.selectedPolicyTemplate()).toBe('sensitive-data-audit');
      expect(component.showPolicyDetails()).toBeTrue();
    });
  });

  describe('copyPolicyConfig', () => {
    let mockClipboard: jasmine.SpyObj<ClipboardMock>;

    beforeEach(() => {
      // Mock clipboard API for headless browser environment
      mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
      };
      
      // Use defineProperty to properly mock the clipboard in headless environment
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
        writable: true
      });
      
      // Ensure secure context for clipboard API to work
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
        writable: true
      });
    });

    it('should copy sensitive data audit config to clipboard', async () => {
      component.selectTemplate('sensitive-data-audit');

      await component.copyPolicyConfig();

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        jasmine.stringContaining('Audit Sensitive Data Uploads'),
      );
      expect(notificationService.success).toHaveBeenCalledWith(
        'Policy configuration copied to clipboard!',
      );
    });

    it('should copy external sharing audit config to clipboard', async () => {
      component.selectTemplate('external-sharing-audit');

      await component.copyPolicyConfig();

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        jasmine.stringContaining('Audit External File Sharing'),
      );
    });

    it('should copy download monitoring config to clipboard', async () => {
      component.selectTemplate('download-monitoring');

      await component.copyPolicyConfig();

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        jasmine.stringContaining('Audit Corporate Downloads'),
      );
    });

    it('should handle clipboard error', async () => {
      mockClipboard.writeText.and.returnValue(
        Promise.reject(new Error('Clipboard error')),
      );
      component.selectTemplate('sensitive-data-audit');

      await component.copyPolicyConfig();

      expect(notificationService.error).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
      );
    });

    it('should do nothing when no template is selected', async () => {
      await component.copyPolicyConfig();

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('markAsConfigured', () => {
    it('should mark DLP as activated and show success message', () => {
      component.markAsConfigured();

      expect(component.dlpActivated()).toBeTrue();
      expect(notificationService.success).toHaveBeenCalledWith(
        'DLP Configuration marked as completed!',
      );
    });

    it('should save activation state to localStorage', () => {
      component.markAsConfigured();

      const storedState = localStorage.getItem('cep-compass-dlp');
      expect(storedState).toBeTruthy();

      const parsedState = JSON.parse(storedState!);
      expect(parsedState.activated).toBeTrue();
      expect(parsedState.activatedDate).toBeTruthy();
    });
  });

  describe('openExternalLink', () => {
    it('should open external link in new tab', () => {
      spyOn(window, 'open');
      const testUrl = 'https://example.com';

      component.openExternalLink(testUrl);

      expect(window.open).toHaveBeenCalledWith(
        testUrl,
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  describe('localStorage integration', () => {
    it('should load activation state from localStorage on init', () => {
      const mockState = {
        activated: true,
        activatedDate: '2023-01-01T00:00:00.000Z',
      };
      localStorage.setItem('cep-compass-dlp', JSON.stringify(mockState));

      // Create new component instance to trigger constructor
      const newFixture = TestBed.createComponent(DlpConfigurationComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.dlpActivated()).toBeTrue();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('cep-compass-dlp', 'invalid-json');
      spyOn(console, 'warn');

      // Create new component instance to trigger constructor
      const newFixture = TestBed.createComponent(DlpConfigurationComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.dlpActivated()).toBeFalse();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully when saving', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      spyOn(console, 'warn');

      component.markAsConfigured();

      expect(console.warn).toHaveBeenCalled();
    });
  });
});
