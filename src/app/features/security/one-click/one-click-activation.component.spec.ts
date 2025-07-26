import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { OneClickActivationComponent } from './one-click-activation.component';
import { EnrollmentTokenService, EnrollmentToken } from '../../../services/enrollment-token.service';
import { DirectoryService, DirectoryUser } from '../../../services/directory.service';

describe('OneClickActivationComponent', () => {
  let component: OneClickActivationComponent;
  let fixture: ComponentFixture<OneClickActivationComponent>;
  let enrollmentService: jasmine.SpyObj<EnrollmentTokenService>;
  let directoryService: jasmine.SpyObj<DirectoryService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTokens: EnrollmentToken[] = [
    {
      tokenId: 'token1',
      token: 'test-token',
      tokenPermanentId: 'perm-id-1',
      customerId: 'customer-1',
      orgUnitPath: '/',
      createdTime: new Date().toISOString(),
      state: 'ACTIVE' as const,
      expireTime: new Date(Date.now() + 86400000).toISOString(),
    },
  ];

  const mockUsers: DirectoryUser[] = [
    {
      id: 'user1',
      suspended: false,
      lastLoginTime: new Date().toISOString(),
      primaryEmail: 'user1@example.com',
      name: { 
        givenName: 'John', 
        familyName: 'Doe',
        fullName: 'John Doe'
      },
      orgUnitPath: '/',
      isAdmin: false,
      isDelegatedAdmin: false,
      creationTime: new Date().toISOString(),
      emails: [{
        address: 'user1@example.com',
        primary: true
      }]
    },
  ];

  beforeEach(async () => {
    const enrollmentServiceSpy = jasmine.createSpyObj('EnrollmentTokenService', [
      'listTokens',
      'isTokenActive',
    ]);
    const mockDirectoryService = {
      fetchInitialData: jasmine.createSpy('fetchInitialData').and.returnValue(Promise.resolve()),
      users: signal(mockUsers),
    };
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Clear localStorage before each test
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [OneClickActivationComponent, NoopAnimationsModule],
      providers: [
        { provide: EnrollmentTokenService, useValue: enrollmentServiceSpy },
        { provide: DirectoryService, useValue: mockDirectoryService },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    enrollmentService = TestBed.inject(EnrollmentTokenService) as jasmine.SpyObj<EnrollmentTokenService>;
    directoryService = TestBed.inject(DirectoryService) as jasmine.SpyObj<DirectoryService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Setup default spy behavior
    enrollmentService.listTokens.and.returnValue(Promise.resolve(mockTokens));
    enrollmentService.isTokenActive.and.returnValue(true);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(OneClickActivationComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', async () => {
    fixture = TestBed.createComponent(OneClickActivationComponent);
    component = fixture.componentInstance;
    
    await fixture.whenStable();
    
    expect(component.isActivated()).toBeFalse();
    expect(component.isCheckingPrerequisites()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should have features and resources defined', () => {
    fixture = TestBed.createComponent(OneClickActivationComponent);
    component = fixture.componentInstance;
    
    expect(component.features).toBeDefined();
    expect(component.features.length).toBe(4);
    expect(component.resources).toBeDefined();
    expect(component.resources.length).toBe(3);
  });

  describe('checkPrerequisites', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
    });

    it('should check prerequisites successfully', async () => {
      await component.checkPrerequisites();

      expect(enrollmentService.listTokens).toHaveBeenCalled();
      expect(directoryService.fetchInitialData).toHaveBeenCalled();
      expect(component.hasEnrolledBrowsers()).toBeTrue();
      expect(component.hasEnrolledProfiles()).toBeTrue();
      expect(component.prerequisitesMet()).toBeTrue();
      expect(component.lastChecked()).toBeTruthy();
    });

    it('should handle no active tokens', async () => {
      enrollmentService.listTokens.and.returnValue(Promise.resolve([]));

      await component.checkPrerequisites();

      expect(component.hasEnrolledBrowsers()).toBeFalse();
      expect(component.prerequisitesMet()).toBeFalse();
    });

    it('should handle inactive tokens', async () => {
      enrollmentService.isTokenActive.and.returnValue(false);

      await component.checkPrerequisites();

      expect(component.hasEnrolledBrowsers()).toBeFalse();
      expect(component.prerequisitesMet()).toBeFalse();
    });

    it('should handle suspended users', async () => {
      const suspendedUsers: DirectoryUser[] = [
        {
          ...mockUsers[0],
          suspended: true,
        },
      ];

      const suspendedUserService = {
        fetchInitialData: jasmine.createSpy('fetchInitialData').and.returnValue(Promise.resolve()),
        users: signal(suspendedUsers),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OneClickActivationComponent, NoopAnimationsModule],
        providers: [
          { provide: EnrollmentTokenService, useValue: enrollmentService },
          { provide: DirectoryService, useValue: suspendedUserService },
          { provide: Router, useValue: router },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      });
      
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;

      await component.checkPrerequisites();

      expect(component.hasEnrolledProfiles()).toBeFalse();
      expect(component.prerequisitesMet()).toBeFalse();
    });

    it('should handle users without login time', async () => {
      const usersWithoutLogin: DirectoryUser[] = [
        {
          ...mockUsers[0],
          lastLoginTime: '',
        },
      ];

      const noLoginService = {
        fetchInitialData: jasmine.createSpy('fetchInitialData').and.returnValue(Promise.resolve()),
        users: signal(usersWithoutLogin),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OneClickActivationComponent, NoopAnimationsModule],
        providers: [
          { provide: EnrollmentTokenService, useValue: enrollmentService },
          { provide: DirectoryService, useValue: noLoginService },
          { provide: Router, useValue: router },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      });
      
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;

      await component.checkPrerequisites();

      expect(component.hasEnrolledProfiles()).toBeFalse();
      expect(component.prerequisitesMet()).toBeFalse();
    });

    it('should handle prerequisite check errors', async () => {
      enrollmentService.listTokens.and.returnValue(
        Promise.reject(new Error('Service error'))
      );

      await component.checkPrerequisites();

      expect(component.error()).toBe('Failed to check prerequisites. Please try again.');
      expect(component.isCheckingPrerequisites()).toBeFalse();
    });
  });

  describe('UI interactions', () => {
    beforeEach(async () => {
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should open security insights', () => {
      spyOn(window, 'open');

      component.openSecurityInsights();

      expect(window.open).toHaveBeenCalledWith(
        'https://admin.google.com/ac/chrome/reports/securityinsights',
        '_blank',
        'noopener,noreferrer'
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Security Insights page opened in new tab',
        'Close',
        { duration: 3000 }
      );
    });

    it('should mark as activated', () => {
      component.markAsActivated();

      expect(component.isActivated()).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'One-Click Protection marked as activated!',
        'Close',
        { duration: 5000, panelClass: ['success-snackbar'] }
      );
    });

    it('should navigate to browser enrollment', () => {
      component.navigateToBrowserEnrollment();

      expect(router.navigate).toHaveBeenCalledWith(['/enrollment/browsers']);
    });

    it('should navigate to profile enrollment', () => {
      component.navigateToProfileEnrollment();

      expect(router.navigate).toHaveBeenCalledWith(['/enrollment/profiles']);
    });

    it('should open external links', () => {
      spyOn(window, 'open');
      const testUrl = 'https://example.com';

      component.openExternalLink(testUrl);

      expect(window.open).toHaveBeenCalledWith(testUrl, '_blank', 'noopener,noreferrer');
    });
  });

  describe('localStorage integration', () => {
    it('should load activation state from localStorage', async () => {
      const mockState = {
        activated: true,
        activatedDate: '2023-01-01T00:00:00.000Z',
      };
      localStorage.setItem('cep-compass-one-click', JSON.stringify(mockState));

      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
      
      // ngOnInit is called during component creation, wait for it to complete
      await component.checkPrerequisites();
      fixture.detectChanges();

      expect(component.isActivated()).toBeTrue();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('cep-compass-one-click', 'invalid-json');
      spyOn(console, 'warn');

      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
      
      // ngOnInit is called during component creation, wait for it to complete
      await component.checkPrerequisites();
      fixture.detectChanges();

      expect(component.isActivated()).toBeFalse();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should save activation state to localStorage', async () => {
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      component.markAsActivated();

      const storedState = localStorage.getItem('cep-compass-one-click');
      expect(storedState).toBeTruthy();
      
      const parsedState = JSON.parse(storedState!);
      expect(parsedState.activated).toBeTrue();
      expect(parsedState.activatedDate).toBeTruthy();
    });

    it('should handle localStorage errors gracefully when saving', async () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      spyOn(console, 'warn');

      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      component.markAsActivated();

      expect(console.warn).toHaveBeenCalled();
    });

    it('should save prerequisite check time', async () => {
      fixture = TestBed.createComponent(OneClickActivationComponent);
      component = fixture.componentInstance;

      await component.checkPrerequisites();

      const storedState = localStorage.getItem('cep-compass-one-click');
      expect(storedState).toBeTruthy();
      
      const parsedState = JSON.parse(storedState!);
      expect(parsedState.lastPrerequisiteCheck).toBeTruthy();
    });
  });
});