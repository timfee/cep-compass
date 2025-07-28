import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';
import { SelectRoleComponent } from './select-role.component';

describe('SelectRoleComponent', () => {
  let component: SelectRoleComponent;
  let fixture: ComponentFixture<SelectRoleComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'refreshAvailableRoles',
      'selectRole',
    ], {
      user: signal({ email: 'test@example.com', uid: 'test-uid' }),
      availableRoles: signal({
        isSuperAdmin: false,
        isCepAdmin: true,
        missingPrivileges: [],
      }),
    });
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error']);

    await TestBed.configureTestingModule({
      imports: [SelectRoleComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should refresh available roles on init', async () => {
    mockAuthService.refreshAvailableRoles.and.returnValue(Promise.resolve());

    await component.ngOnInit();

    expect(mockAuthService.refreshAvailableRoles).toHaveBeenCalled();
  });

  it('should handle refresh roles error on init', async () => {
    mockAuthService.refreshAvailableRoles.and.returnValue(Promise.reject(new Error('API Error')));

    await component.ngOnInit();

    expect(mockNotificationService.error).toHaveBeenCalledWith(
      'Failed to refresh available roles. Please try again later.'
    );
  });

  it('should select role and navigate to dashboard on successful role selection', async () => {
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    await component.selectRole('cepAdmin');

    expect(mockAuthService.selectRole).toHaveBeenCalledWith('cepAdmin');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isSelectingRole()).toBe(false);
  });

  it('should handle role selection errors gracefully', async () => {
    const consoleSpy = spyOn(console, 'error');
    mockRouter.navigate.and.returnValue(Promise.reject(new Error('Navigation failed')));

    await component.selectRole('cepAdmin');

    expect(mockAuthService.selectRole).toHaveBeenCalledWith('cepAdmin');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to select role:', jasmine.any(Error));
    expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to select role. Please try again.');
    expect(component.isSelectingRole()).toBe(false);
  });

  it('should not proceed with role selection if already selecting', async () => {
    component.isSelectingRole.set(true);

    await component.selectRole('cepAdmin');

    expect(mockAuthService.selectRole).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not proceed with role selection if role is null', async () => {
    await component.selectRole(null);

    expect(mockAuthService.selectRole).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should compute isLoading correctly when user is defined', () => {
    // User is defined, so should not be loading
    expect(component.isLoading()).toBe(false);
  });
});
