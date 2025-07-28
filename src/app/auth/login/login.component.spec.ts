import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['loginWithGoogle']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state with isLoggingIn as false', () => {
    expect(component.isLoggingIn()).toBe(false);
  });

  it('should call authService.loginWithGoogle and navigate on successful login', async () => {
    mockAuthService.loginWithGoogle.and.returnValue(Promise.resolve());
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    await component.login();

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/select-role']);
    expect(component.isLoggingIn()).toBe(false);
  });

  it('should handle login errors gracefully', async () => {
    const consoleSpy = spyOn(console, 'error');
    mockAuthService.loginWithGoogle.and.returnValue(Promise.reject(new Error('Login failed')));

    await component.login();

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Login failed:', jasmine.any(Error));
    expect(component.isLoggingIn()).toBe(false);
  });

  it('should set isLoggingIn to true during login process', async () => {
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockAuthService.loginWithGoogle.and.returnValue(loginPromise);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const loginCall = component.login();
    
    // Should be true during the async operation
    expect(component.isLoggingIn()).toBe(true);

    resolveLogin!();
    await loginCall;

    // Should be false after completion
    expect(component.isLoggingIn()).toBe(false);
  });

  it('should prevent multiple simultaneous login attempts', async () => {
    mockAuthService.loginWithGoogle.and.returnValue(Promise.resolve());
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    component.isLoggingIn.set(true);

    await component.login();

    expect(mockAuthService.loginWithGoogle).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
