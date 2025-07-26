# Claude Code Standards for CEP Compass

This document defines the coding standards and conventions for the CEP Compass Angular application.

## Overview

You are developing an Angular v20+ application using the latest features:
- Signals for reactive state management
- Standalone components (no NgModules)
- New control flow syntax (@if, @for, @switch)
- OnPush change detection strategy
- Angular Material for UI components

## Code Standards

### Comments
- Use JSDoc for all exported members
- Keep descriptions concise (one line preferred)
- No decorative comment separators (`// ---`, `// ===`, etc.)
- No section banners
- Only add @param/@returns tags when TypeScript types are unclear

### File Organization
- Components: `feature-name.component.{ts,html,css,spec.ts}`
- Services: `service-name.service.{ts,spec.ts}`
- Use kebab-case for all file names
- Group imports by: Angular, Material, Third-party, Local (no comment separators)
- Services go in `/src/app/services/` directory
- Shared utilities go in `/src/app/shared/` directory
- Core utilities go in `/src/app/core/` directory

### Import Organization
```typescript
// Angular imports first
import { Component, inject } from '@angular/core';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';

// Third-party imports
import { SomeLibrary } from 'some-library';

// Local imports last
import { MyService } from '../services/my.service';
```

### TypeScript Conventions
- Prefer `inject()` over constructor injection
- Use signals for state management
- Implement OnPush change detection
- No NgModules (standalone components only)
- Avoid RxJS operators except `toSignal`
- Use async/await over observables where possible
- No `any` type - use `unknown` with type guards
- Strict typing always enabled
- Prefer type inference when obvious

### Component Patterns
```typescript
/**
 * Component for managing user profiles
 */
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule]
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  
  /**
   * Current user profile data
   */
  user = signal<User | null>(null);
  
  /**
   * Loads user profile from API
   */
  async loadUser(): Promise<void> {
    const data = await this.userService.getProfile();
    this.user.set(data);
  }
}
```

### Service Patterns
```typescript
/**
 * Service for user operations
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  
  /**
   * Fetches current user profile
   */
  async getProfile(): Promise<User> {
    return firstValueFrom(
      this.http.get<User>('/api/user/profile')
    );
  }
}
```

### Template Conventions
- Use new control flow syntax: `@if`, `@for`, `@switch`
- No structural directives: `*ngIf`, `*ngFor`
- Use `[class]` bindings instead of `ngClass`
- Use `[style]` bindings instead of `ngStyle`
- Always include `track` in `@for` loops
- Keep templates simple - avoid complex logic
- Use pipes for data transformation

### Angular Material
- Use Angular Material components for UI
- Follow Material Design principles
- Use Material theme colors, not hardcoded values
- Use Material spacing (8px grid)
- Don't override `.mat-mdc-*` classes
- Use Material elevation system for shadows

### Testing
- Unit tests for all services
- Component tests for complex logic
- Use `TestBed` for component testing
- Mock HTTP calls in tests
- Aim for 80% code coverage

### Error Handling
- Use `try/catch` with async/await
- Show user-friendly error messages
- Log errors to console in development
- Use the `NotificationService` for user feedback

### Performance
- Use OnPush change detection
- Lazy load feature modules
- Use `trackBy` functions in loops
- Minimize template complexity
- Use signals for reactive state
- Use `NgOptimizedImage` for static images

## Project Structure
```
src/app/
├── core/                 # Core utilities, guards, interceptors
├── services/            # All services
├── shared/              # Shared utilities, validators, pipes
├── components/          # Reusable components
├── features/            # Feature modules
│   ├── admin/
│   ├── enrollment/
│   └── security/
├── auth/                # Authentication components
└── app.config.ts        # App configuration
```

## Critical Rules

### MUST DO
1. ALL components are standalone (never use `standalone: true`, it's default)
2. ALL components use `changeDetection: ChangeDetectionStrategy.OnPush`
3. Use `input()` signals instead of `@Input()` decorators
4. Use `output()` function instead of `@Output()` decorators
5. Use external template and style files (no inline unless < 5 lines)
6. Use `inject()` function instead of constructor injection
7. Use native control flow (`@if`, `@for`, `@switch`)

### MUST NOT DO
- No NgModules (`@NgModule`)
- No `*ngIf`, `*ngFor`, `*ngSwitch`
- No `ng-template`, `ng-container` for control flow
- No `NgClass` or `[ngClass]` - use `[class]` bindings
- No `NgStyle` or `[ngStyle]` - use `[style]` bindings
- No RxJS operators (except `toSignal`)
- No constructor parameter injection
- No `any` type
- No decorative comment separators

## Resources

- [Angular Components](https://angular.dev/essentials/components)
- [Angular Signals](https://angular.dev/essentials/signals)
- [Angular Templates](https://angular.dev/essentials/templates)
- [Angular Dependency Injection](https://angular.dev/essentials/dependency-injection)
- [Angular Style Guide](https://angular.dev/style-guide)

## Claude-Specific Instructions

### When working on this project:
1. Always check existing code patterns before implementing new features
2. Maintain consistency with the established architecture
3. Use the TodoWrite tool to track complex tasks
4. Run tests after making changes
5. Check for linting errors with `npm run lint`
6. Verify builds with `ng build`

### Firebase Integration
When requested for Firebase integration, ensure proper configuration in:
- `/src/environments/environment.ts`
- `/src/environments/environment.prod.ts`
- `app.config.ts` for providers

### Google OAuth Integration
This app uses Firebase Auth with Google OAuth for authentication:
- Required scopes are defined in `AuthService`
- Token management is handled via interceptors
- Role-based access control is implemented

### API Integration
All Google Workspace API calls should:
- Use the auth interceptor for token management
- Handle errors with `GoogleApiErrorHandler`
- Implement proper typing for responses
- Use the notification service for user feedback