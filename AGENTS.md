# AI Agent Instructions for CEP Compass

This document contains the complete, de-duplicated instruction set for all AI agents (Claude, GitHub Copilot, Google Gemini, and others) working on the CEP Compass project.

## Project Overview

CEP Compass is a web-based administration platform for **Chrome Enterprise Premium (CEP)** that streamlines the onboarding and management of Chrome browsers in enterprise environments. It provides IT administrators with a guided workflow to set up delegated admin roles, enroll browsers and profiles, activate security features, and configure data loss prevention policies.

## The Core Problem

Organizations with existing Google Cloud Platform (GCP) billing relationships need to onboard Chrome Enterprise Premium, but face several challenges:
- IT admins managing Chrome are disconnected from GCP/Workspace admins
- No clear guidance on the correct privilege levels needed
- Complex multi-step process: role creation → license assignment → browser enrollment → policy configuration
- Risk of disrupting users with poorly configured policies

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
│   ├── admin/          # Admin role management
│   ├── enrollment/     # Browser & profile enrollment
│   └── security/       # DLP and security policies
├── auth/               # Authentication components
└── app.config.ts       # Application configuration
```

## Key Features Implementation

### Card 1: Create CEP Admin Role (Super Admins Only)
- Create delegated admin role with Chrome management permissions
- Direct admin to role assignment URL: `https://admin.google.com/ac/roles/{RoleID}/admins`
- Only visible to Super Admins

### Card 2: Enroll Browsers
- Display existing enrollment tokens
- Create new enrollment tokens via API
- Draft email to IT admin with token for deployment

### Card 3: Enroll Profiles
- Show directory user count to validate sync
- Draft educational email for end users
- Guide users to sign into Chrome with work accounts

### Card 4: One-Click Activation
- Direct to security insights dashboard
- Require browser/profile enrollment first
- Enable data population for dashboards

### Card 5: DLP Configuration
- Start with audit-only policies
- Avoid disruptive changes
- Link to DLP configuration console

## API Integration Patterns

### Google Admin SDK Directory API
```typescript
// List organizational units
GET https://admin.googleapis.com/admin/directory/v1/customer/my_customer/orgunits

// Create enrollment token
POST https://www.googleapis.com/admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens
{
  "orgUnitPath": "/selected/ou/path"
}

// List users for validation
GET https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer
```

### Role Management API
```typescript
// Create custom admin role
POST https://admin.googleapis.com/admin/directory/v1/customer/my_customer/roles
{
  "roleName": "CEP Admin",
  "roleDescription": "Chrome Enterprise Premium Administrator",
  "rolePrivileges": [
    {"privilegeName": "CHROME_MANAGEMENT", "serviceId": "..."}
  ]
}
```

## Shared Infrastructure Requirements

1. **OrgUnit Service**: Enumerate organizational units starting from root
2. **Email Composer**: Rich text editor (ngx-editor) with template support
3. **User/Group Service**: Enumerate users and groups for sync validation
4. **Enrollment Token Service**: Create and list Chrome enrollment tokens

## Component Template

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
  
  // State signals
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Async operations
  async handleAction() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.service.performAction();
      // Handle success
    } catch (err) {
      this.error.set(this.errorHandler.getMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Known Issues & Warnings

### Critical Security Issues
1. **Token Storage** (#72): Tokens use Base64 instead of encryption
2. **Race Condition** (#73): Auth effect can run before token stored
3. **No CSRF Protection** (#79): Missing CSRF tokens

### Implementation Status
1. **Create Role**: Stub implementation needs API integration
2. **Browser Enrollment**: Basic UI complete, needs token generation
3. **Profile Enrollment**: Email template needs completion
4. **One-Click**: Needs proper navigation and validation
5. **DLP Config**: Stub only, needs policy templates

## Testing Requirements

### Unit Tests
- Test all services with mocked HTTP calls
- Test component logic and signal updates
- Mock Google API responses accurately
- Verify error handling paths

### E2E Tests
- Complete onboarding flow
- Role creation and assignment
- Token generation and display
- Email template preview

## Security Requirements

1. **Authentication**: Google OAuth required for all routes
2. **Authorization**: Super Admin vs CEP Admin permissions
3. **API Security**: Proper scopes for Google APIs
4. **Token Security**: Encrypt sensitive tokens
5. **Audit Logging**: Track all administrative actions

## Agent-Specific Guidelines

### For GitHub Copilot
- Automatically reads from `.github/copilot-instructions.md`
- Use descriptive comments to guide suggestions
- Always use Angular v20+ patterns in generated code

### For Claude
- Use TodoWrite tool for complex multi-step tasks
- Batch tool calls when possible for performance
- Run build/lint after making changes

### For Google Gemini
- Provide explicit context about Angular v20+ patterns
- Use project-specific prompts for component/service generation
- Remind about no googleapis SDK usage

## Before Submitting Code

- [ ] Run `npm run lint` - must pass
- [ ] Run `npm run build` - must succeed  
- [ ] Run `npm test` - must pass
- [ ] Verify Google API endpoints are correct
- [ ] Check for proper error handling
- [ ] Ensure loading states for all async operations
- [ ] Validate role-based visibility
- [ ] Test with both Super Admin and CEP Admin roles

## Additional Resources

- [Google Admin SDK Documentation](https://developers.google.com/admin-sdk)
- [Chrome Enterprise APIs](https://developers.google.com/chrome/enterprise)
- [Angular v20 Docs](https://angular.dev)
- [Material Design 3](https://m3.material.io)