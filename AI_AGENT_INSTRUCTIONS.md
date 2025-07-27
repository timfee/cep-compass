# AI Agent Instructions for CEP Compass

This document contains the complete, de-duplicated instruction set for all AI agents (Claude, GitHub Copilot, Google Gemini) working on the CEP Compass project.

## Project Overview

CEP Compass is a web-based administration platform for Community Eligibility Provision (CEP) programs in educational institutions. It enables administrators to manage student enrollment, communicate with families, and track directory statistics through role-based access control and Google Workspace integration.

## Technology Stack

- **Frontend Framework**: Angular 20.1.3
- **UI Components**: Angular Material v20 with Material Design 3
- **State Management**: Angular Signals (NOT RxJS except for interop)
- **Authentication**: Firebase Auth with Google OAuth
- **APIs**: Direct Google Workspace API calls (NOT googleapis SDK)
- **Build Tool**: Angular CLI with esbuild
- **Testing**: Jasmine/Karma (unit), Playwright (E2E)
- **Language**: TypeScript 5.6 with strict mode

## Critical Architecture Decisions

### ✅ DO USE
1. **Standalone Components** - No NgModules
2. **Signals** for all state management
3. **OnPush Change Detection** on all components
4. **inject()** function instead of constructor injection
5. **New control flow** (@if, @for, @switch, @defer)
6. **Direct HTTP calls** via Angular HttpClient
7. **Promises with firstValueFrom()** for single HTTP calls
8. **External template/style files** (not inline unless <5 lines)

