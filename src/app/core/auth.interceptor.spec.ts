import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, withInterceptors, provideHttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        { provide: AuthService, useValue: authServiceSpy },
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add Authorization header for googleapis.com URLs', async () => {
    authService.getAccessToken.and.returnValue(Promise.resolve('test-token'));

    httpClient.get('https://admin.googleapis.com/admin/directory/v1/users').subscribe();

    // Give the async interceptor time to process
    await new Promise(resolve => setTimeout(resolve, 10));

    const req = httpTestingController.expectOne('https://admin.googleapis.com/admin/directory/v1/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    
    req.flush({});
  });

  it('should not intercept non-googleapis.com URLs', () => {
    httpClient.get('https://example.com/api/data').subscribe();

    const req = httpTestingController.expectOne('https://example.com/api/data');
    expect(req.request.headers.get('Authorization')).toBeNull();
    
    req.flush({});
  });

  it('should handle 401 errors by clearing storage and calling logout', async () => {
    authService.getAccessToken.and.returnValue(Promise.resolve('expired-token'));
    authService.logout.and.returnValue(Promise.resolve());

    httpClient.get('https://admin.googleapis.com/admin/directory/v1/users').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(authService.logout).toHaveBeenCalled();
      }
    });

    // Give the async interceptor time to process
    await new Promise(resolve => setTimeout(resolve, 10));

    const req = httpTestingController.expectOne('https://admin.googleapis.com/admin/directory/v1/users');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should throw error when no access token is available', async () => {
    authService.getAccessToken.and.returnValue(Promise.resolve(null));

    httpClient.get('https://admin.googleapis.com/admin/directory/v1/users').subscribe({
      error: (error) => {
        expect(error.message).toBe('No access token available');
      }
    });

    // Give the async interceptor time to process
    await new Promise(resolve => setTimeout(resolve, 10));
  });
});