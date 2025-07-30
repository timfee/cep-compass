# CEP Compass Copilot Instructions

You are working on CEP Compass, an Angular v20+ enterprise application for managing Chrome Enterprise Premium (CEP) policies. This application streamlines Chrome browser onboarding and management for IT administrators in enterprise environments.

## Project Overview

CEP Compass provides IT administrators with a guided workflow to:
- Set up delegated admin roles for Chrome management
- Enroll browsers and user profiles
- Activate security features and configure DLP policies
- Generate deployment emails and instructions

The application integrates with Google Workspace APIs (Admin SDK Directory API, Chrome Enterprise API) and uses Firebase for authentication.

## Angular Standards

Use Angular v20+ with standalone components, signals for state management, and OnPush change detection.
Never use NgModules - all components are standalone by default.
Use the new control flow syntax: @if, @for, @switch instead of *ngIf, *ngFor, *ngSwitch.
Prefer inject() function over constructor injection.
Use input() and output() functions instead of decorators.

## Code Style

Write concise JSDoc comments - one line descriptions preferred.
Don't use decorative comment separators like // --- or // ===.
Use kebab-case for all file names: feature-name.component.ts, service-name.service.ts.
Group imports by Angular, Material, third-party, then local - no comment separators between groups.
Never use the any type - use unknown with type guards instead.

## File Organization

```
src/app/
├── core/                 # Guards, interceptors, error handlers
├── services/            # Business logic services (NOT shared/services)
├── shared/              # Utilities, constants, validators
├── components/          # Reusable UI components
├── auth/               # Authentication components
└── app.config.ts       # Application configuration
```

Put all services in /src/app/services/.
Put shared utilities in /src/app/shared/.
Put core utilities, guards, and interceptors in /src/app/core/.
Use external template and style files unless the component is trivial (less than 5 lines).

## Angular Material

Use Angular Material components for all UI elements.
Use Material theme colors - never hardcode colors like #1976d2.
Follow the 8px spacing grid.
Never override .mat-mdc-* classes directly.

## TypeScript Patterns

Use async/await instead of RxJS operators (except toSignal).
Use signals for all component state management.
Always enable strict typing.
Handle errors with try/catch blocks.
Use the NotificationService for user feedback, not raw MatSnackBar.
Use Promises with firstValueFrom() for single HTTP calls.

## API Integration

Use direct HTTP calls via Angular HttpClient - do NOT use googleapis SDK.
All Google API calls require OAuth token from AuthService.
Key API endpoints:
- List organizational units: `GET /admin/directory/v1/customer/my_customer/orgunits`
- Create enrollment token: `POST /admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens`
- List users: `GET /admin/directory/v1/users?customer=my_customer`
- Create admin role: `POST /admin/directory/v1/customer/my_customer/roles`

## Component Example

```typescript
@Component({
  selector: "app-user-profile",
  templateUrl: "./user-profile.component.html",
  styleUrl: "./user-profile.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadUser(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.userService.getProfile();
      this.user.set(data);
    } catch (err) {
      this.error.set(this.errorHandler.getMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Key Features Implementation

- **Create CEP Admin Role**: Delegated admin role creation (Super Admins only)
- **Browser Enrollment**: Display/create enrollment tokens with email templates
- **Profile Enrollment**: User education and Chrome profile setup guidance
- **One-Click Activation**: Security insights dashboard integration
- **DLP Configuration**: Audit-only policy setup to avoid user disruption

## Testing

Write unit tests for all services.
Mock HTTP calls in tests - do not use real Google API calls.
Use TestBed for component testing.
Test component logic and signal updates.
Verify error handling paths.
Aim for 80% code coverage.

## Performance

Always use OnPush change detection.
Use trackBy functions in @for loops.
Lazy load feature modules.
Use NgOptimizedImage for static images.

## Security

Never expose or log sensitive data like tokens or passwords.
Use sessionStorage for temporary data, not localStorage.
Always validate user input.
Use the auth interceptor for API authentication.
Implement proper role-based access control (Super Admin vs CEP Admin permissions).

## Before Submitting Code

- Run `npm run lint` - must pass
- Run `npm run build` - must succeed  
- Run `npm test` - must pass
- Verify Google API endpoints are correct
- Check for proper error handling
- Ensure loading states for all async operations
- Validate role-based visibility
