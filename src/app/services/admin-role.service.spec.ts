import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AdminRoleService, CEP_ADMIN_ROLE } from './admin-role.service';
import { NotificationService } from '../core/notification.service';
import { authInterceptor } from '../core/auth.interceptor';

describe('AdminRoleService', () => {
  let service: AdminRoleService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAccessToken',
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'info',
      'warning',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AdminRoleService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
      ],
    });

    service = TestBed.inject(AdminRoleService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkCepAdminRoleExists', () => {
    it('should return exists: false when role is not found', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const resultPromise = service.checkCepAdminRoleExists();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token',
      );

      req.flush({
        kind: 'admin#directory#roles',
        items: [],
      });

      const result = await resultPromise;
      expect(result).toEqual({ exists: false });
    });

    it('should return exists: true when role is found', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const mockRole = {
        kind: 'admin#directory#role',
        roleId: '12345',
        roleName: 'CEP Admin',
        roleDescription:
          'Chrome Enterprise Plus Administrator - Manages Chrome browsers, profiles, and policies',
        rolePrivileges: CEP_ADMIN_ROLE.rolePrivileges,
      };

      const resultPromise = service.checkCepAdminRoleExists();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      req.flush({
        kind: 'admin#directory#roles',
        items: [mockRole],
      });

      const result = await resultPromise;
      expect(result).toEqual({ exists: true, role: mockRole });
    });

    it('should throw error on 403 Forbidden', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const resultPromise = service.checkCepAdminRoleExists();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      await expectAsync(resultPromise).toBeRejectedWithError(
        'Insufficient permissions. Super Admin role required to manage roles.',
      );
    });
  });

  describe('createCepAdminRole', () => {
    it('should create role successfully', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const mockResponse = {
        kind: 'admin#directory#role',
        roleId: '12345',
        roleName: 'CEP Admin',
        roleDescription:
          'Chrome Enterprise Plus Administrator - Manages Chrome browsers, profiles, and policies',
        rolePrivileges: CEP_ADMIN_ROLE.rolePrivileges,
        isSystemRole: false,
        isSuperAdminRole: false,
        etag: 'mock-etag',
      };

      const resultPromise = service.createCepAdminRole();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token',
      );
      expect(req.request.body).toEqual({
        kind: 'admin#directory#role',
        ...CEP_ADMIN_ROLE,
      });

      req.flush(mockResponse);

      const result = await resultPromise;
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on 409 Conflict', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const resultPromise = service.createCepAdminRole();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      await expectAsync(resultPromise).toBeRejectedWithError(
        'CEP Admin role already exists',
      );
    });

    it('should throw error on 403 Forbidden', async () => {
      authService.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

      const resultPromise = service.createCepAdminRole();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/roles',
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      await expectAsync(resultPromise).toBeRejectedWithError(
        'Insufficient permissions. Super Admin role required to create roles.',
      );
    });
  });

  describe('formatPrivilegeName', () => {
    it('should format privilege names correctly', () => {
      const privilege = {
        privilegeName: 'MANAGE_CHROME_BROWSERS',
        serviceId: '02a0gzzo1mc6iq8',
      };
      const result = service.formatPrivilegeName(privilege);
      expect(result).toBe('Chrome Browsers');
    });

    it('should format read privilege names correctly', () => {
      const privilege = {
        privilegeName: 'READ_CHROME_POLICIES',
        serviceId: '02a0gzzo1mc6iq8',
      };
      const result = service.formatPrivilegeName(privilege);
      expect(result).toBe('Chrome Policies');
    });
  });

  describe('getAdminConsoleUrl', () => {
    it('should generate correct admin console URL', () => {
      const roleId = '12345';
      const result = service.getAdminConsoleUrl(roleId);
      expect(result).toBe('https://admin.google.com/ac/roles/12345/admins');
    });
  });
});
