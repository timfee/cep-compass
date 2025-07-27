# Claude Code Standards for CEP Compass

This document defines the coding standards and conventions for the CEP Compass Angular application.

## Overview

You are developing an Angular v20+ application using the latest features:

- Signals for reactive state management (input/output/model signals)
- Standalone components (no NgModules)
- New control flow syntax (@if, @for, @switch, @defer)
- OnPush change detection strategy
- Angular Material v20 with Material Design 3 (M3)
- Built-in control flow with track expressions
- Improved hydration and deferred loading

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
import { Component, inject } from "@angular/core";

// Angular Material imports
import { MatCardModule } from "@angular/material/card";

// Third-party imports
import { SomeLibrary } from "some-library";

// Local imports last
import { MyService } from "../services/my.service";
```

### TypeScript Conventions

- Prefer `inject()` over constructor injection
- Use signals for all state management
- Implement OnPush change detection strategy
- No NgModules (standalone components only)
- Use `toSignal()` and `toObservable()` for interop
- Prefer async/await over observables for single values
- Use Promises with `firstValueFrom()` for HTTP calls
- No `any` type - use `unknown` with type guards
- Strict typing always enabled
- Prefer type inference when obvious
- Use `DestroyRef` instead of `OnDestroy`
- Implement functional guards and resolvers

### Component Patterns

```typescript
/**
 * Component for managing user profiles
 */
@Component({
  selector: "app-user-profile",
  templateUrl: "./user-profile.component.html",
  styleUrl: "./user-profile.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule],
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * User ID input signal
   */
  userId = input.required<string>();

  /**
   * Emits when user is updated
   */
  userUpdated = output<User>();

  /**
   * Current user profile data
   */
  user = signal<User | null>(null);

  /**
   * Loading state
   */
  isLoading = signal(false);

  /**
   * Computed display name
   */
  displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : "";
  });

  constructor() {
    // React to userId changes
    effect(() => {
      const id = this.userId();
      this.loadUser(id);
    });
  }

  /**
   * Loads user profile from API
   */
  async loadUser(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.userService.getProfile(id);
      this.user.set(data);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Service Patterns

```typescript
/**
 * Service for user operations
 */
@Injectable({ providedIn: "root" })
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches current user profile
   */
  async getProfile(): Promise<User> {
    return firstValueFrom(this.http.get<User>("/api/user/profile"));
  }
}
```

### Template Conventions

- Use new control flow syntax: `@if`, `@for`, `@switch`, `@defer`
- No structural directives: `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `[class]` bindings instead of `ngClass`
- Use `[style]` bindings instead of `ngStyle`
- Always include `track` expressions in `@for` loops
- Use `@defer` for lazy loading components
- Keep templates simple - avoid complex logic
- Use pipes for data transformation
- Bind to signal values directly in templates

### Angular 20 Modern Patterns

#### Signal-Based Architecture

```typescript
// Two-way binding with model signals
searchTerm = model('');
selectedItems = model<string[]>([]);

// Linked signals
firstName = signal('');
lastName = signal('');
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// Effect cleanup
constructor() {
  effect((onCleanup) => {
    const timer = setTimeout(() => {
      console.log('Delayed operation');
    }, 1000);

    onCleanup(() => clearTimeout(timer));
  });
}
```

#### Deferred Loading

```html
@defer (on viewport) {
<app-heavy-component />
} @loading {
<mat-spinner />
} @error {
<p>Failed to load component</p>
}
```

#### Enhanced Forms

```typescript
// Typed reactive forms with signals
form = new FormGroup({
  email: new FormControl("", [Validators.required, Validators.email]),
  password: new FormControl("", [Validators.required, Validators.minLength(8)]),
});

// Form value as signal
formValue = toSignal(this.form.valueChanges, {
  initialValue: this.form.value,
});
```

### Material Design 3 & Angular Material v20

#### Core MD3 Principles

- Use dynamic color system with Material Theme
- Follow Material 3 shape system (rounded corners: sm=4dp, md=12dp, lg=16dp, xl=28dp)
- Use M3 typography scale (display, headline, title, body, label)
- Implement M3 elevation with surface tints instead of shadows
- Use Material motion principles (duration and easing tokens)

#### Angular Material v20 Components

- Use MDC-based components exclusively (all prefixed with `mat-mdc-`)
- Prefer Material 3 components: `mat-card`, `mat-button`, `mat-form-field`
- Use `appearance="outline"` for form fields (M3 default)
- Implement FABs with proper M3 sizing: `mat-fab`, `mat-mini-fab`
- Use `mat-icon` with Material Symbols (not Material Icons)
- Implement responsive layouts with `@angular/cdk/layout`

#### Theming Best Practices

```scss
// Use CSS custom properties for M3 tokens
.my-component {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-corner-medium);
}
```

#### Material 3 Color System

```scss
// Primary surfaces and content
--mat-sys-primary: /* Dynamic primary color */ --mat-sys-on-primary: /* Text/icons on primary */ --mat-sys-primary-container: /* Light primary surface */ --mat-sys-on-primary-container: /* Content on primary container */ // Surface hierarchy (elevation via tint, not shadow)
  --mat-sys-surface: /* Base surface */ --mat-sys-surface-container-lowest: /* Lowest elevation */ --mat-sys-surface-container-low: --mat-sys-surface-container: --mat-sys-surface-container-high: --mat-sys-surface-container-highest: /* Highest elevation */ // Semantic colors
  --mat-sys-error: /* Error states */ --mat-sys-tertiary: /* Accent color */ --mat-sys-outline: /* Borders and dividers */;
