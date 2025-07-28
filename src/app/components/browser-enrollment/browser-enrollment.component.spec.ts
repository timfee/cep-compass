import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserEnrollmentComponent } from './browser-enrollment.component';
import { EnrollmentTokenService } from '../../services/enrollment-token.service';
import { OrgUnitsService } from '../../services/org-units.service';
import { EmailTemplateService } from '../../services/email-template.service';
import { NotificationService } from '../../core/notification.service';

describe('BrowserEnrollmentComponent', () => {
  let component: BrowserEnrollmentComponent;
  let fixture: ComponentFixture<BrowserEnrollmentComponent>;
  let mockEnrollmentService: jasmine.SpyObj<EnrollmentTokenService>;
  let mockOrgUnitService: jasmine.SpyObj<OrgUnitsService>;
  let mockEmailService: jasmine.SpyObj<EmailTemplateService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    // Create spies for services
    mockEnrollmentService = jasmine.createSpyObj(
      'EnrollmentTokenService',
      [
        'listTokens',
        'createToken',
        'maskToken',
        'isTokenActive',
        'getTokenExpirationDate',
      ],
      {
        tokens: signal([]),
        isLoading: signal(false),
        error: signal(null),
      },
    );

    mockOrgUnitService = jasmine.createSpyObj(
      'OrgUnitsService',
      ['fetchOrgUnits'],
      {
        orgUnits: signal([]),
        isLoading: signal(false),
      },
    );

    mockEmailService = jasmine.createSpyObj(
      'EmailTemplateService',
      ['selectTemplate', 'setVariableValues'],
      {
        templates: signal([]),
      },
    );

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [BrowserEnrollmentComponent, NoopAnimationsModule],
      providers: [
        { provide: EnrollmentTokenService, useValue: mockEnrollmentService },
        { provide: OrgUnitsService, useValue: mockOrgUnitService },
        { provide: EmailTemplateService, useValue: mockEmailService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowserEnrollmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize by fetching org units and tokens', () => {
    expect(mockOrgUnitService.fetchOrgUnits).toHaveBeenCalled();
    expect(mockEnrollmentService.listTokens).toHaveBeenCalled();
  });

  it('should set selected org unit', () => {
    const orgUnitPath = '/test/unit';
    component.setSelectedOrgUnit(orgUnitPath);
    expect(component.selectedOrgUnit()).toBe(orgUnitPath);
  });

  it('should show error when creating token without org unit selection', async () => {
    await component.createToken();
    expect(component.error()).toBe('Please select an organizational unit');
  });

  it('should create token when org unit is selected', async () => {
    const mockToken = {
      tokenId: 'test-token-id',
      token: 'test-token-value',
      tokenPermanentId: 'test-permanent-id',
      customerId: 'test-customer',
      orgUnitPath: '/test/unit',
      createdTime: '2023-01-01T00:00:00Z',
      state: 'ACTIVE' as const,
      expireTime: '2024-01-01T00:00:00Z',
    };

    const mockResponse = {
      token: mockToken,
      enrollmentUrl: 'chrome://management/enrollment?token=test-token-value',
    };

    mockEnrollmentService.createToken.and.returnValue(
      Promise.resolve(mockResponse),
    );

    component.setSelectedOrgUnit('/test/unit');
    await component.createToken();

    expect(mockEnrollmentService.createToken).toHaveBeenCalledWith({
      orgUnitPath: '/test/unit',
    });
    expect(component.createdToken()).toEqual(mockToken);
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Enrollment token created successfully!',
    );
  });

  it('should handle token creation error', async () => {
    const error = new Error('Token creation failed');
    mockEnrollmentService.createToken.and.returnValue(Promise.reject(error));

    component.setSelectedOrgUnit('/test/unit');
    await component.createToken();

    expect(component.error()).toBe('Token creation failed');
    expect(mockNotificationService.error).toHaveBeenCalledWith(
      'Token creation failed',
    );
  });

  it('should copy token to clipboard', async () => {
    const mockToken = {
      tokenId: 'test-token-id',
      token: 'test-token-value',
      tokenPermanentId: 'test-permanent-id',
      customerId: 'test-customer',
      orgUnitPath: '/test/unit',
      createdTime: '2023-01-01T00:00:00Z',
      state: 'ACTIVE' as const,
      expireTime: '2024-01-01T00:00:00Z',
    };

    // Set up the component with a created token
    component['_state'].update((state) => ({
      ...state,
      createdToken: mockToken,
    }));

    // Mock the navigator clipboard API
    const writeTextSpy = jasmine.createSpy().and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true
    });

    await component.copyToken();

    expect(writeTextSpy).toHaveBeenCalledWith('test-token-value');
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Token copied to clipboard!',
    );
  });

  it('should open admin console', () => {
    spyOn(window, 'open');
    component.openAdminConsole();
    expect(window.open).toHaveBeenCalledWith(
      'https://admin.google.com/ac/chrome/browser-tokens?org&hl=en',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should show error when trying to draft email without token', () => {
    component.draftEmail();
    expect(mockNotificationService.warning).toHaveBeenCalledWith(
      'Please create a token first',
    );
  });

  it('should draft email when token exists', () => {
    const mockToken = {
      tokenId: 'test-token-id',
      token: 'test-token-value',
      tokenPermanentId: 'test-permanent-id',
      customerId: 'test-customer',
      orgUnitPath: '/test/unit',
      createdTime: '2023-01-01T00:00:00Z',
      state: 'ACTIVE' as const,
      expireTime: '2024-01-01T00:00:00Z',
    };

    // Set up the component with a created token
    component['_state'].update((state) => ({
      ...state,
      createdToken: mockToken,
    }));

    component.draftEmail();

    expect(mockEmailService.selectTemplate).toHaveBeenCalledWith(
      'browser-enrollment',
    );
    expect(mockEmailService.setVariableValues).toHaveBeenCalled();
    expect(component.showEmailComposer()).toBe(true);
  });

  it('should handle email composition completion', () => {
    component.onEmailComposed();

    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Email composed successfully!',
    );
    expect(component.showEmailComposer()).toBe(false);
  });

  it('should close email composer', () => {
    component['_state'].update((state) => ({
      ...state,
      showEmailComposer: true,
    }));

    component.closeEmailComposer();
    expect(component.showEmailComposer()).toBe(false);
  });

  it('should clear error', () => {
    component['_state'].update((state) => ({
      ...state,
      error: 'Test error',
    }));

    component.clearError();
    expect(component.error()).toBeNull();
  });
});
