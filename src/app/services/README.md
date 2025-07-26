# OrgUnitsService

Angular service for managing Google Workspace Organizational Units (OUs) using the Admin SDK Directory API.

## Overview

The `OrgUnitsService` provides a reactive, signal-based interface for fetching and managing organizational units from Google Workspace. It integrates seamlessly with the existing `AuthService` for authentication and follows Angular 20 best practices.

## Features

- **Signal-based reactive state management**
- **Automatic caching** (5-minute cache duration)
- **Error handling** with user-friendly messages
- **Both flat and hierarchical data representations**
- **Integration with existing AuthService**
- **Comprehensive test coverage**

## Usage

### Basic Setup

The service is automatically available as a singleton when injected:

```typescript
import { Component, inject } from '@angular/core';
import { OrgUnitsService } from './services/org-units.service';

@Component({...})
export class MyComponent {
  private readonly orgUnitsService = inject(OrgUnitsService);

  async loadOrgUnits() {
    await this.orgUnitsService.fetchOrgUnits();
  }
}
```

### Reactive Data Access

```typescript
// Get flat list of org units (sorted alphabetically)
const orgUnits = this.orgUnitsService.orgUnits();

// Get hierarchical tree structure
const orgUnitTree = this.orgUnitsService.orgUnitTree();

// Check loading state
const isLoading = this.orgUnitsService.isLoading();

// Check for errors
const error = this.orgUnitsService.error();
```

### Template Usage

```html
@if (orgUnitsService.isLoading()) {
<mat-spinner></mat-spinner>
} @if (orgUnitsService.error()) {
<div class="error">{{ orgUnitsService.error() }}</div>
} @if (orgUnitsService.orgUnits().length > 0) {
<ul>
  @for (unit of orgUnitsService.orgUnits(); track unit.orgUnitId) {
  <li>{{ unit.name }} - {{ unit.orgUnitPath }}</li>
  }
</ul>
}
```

### Search and Filtering

```typescript
// Search by name (case-insensitive)
const salesUnits = this.orgUnitsService.getOrgUnitsByName("sales");

// Get specific unit by path
const engineering = this.orgUnitsService.getOrgUnitByPath("/Engineering");
```

### Cache Management

```typescript
// Clear cache and force fresh fetch
this.orgUnitsService.clearCache();
await this.orgUnitsService.fetchOrgUnits();
```

## API Reference

### Signals

- `orgUnits: Signal<OrgUnit[]>` - Flat list of organizational units, sorted alphabetically
- `isLoading: Signal<boolean>` - Loading state indicator
- `error: Signal<string | null>` - Current error message, if any
- `orgUnitTree: Signal<OrgUnitNode[]>` - Hierarchical tree structure

### Methods

- `fetchOrgUnits(): Promise<void>` - Fetch organizational units from Google API
- `getOrgUnitsByName(name: string): OrgUnit[]` - Search units by name
- `getOrgUnitByPath(path: string): OrgUnit | undefined` - Find unit by exact path
- `clearCache(): void` - Clear cached data

### Interfaces

```typescript
interface OrgUnit {
  orgUnitPath: string;
  orgUnitId: string;
  name: string;
  description?: string;
  parentOrgUnitPath?: string;
  parentOrgUnitId?: string;
}

interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[];
  level: number;
}
```

## Error Handling

The service provides user-friendly error messages for common scenarios:

- **401 Unauthorized**: "Authentication required. Please log in again."
- **403 Forbidden**: "Insufficient permissions to access organizational units..."
- **404 Not Found**: "Organizational units service not found..."
- **429 Rate Limited**: "Too many requests. Please try again later."
- **5xx Server Errors**: "Google service temporarily unavailable..."

## Authentication Requirements

The service requires the following OAuth scope to be included in the AuthService:

```
https://www.googleapis.com/auth/admin.directory.orgunit.readonly
```

This scope is automatically added when using the updated AuthService.

## Testing

Run the service tests:

```bash
npm test -- --include="**/org-units.service.spec.ts"
```

The test suite includes:

- ✅ Basic service initialization
- ✅ Successful API calls and data parsing
- ✅ Error handling for various HTTP status codes
- ✅ Caching behavior verification
- ✅ Tree structure generation
- ✅ Search and filtering functionality

## Demo

A demo component is available at `/org-units-demo` when running the application. This component demonstrates all service features including:

- Fetching organizational units
- Displaying both flat and tree views
- Error handling
- Loading states
- Cache management

## Dependencies

- `@angular/core` - Angular framework
- `@angular/common/http` - HTTP client
- `AuthService` - For authentication and access tokens

## Architecture

The service follows Angular 20 best practices:

- ✅ Standalone service with `providedIn: 'root'`
- ✅ Signal-based reactive state management
- ✅ Computed signals for derived state
- ✅ Proper error handling with user-friendly messages
- ✅ Caching for performance optimization
- ✅ Integration with existing authentication infrastructure
