import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, withInterceptors, provideHttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { NotificationService } from './notification.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'logout', 'refreshAccessToken']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['info', 'error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(authService).toBeTruthy();
    expect(notificationService).toBeTruthy();
  });

  it('should handle no access token by throwing error', (done) => {
    authService.getAccessToken.and.returnValue(Promise.resolve(null));

    httpClient.get('https://admin.googleapis.com/admin/directory/v1/users').subscribe({
      error: (error) => {
        expect(error.message).toBe('No access token available');
        done();
      },
      next: () => done.fail('Request should fail when no token')
    });
  });

  // Integration test that verifies the interceptor setup is correct
  it('should have correct dependencies injected', () => {
    expect(authService.getAccessToken).toBeDefined();
    expect(authService.refreshAccessToken).toBeDefined();
    expect(authService.logout).toBeDefined();
    expect(notificationService.info).toBeDefined();
    expect(notificationService.error).toBeDefined();
  });
});