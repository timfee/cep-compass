import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ProfileEnrollmentComponent } from './profile-enrollment.component';
import {
  DirectoryService,
  DirectoryStats,
} from '../../services/directory.service';
import { EmailTemplateService } from '../../services/email-template.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';

describe('ProfileEnrollmentComponent', () => {
  let component: ProfileEnrollmentComponent;
  let fixture: ComponentFixture<ProfileEnrollmentComponent>;
  let mockDirectoryService: jasmine.SpyObj<DirectoryService>;
  let mockEmailService: jasmine.SpyObj<EmailTemplateService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockStats: DirectoryStats = {
    totalUsers: 100,
    activeUsers: 85,
    suspendedUsers: 15,
    totalGroups: 25,
    lastSyncTime: new Date(),
  };

  // Create writeable signals for testing
  const isLoadingSignal = signal(false);
  const errorSignal = signal<string | null>(null);
  const statsSignal = signal(mockStats);
  const usersSignal = signal([
    {
      id: '1',
      primaryEmail: 'user1@example.com',
      name: {
        givenName: 'John',
        familyName: 'Doe',
        fullName: 'John Doe',
      },
      suspended: false,
      orgUnitPath: '/',
      isAdmin: false,
      isDelegatedAdmin: false,
      lastLoginTime: '2024-01-01T00:00:00Z',
      creationTime: '2023-01-01T00:00:00Z',
      emails: [{ address: 'user1@example.com', primary: true }],
    },
  ]);

  beforeEach(async () => {
    // Create spy objects for services
    mockDirectoryService = jasmine.createSpyObj(
      'DirectoryService',
      ['fetchInitialData', 'refreshStats'],
      {
        stats: statsSignal,
        isLoading: isLoadingSignal,
        error: errorSignal,
        users: usersSignal,
      },
    );

    // Add additional spy properties for the computed signals
    Object.assign(mockDirectoryService, {
      isLoading: isLoadingSignal,
      error: errorSignal,
    });

    // Setup spy return values
    mockDirectoryService.fetchInitialData.and.returnValue(Promise.resolve());
    mockDirectoryService.refreshStats.and.returnValue(Promise.resolve());

    mockEmailService = jasmine.createSpyObj(
      'EmailTemplateService',
      ['selectTemplate'],
      {
        templates: signal([
          {
            id: 'profile-enrollment',
            name: 'Chrome Profile Sign-in Instructions',
            subject:
              'Action Required: Sign in to Chrome with Your Company Account',
            category: 'enrollment' as const,
            body: 'Test template body',
            variables: [],
          },
        ]),
      },
    );

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      user: signal(null),
    });

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'success',
      'warning',
      'error',
    ]);

    await TestBed.configureTestingModule({
      imports: [ProfileEnrollmentComponent, NoopAnimationsModule],
      providers: [
        { provide: DirectoryService, useValue: mockDirectoryService },
        { provide: EmailTemplateService, useValue: mockEmailService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEnrollmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display directory statistics', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check if stats are displayed
    expect(compiled.textContent).toContain('100'); // total users
    expect(compiled.textContent).toContain('85'); // active users
    expect(compiled.textContent).toContain('15'); // suspended users
    expect(compiled.textContent).toContain('25'); // total groups
  });

  it('should show loading state', () => {
    // Set loading state
    isLoadingSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const progressBar = compiled.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should show error state', () => {
    // Set error state
    errorSignal.set('Test error message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test error message');
  });

  it('should refresh stats when refresh button is clicked', async () => {
    mockDirectoryService.refreshStats.and.returnValue(Promise.resolve());

    const refreshButton = fixture.nativeElement.querySelector(
      '[matTooltip="Refresh"]',
    ) as HTMLButtonElement;
    refreshButton.click();
    fixture.detectChanges();
    
    // Wait for async operation to complete
    await fixture.whenStable();

    expect(mockDirectoryService.refreshStats).toHaveBeenCalled();
  });

  it('should draft single email when button is clicked', () => {
    const button = fixture.nativeElement.querySelector(
      '[color="primary"]',
    ) as HTMLButtonElement;
    button.click();

    expect(mockEmailService.selectTemplate).toHaveBeenCalledWith(
      'profile-enrollment',
    );
    expect(component.showEmailComposer()).toBe(true);
    expect(component.bulkEmailMode()).toBe(false);
  });

  it('should draft bulk email when button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'button[mat-raised-button]',
    );
    const bulkButton = Array.from(buttons).find((btn) =>
      (btn as Element).textContent?.includes('Prepare Bulk Email'),
    ) as HTMLButtonElement;

    bulkButton.click();

    expect(mockEmailService.selectTemplate).toHaveBeenCalledWith(
      'profile-enrollment',
    );
    expect(component.showEmailComposer()).toBe(true);
    expect(component.bulkEmailMode()).toBe(true);
    expect(component.selectedRecipients()).toContain('user1@example.com');
  });

  it('should export user list', () => {
    // Mock the creation of blob and URL
    spyOn(window.URL, 'createObjectURL').and.returnValue('mock-url');
    spyOn(window.URL, 'revokeObjectURL');

    // Mock DOM methods
    const mockAnchor = {
      click: jasmine.createSpy('click'),
      href: '',
      download: '',
    };
    spyOn(document, 'createElement').and.returnValue(
      mockAnchor as unknown as HTMLAnchorElement,
    );
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.exportUserList();

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('should handle email composition completion', () => {
    const mockEmail = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: 'Test Body',
    };

    component.onEmailComposed(mockEmail);

    expect(component.showEmailComposer()).toBe(false);
  });

  it('should provide default email variables', () => {
    const variables = component.getEmailVariables();

    expect(variables).toEqual({
      companyName: 'Your Company',
      ssoProvider: 'Google Workspace',
      helpDeskEmail: 'support@yourcompany.com',
      deadline: 'end of this week',
      senderName: 'IT Administrator',
      senderTitle: 'IT Administrator',
    });
  });
});
