# Google Gemini Instructions for CEP Compass

## Primary Instructions

Please refer to [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for the complete, authoritative instruction set that is shared across all AI agents.

## Gemini-Specific Guidelines

### Context for Gemini Code Assist

When using Gemini in your IDE or Google Cloud Console, provide this context:

```
Working on Angular v20+ DESKTOP-ONLY app with:
- Standalone components only (no NgModules)
- Signals for state management
- OnPush change detection
- Material Design 3
- Direct HTTP calls (no googleapis SDK)
- TypeScript strict mode
- Desktop Chrome only (no mobile support needed)
```

### Gemini Prompting Best Practices

1. **For Component Generation**
   ```
   Create an Angular v20 standalone component with:
   - OnPush change detection
   - Signals for state
   - New control flow (@if, @for)
   - Material Design 3 styling
   - External template and styles
   ```

2. **For Service Generation**
   ```
   Create an Angular service that:
   - Uses inject() function
   - Returns Promises with firstValueFrom()
   - Makes direct HTTP calls to Google APIs
   - Has proper error handling
   - Uses signals for state
   ```

3. **For Test Generation**
   ```
   Create Jasmine tests that:
   - Mock all dependencies
   - Use TestBed.configureTestingModule
   - Test behavior not implementation
   - Handle async operations with fakeAsync
   - Achieve 80%+ coverage
   ```

### Integration with Google Cloud

Since this project uses Google Workspace APIs:

1. **API Calls Pattern**
   ```typescript
   // Tell Gemini: "Direct Google API call, no SDK"
   const url = `https://admin.googleapis.com/admin/directory/v1/users`;
   return firstValueFrom(this.http.get<Response>(url));
   ```

2. **Authentication Pattern**
   ```typescript
   // Tell Gemini: "Use existing auth interceptor"
   // Headers added automatically by auth.interceptor.ts
   // No manual token handling needed
   ```

3. **Error Handling Pattern**
   ```typescript
   // Tell Gemini: "Use GoogleApiErrorHandler"
   catch (error) {
     const message = this.errorHandler.getErrorMessage(error);
     this.notificationService.showError(message);
   }
   ```

### Gemini Studio/Workspace Prompts

Save these as templates in Gemini:

**"Angular Component Template"**
```
Generate Angular v20 component:
- Name: [ComponentName]
- Standalone with imports array
- OnPush change detection
- Signals: loading, data, error
- Effect for reactive updates
- Material components imported
- Template with @if/@for
- Proper error handling
```

**"Angular Service Template"**
```
Generate Angular service:
- Name: [ServiceName]
- Uses inject() for dependencies
- Methods return Promise<T>
- Direct HTTP calls to [API]
- Signal-based state
- Proper TypeScript types
- Error transformation
```

**"Unit Test Template"**
```
Generate Jasmine unit tests:
- For: [Component/Service]
- Mock all dependencies
- Test public API only
- Cover success/error cases
- Use fakeAsync for timing
- Descriptive test names
- AAA pattern
```

### Common Gemini Corrections

If Gemini suggests outdated patterns:

1. **"Update to Angular v20 patterns"**
2. **"Use signals instead of BehaviorSubject"**
3. **"Use @if instead of *ngIf"**
4. **"Remove NgModule, make standalone"**
5. **"Use inject() not constructor"**
6. **"Direct HTTP not googleapis SDK"**

### Gemini Code Review Prompts

For code review with Gemini:

```
Review this Angular code for:
1. Angular v20 best practices
2. Signal usage correctness
3. OnPush compatibility
4. Error handling completeness
5. Test coverage gaps
6. Security vulnerabilities
7. Performance issues
8. Accessibility compliance
```

### Material Design 3 with Gemini

When asking about styling:

```
Style this using Material Design 3:
- Use CSS variables var(--mat-sys-*)
- Follow 8px grid system
- Apply proper elevation
- Use theme tokens only
- Desktop-only (no mobile breakpoints)
- Add proper state layers
```

### Project-Specific Context

Always remind Gemini about:

1. **No googleapis SDK** - lightweight HTTP only
2. **Services in /src/app/services/** not shared
3. **Known issues**: auth race condition, missing tests
4. **Stub components**: enrollment, security features
5. **Material Design 3** tokens and patterns
6. **Desktop-only** - no mobile/responsive requirements

### Quick Command Reference

```bash
# Gemini can help with these commands
npm run build          # Verify changes compile
npm run lint          # Check code standards
npm test              # Run unit tests
ng generate component # Use with --standalone
```

Remember: The source of truth for all coding standards and patterns is [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md).