# Error Handling Implementation Guide

This document outlines the error handling patterns implemented in CEP Compass to ensure users receive appropriate feedback when API calls fail and can easily retry operations.

## Overview

The error handling implementation follows Angular v20+ best practices using signals for state management and provides:
- Consistent error display across all components
- User-friendly error messages with retry functionality
- Loading states to indicate operations in progress
- Prevention of blank pages when API calls fail

## Components

### ErrorDisplayComponent

**Location:** `src/app/shared/components/error-display/error-display.component.ts`

A reusable component that provides consistent error display across the application.

**Features:**
- Customizable error title and message
- Configurable Material Design icons
- Optional retry button with customizable text
- Responsive design that works on mobile and desktop
- Built-in loading state handling

**Usage:**
```html
<app-error-display
  [message]="error()!"
  title="Custom Error Title"
  icon="custom_icon"
  [retryDisabled]="isLoading()"
  retryButtonText="Try Again"
  (retry)="onRetry()"
/>
```

**Inputs:**
- `message` (required): Error message to display
- `title`: Error title (defaults to "Error")
- `icon`: Material icon name (defaults to "error")
- `showRetry`: Whether to show retry button (defaults to true)
- `retryDisabled`: Whether retry button should be disabled (defaults to false)
- `retryButtonText`: Text for retry button (defaults to "Try Again")

**Outputs:**
- `retry`: Emitted when retry button is clicked

## BaseApiService Pattern

**Location:** `src/app/core/base-api.service.ts`

Services that fetch data from APIs extend `BaseApiService` which provides:
- Loading state management (`isLoading` signal)
- Error state management (`error` signal)
- Caching with validation (`lastFetchTime` signal)
- Standard methods for state management

**Usage in Services:**
```typescript
export class MyDataService extends BaseApiService {
  async fetchData(): Promise<void> {
    if (this.isCacheValid()) return;
    
    this.setLoading(true);
    try {
      const data = await this.apiCall();
      // Process data...
      this.updateFetchTime();
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this.setError(errorMessage);
      console.error('Fetch failed:', error);
    } finally {
      this.setLoading(false);
    }
  }
}
```

## Component Error Handling Patterns

### Pattern 1: Service-Based Error Handling

Components that use services extending `BaseApiService` get error handling automatically:

```typescript
@Component({
  template: `
    @if (service.error()) {
      <app-error-display
        [message]="service.error()!"
        title="Data Loading Failed"
        [retryDisabled]="service.isLoading()"
        (retry)="service.refreshData()"
      />
    }
    
    @if (service.isLoading()) {
      <mat-spinner></mat-spinner>
    }
    
    @if (!service.error() && !service.isLoading()) {
      <!-- Normal content -->
    }
  `
})
export class MyComponent {
  service = inject(MyDataService);
}
```

**Examples:**
- `DirectoryStatsComponent`
- `OrgUnitsComponent`

### Pattern 2: Component-Level Error Handling

Components that make direct API calls implement their own error handling:

```typescript
@Component({
  template: `
    @if (error()) {
      <app-error-display
        [message]="error()!"
        title="Operation Failed"
        [retryDisabled]="isLoading()"
        (retry)="retry()"
      />
    }
    
    @if (isLoading()) {
      <mat-spinner></mat-spinner>
    }
  `
})
export class MyComponent {
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  
  async performOperation(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      await this.apiCall();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      this._error.set(errorMessage);
      console.error('Operation failed:', error);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  async retry(): Promise<void> {
    this._error.set(null);
    await this.performOperation();
  }
}
```

**Examples:**
- `EmailComposerComponent`
- `CreateRoleComponent`

## Implementation Status

### ✅ Completed Components

1. **ErrorDisplayComponent** - Reusable error display component
2. **DirectoryStatsComponent** - Enhanced with ErrorDisplayComponent
3. **EmailComposerComponent** - Comprehensive error handling for all operations
4. **OrgUnitsComponent** - Enhanced with ErrorDisplayComponent
5. **CreateRoleComponent** - Already had proper error handling

### ✅ Already Adequate

1. **DashboardComponent** - Static component, no API calls
2. **EmailTemplatesComponent** - Simple wrapper, no direct API calls

## Best Practices

### Error Messages
- Use clear, user-friendly language
- Avoid technical jargon
- Provide specific context about what failed
- Include actionable information when possible

### Loading States
- Always show loading indicators for operations > 200ms
- Disable form controls during loading
- Use appropriate loading spinner sizes
- Provide loading text for context

### Retry Functionality
- Always provide retry options for recoverable errors
- Disable retry during loading to prevent duplicate requests
- Clear previous errors before retrying
- Consider exponential backoff for repeated failures

### Logging
- Log detailed error information to console for debugging
- Include error context (what operation was being performed)
- Use appropriate log levels (error, warn, info)

## Testing Error Scenarios

To test error handling:

1. **Network Errors**: Disconnect network or use browser dev tools to throttle
2. **API Errors**: Use dev tools to block API endpoints
3. **Service Errors**: Mock services to throw errors in tests
4. **Loading States**: Add artificial delays to test loading indicators

## Future Enhancements

Consider implementing:
- Global error boundary for unhandled errors
- Error reporting service integration
- Offline detection and handling
- Retry with exponential backoff
- Toast notifications for transient errors