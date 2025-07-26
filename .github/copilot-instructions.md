# CEP Compass Copilot Instructions

You are working on CEP Compass, an Angular v20+ enterprise application for managing Chrome Enterprise policies.

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

## Component Example

```typescript
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule]
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  user = signal<User | null>(null);
  
  async loadUser(): Promise<void> {
    const data = await this.userService.getProfile();
    this.user.set(data);
  }
}
```

## Testing

Write unit tests for all services.
Mock HTTP calls in tests.
Use TestBed for component testing.
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