```

#### Dynamic Theming

```typescript
// Configure Material theme in app.config.ts
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideMaterial } from "@angular/material/core";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideMaterial({
      colorScheme: "dynamic", // or 'light', 'dark'
      density: 0, // -1, -2 for compact modes
      motion: "standard", // or 'reduced'
    }),
  ],
};
```

#### Component Styling

- Never override internal Material CSS classes (`.mat-mdc-*`)
- Use Material Design tokens for all styling
- Apply surface colors with tonal elevation
- Use state layers for interactive states
- Follow 4dp grid system for spacing
- Use Material's density system (-2, -1, 0)

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

- Use OnPush change detection strategy always
- Implement `@defer` for lazy loading components
- Use `track` expressions in `@for` loops (not trackBy)
- Minimize template complexity and computations
- Use signals for all reactive state
- Use `NgOptimizedImage` for images with loading optimization
- Leverage SSR with hydration for initial load
- Use virtual scrolling for large lists

### Accessibility (A11y) Best Practices

#### Material 3 Accessibility

- Use semantic HTML elements
- Implement proper ARIA labels and roles
- Ensure keyboard navigation for all interactions
- Maintain 4.5:1 contrast ratio (WCAG AA)
- Use Material's built-in accessibility features
- Test with screen readers and keyboard only

#### Component Accessibility

```typescript
@Component({
  template: `
    <button mat-raised-button [attr.aria-label]="buttonLabel()" [attr.aria-pressed]="isPressed()" (click)="toggle()">
      <mat-icon>{{ icon() }}</mat-icon>
      <span class="visually-hidden">{{ screenReaderText() }}</span>
    </button>
  `,
})
export class AccessibleButtonComponent {
  isPressed = signal(false);
  buttonLabel = computed(() => (this.isPressed() ? "Deactivate feature" : "Activate feature"));
}
```

### Component Architecture Best Practices

#### Smart vs Presentational Components

```typescript
// Smart Component (Container)
@Component({
  selector: "app-user-list-container",
  template: ` <app-user-list [users]="users()" [loading]="loading()" (userSelected)="onUserSelect($event)" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListContainer {
  private userService = inject(UserService);

  users = toSignal(this.userService.getUsers());
  loading = signal(false);

  onUserSelect(user: User) {
    // Handle business logic
  }
}

// Presentational Component
@Component({
  selector: "app-user-list",
  templateUrl: "./user-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatProgressSpinnerModule],
})
export class UserListComponent {
  users = input<User[]>([]);
  loading = input(false);
  userSelected = output<User>();
}
```

#### Component Communication Patterns

```typescript
// Parent to Child: Use input signals
childData = input.required<string>();

// Child to Parent: Use output functions
dataChanged = output<string>();

// Sibling communication: Use services with signals
@Injectable({ providedIn: "root" })
export class SharedStateService {
  private _sharedData = signal<Data | null>(null);
  sharedData = this._sharedData.asReadonly();

  updateData(data: Data) {
    this._sharedData.set(data);
  }
}
```

#### Component Composition

```typescript
// Prefer composition over inheritance
@Component({
  selector: "app-card-with-actions",
  template: `
    <mat-card>
      <mat-card-content>
        <ng-content select="[card-body]" />
      </mat-card-content>
      <mat-card-actions>
        <ng-content select="[card-actions]" />
      </mat-card-actions>
    </mat-card>
  `,
  imports: [MatCardModule],
})
export class CardWithActionsComponent {}
```

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
3. Use `input()`, `input.required()`, and `model()` signals instead of `@Input()`
4. Use `output()` function instead of `@Output()` decorators
5. Use external template and style files (no inline unless < 5 lines)
6. Use `inject()` function instead of constructor injection
7. Use new control flow (`@if`, `@for`, `@switch`, `@defer`)
8. Use `computed()` for derived state instead of getters
9. Use `effect()` for side effects instead of lifecycle hooks
10. Always specify `track` expressions in `@for` loops
11. Use Material Design 3 tokens for all styling
12. Implement proper error boundaries with `ErrorHandler`

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

### Angular v20 Documentation

- [Angular Components](https://angular.dev/essentials/components)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Control Flow](https://angular.dev/guide/control-flow)
- [Angular Defer Views](https://angular.dev/guide/defer)
- [Angular Dependency Injection](https://angular.dev/essentials/dependency-injection)
- [Angular Style Guide](https://angular.dev/style-guide)

### Material Design 3

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Material Design 3 Color System](https://m3.material.io/styles/color/overview)
- [Material Design 3 Components](https://m3.material.io/components)
- [Angular Material v20 Docs](https://material.angular.io/)
- [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols)

### Performance & Best Practices

- [Angular Performance Checklist](https://angular.dev/guide/performance)
- [Angular DevTools](https://angular.dev/tools/devtools)
- [Web.dev Performance](https://web.dev/performance/)

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
