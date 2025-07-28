import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CreateRoleComponent } from './create-role.component';
import {
  AdminRoleService,
  AdminRole,
  RoleCreationResponse,
} from '../../services/admin-role.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';

describe('CreateRoleComponent', () => {
  let component: CreateRoleComponent;
  let fixture: ComponentFixture<CreateRoleComponent>;
  let adminRoleService: jasmine.SpyObj<AdminRoleService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let clipboard: jasmine.SpyObj<Clipboard>;

  const mockAdminRole: AdminRole = {
    kind: 'admin#directory#role',
    roleId: 'test-role-id',
    roleName: 'CEP Admin',
    roleDescription: 'Chrome Enterprise Premium Administrator',
    rolePrivileges: [],
    isSystemRole: false,
    isSuperAdminRole: false,
  };

  const mockRoleCreationResponse: RoleCreationResponse = {
    kind: 'admin#directory#role',
    etag: 'test-etag',
    roleId: 'new-role-id',
    roleName: 'CEP Admin',
    roleDescription: 'Chrome Enterprise Premium Administrator',
    rolePrivileges: [],
    isSystemRole: false,
    isSuperAdminRole: false,
  };

  beforeEach(async () => {
    const adminRoleServiceSpy = jasmine.createSpyObj('AdminRoleService', [
      'checkCepAdminRoleExists',
      'createCepAdminRole',
      'getAdminConsoleUrl',
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      availableRoles: () => ({ isSuperAdmin: true }),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const clipboardSpy = jasmine.createSpyObj('Clipboard', ['copy']);

    await TestBed.configureTestingModule({
      imports: [CreateRoleComponent, NoopAnimationsModule],
      providers: [
        { provide: AdminRoleService, useValue: adminRoleServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Clipboard, useValue: clipboardSpy },
      ],
    }).compileComponents();

    adminRoleService = TestBed.inject(
      AdminRoleService,
    ) as jasmine.SpyObj<AdminRoleService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    clipboard = TestBed.inject(Clipboard) as jasmine.SpyObj<Clipboard>;
  });

  describe('when user is super admin and role does not exist', () => {
    beforeEach(async () => {
      adminRoleService.checkCepAdminRoleExists.and.returnValue(
        Promise.resolve({ exists: false, role: undefined }),
      );

      fixture = TestBed.createComponent(CreateRoleComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show ready state when role does not exist', () => {
      expect(component.state()).toBe('ready');
      expect(component.roleExists()).toBeFalse();
    });

    it('should create role successfully', async () => {
      adminRoleService.createCepAdminRole.and.returnValue(
        Promise.resolve(mockRoleCreationResponse),
      );

      await component.createRole();

      expect(adminRoleService.createCepAdminRole).toHaveBeenCalled();
      expect(component.state()).toBe('success');
      expect(component.success()).toBeTrue();
      expect(notificationService.success).toHaveBeenCalledWith(
        'CEP Admin role created successfully!',
      );
    });

    it('should handle role creation error', async () => {
      adminRoleService.createCepAdminRole.and.returnValue(
        Promise.reject(new Error('Creation failed')),
      );

      await component.createRole();

      expect(component.state()).toBe('error');
      expect(component.error()).toBe('Creation failed');
    });
  });

  describe('when role already exists', () => {
    beforeEach(async () => {
      adminRoleService.checkCepAdminRoleExists.and.returnValue(
        Promise.resolve({ exists: true, role: mockAdminRole }),
      );

      fixture = TestBed.createComponent(CreateRoleComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should show exists state when role already exists', () => {
      expect(component.state()).toBe('exists');
      expect(component.roleExists()).toBeTrue();
      expect(component.existingRole()).toEqual(mockAdminRole);
    });

    it('should open admin console with existing role', () => {
      const mockUrl = 'https://admin.google.com/roles/test-role-id';
      adminRoleService.getAdminConsoleUrl.and.returnValue(mockUrl);
      spyOn(window, 'open');

      component.openAdminConsole();

      expect(adminRoleService.getAdminConsoleUrl).toHaveBeenCalledWith(
        'test-role-id',
      );
      expect(window.open).toHaveBeenCalledWith(mockUrl, '_blank');
    });

    it('should copy role ID to clipboard', () => {
      component.copyRoleId();

      expect(clipboard.copy).toHaveBeenCalledWith('test-role-id');
      expect(notificationService.success).toHaveBeenCalledWith(
        'Role ID copied to clipboard!',
      );
    });
  });

  describe('when user is not super admin', () => {
    beforeEach(async () => {
      Object.defineProperty(authService, 'availableRoles', {
        value: () => ({ isSuperAdmin: false }),
      });

      fixture = TestBed.createComponent(CreateRoleComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should show error when user is not super admin', () => {
      expect(component.state()).toBe('error');
      expect(component.error()).toBe(
        'Super Admin role required to create CEP Admin roles',
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      adminRoleService.checkCepAdminRoleExists.and.returnValue(
        Promise.resolve({ exists: false, role: undefined }),
      );

      fixture = TestBed.createComponent(CreateRoleComponent);
      component = fixture.componentInstance;
    });

    it('should handle check role error', async () => {
      adminRoleService.checkCepAdminRoleExists.and.returnValue(
        Promise.reject(new Error('Check failed')),
      );

      component.retry();
      await fixture.whenStable();

      expect(component.state()).toBe('error');
      expect(component.error()).toBe('Check failed');
    });

    it('should format privileges correctly', () => {
      const privilege = { privilegeName: 'Test Privilege', serviceId: 'test' };
      const formatted = component.formatPrivilege(privilege);
      expect(formatted).toBe('Test Privilege');
    });
  });

  describe('UI interactions', () => {
    beforeEach(async () => {
      adminRoleService.checkCepAdminRoleExists.and.returnValue(
        Promise.resolve({ exists: false, role: undefined }),
      );

      fixture = TestBed.createComponent(CreateRoleComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should call retry when retry method is called', () => {
      const privateSpy = spyOn(
        component as unknown as { checkForExistingRole: () => void },
        'checkForExistingRole',
      );
      component.retry();
      expect(privateSpy).toHaveBeenCalled();
    });
  });
});