### ❌ DO NOT USE
1. **NgModules** (@NgModule) - use standalone components
2. **googleapis SDK** - use lightweight HTTP calls
3. **Old directives** (*ngIf, *ngFor, *ngSwitch)
4. **Constructor injection** - use inject()
5. **Firebase Functions** for new features - use direct API calls
6. **RxJS operators** except toSignal/toObservable
7. **any type** - use unknown with type guards
8. **Decorative comments** (//---, //===)

## Code Organization

```
src/app/
├── core/                 # Guards, interceptors, error handlers
├── services/            # Business logic services (NOT shared/services)
├── shared/              # Utilities, constants, validators
├── components/          # Reusable UI components
├── features/            # Feature modules by domain
│   ├── admin/          # Admin-specific features
│   ├── enrollment/     # Enrollment features (stubs)
│   └── security/       # Security features (stubs)
├── auth/               # Authentication components
└── app.config.ts       # Application configuration
```

## Coding Standards

### File Naming
- Components: `feature-name.component.{ts,html,css,spec.ts}`
- Services: `service-name.service.{ts,spec.ts}`
- Use kebab-case for all file names

### Import Organization
```typescript
// 1. Angular imports
import { Component, inject } from '@angular/core';

// 2. Angular Material imports
import { MatCardModule } from '@angular/material/card';

// 3. Third-party imports
import { firstValueFrom } from 'rxjs';

// 4. Local imports
import { AuthService } from '../services/auth.service';
```

### Component Template
```typescript
@Component({
  selector: 'app-feature-name',
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, CommonModule]
})
export class FeatureNameComponent {
  // Services via inject()
  private readonly authService = inject(AuthService);
  
  // Input signals
  userId = input.required<string>();
  
  // Output signals
  userUpdated = output<User>();
  
  // State signals
  loading = signal(false);
  user = signal<User | null>(null);
  
  // Computed signals
  displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  
  // Effects in constructor only
  constructor() {
    effect(() => {
      const id = this.userId();
      if (id) this.loadUser(id);
    });
  }
}
```

### Service Template
```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  
  // Use async/await for HTTP calls
  async getData(): Promise<Data> {
    return firstValueFrom(
      this.http.get<Data>('/api/data')
    );
  }
  
  // State as signals
  private readonly _data = signal<Data[]>([]);
  readonly data = this._data.asReadonly();
}
```

### Template Syntax
```html
<!-- New control flow -->
@if (loading()) {
  <mat-spinner />
} @else if (error()) {
  <div class="error">{{ error() }}</div>
} @else {
  <div class="content">{{ data() }}</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

<!-- Signal binding -->
<input [(ngModel)]="searchTerm" />
<button (click)="handleClick()" [disabled]="isDisabled()">
  {{ buttonText() }}
</button>
```

### Material Design 3 Patterns
```scss
// Use MD3 tokens
.my-component {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-corner-medium);
  padding: 16px; // Use 8px grid
}

// State layers
.interactive:hover {
  background-color: var(--mat-sys-surface-container-high);
}
```

## Testing Requirements

### Unit Tests
- Minimum 80% code coverage
- Test file naming: `*.spec.ts`
- Mock all dependencies
- Test structure:
```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;
  let mockService: jasmine.SpyObj<ServiceName>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('ServiceName', ['method']);
    TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [{ provide: ServiceName, useValue: spy }]
    });
  });
  
  it('should describe behavior not implementation', () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

### E2E Tests
- Use Playwright
- Page Object Model pattern
- Test critical user journeys
- Location: `/e2e/`

## API Integration Patterns

### Google Workspace APIs
```typescript
// Use direct HTTP calls, not googleapis SDK
async getUsers(): Promise<User[]> {
  const url = `https://admin.googleapis.com/admin/directory/v1/users`;
  const response = await firstValueFrom(
    this.http.get<UsersResponse>(url)
  );
  return response.users || [];
}
```

### Error Handling
```typescript
try {
  const data = await this.service.getData();
  this.data.set(data);
} catch (error) {
  const message = this.errorHandler.getErrorMessage(error);
  this.notificationService.showError(message);
}
```

## Known Issues & Warnings

### Critical Security Issues
1. **Token Storage** (#72): Tokens use Base64 instead of encryption
2. **Race Condition** (#73): Auth effect can run before token stored
3. **No CSRF Protection** (#79): Missing CSRF tokens

### UX Issues
1. **No Loading States** (#74): Components show blank during fetch
2. **No Mobile Nav** (#75): Toolbar not responsive

### Testing Gaps
1. **Zero AuthService Tests** (#76): 445 lines untested
2. **No E2E Tests** (#77): No user journey coverage
3. **Minimal Unit Tests** (#78): Only 11 test files total

### Architecture Notes
- Some features are stubs (enrollment, DLP configuration)
- EmailTemplatesComponent is a thin wrapper around EmailComposer
- Firebase Functions being phased out for direct API calls
- Do NOT create services in `/shared/services` - use `/services`

## Security Requirements

1. **Authentication**: All routes except login require authentication
2. **Authorization**: Role-based access (Super Admin, CEP Admin, Participant)
3. **Token Management**: Handle expiry and refresh automatically
4. **Data Protection**: No sensitive data in localStorage
5. **API Security**: All API calls through auth interceptor

## Performance Requirements

1. **Change Detection**: OnPush strategy required
2. **Lazy Loading**: Use loadComponent for routes
3. **Bundle Size**: Stay under 1.5MB budget
4. **Loading Time**: <3 seconds initial load
5. **Signals**: Minimize unnecessary computations

## Accessibility Requirements

1. **ARIA Labels**: All interactive elements
2. **Keyboard Navigation**: Full keyboard support
3. **Screen Readers**: Proper announcements
4. **Color Contrast**: WCAG AA compliance
5. **Focus Management**: Visible focus indicators

## Git Commit Standards

```bash
# Format: <type>: <description>
feat: add user search functionality
fix: resolve race condition in auth
test: add unit tests for directory service
docs: update API documentation
refactor: simplify role management logic
style: apply consistent formatting
chore: update dependencies
```

## Common Mistakes to Avoid

1. **Using constructors** for dependency injection
2. **Creating duplicate services** in shared folder
3. **Using googleapis SDK** instead of HTTP calls
4. **Forgetting OnPush** change detection
5. **Using RxJS** where Promises suffice
6. **Inline templates** for complex components
7. **Missing loading states** during async operations
8. **Forgetting track** in @for loops
9. **Using any type** instead of proper typing
10. **Not handling errors** in async operations

## Before Submitting Code

- [ ] Run `npm run lint` - must pass
- [ ] Run `npm run build` - must succeed
- [ ] Run `npm test` - must pass
- [ ] Add/update unit tests for changes
- [ ] Check for duplicate services/components
- [ ] Verify OnPush change detection used
- [ ] Ensure signals used for state
- [ ] Confirm no googleapis imports
- [ ] Add loading states for async operations
- [ ] Handle all error cases

## Additional Resources

- [Angular v20 Docs](https://angular.dev)
- [Material Design 3](https://m3.material.io)
- [Angular Material](https://material.angular.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Project PRD](./PRD.md)
- [GitHub Issues](https://github.com/timfee/cep-compass/issues)