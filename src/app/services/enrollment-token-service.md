# Chrome Enrollment Token Service

This service manages Chrome browser enrollment tokens using the Chrome Enterprise API. It provides functionality for creating, retrieving, and managing enrollment tokens for browser enrollment in Google Workspace environments.

## Features

- **Token Management**: Create, list, and revoke enrollment tokens
- **Organizational Unit Integration**: Validates org units before token creation
- **Signal-based State Management**: Reactive state using Angular signals
- **Token Lifecycle Management**: Tracks expiration and active status
- **Security Features**: Token masking and proper error handling
- **Enrollment Instructions**: Generates platform-specific enrollment instructions

## API Integration

- **Base URL**: `https://www.googleapis.com/admin/directory/v1.1beta1`
- **Required OAuth Scope**: `https://www.googleapis.com/auth/admin.directory.device.chromebrowsers`
- **Endpoints Used**:
  - `GET /customer/my_customer/chrome/enrollmentTokens` - List tokens
  - `POST /customer/my_customer/chrome/enrollmentTokens` - Create token
  - `POST /customer/my_customer/chrome/enrollmentTokens/{tokenId}:revoke` - Revoke token

## Usage Examples

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { EnrollmentTokenService } from './services/enrollment-token.service';

export class MyComponent {
  private tokenService = inject(EnrollmentTokenService);

  async createToken() {
    const result = await this.tokenService.createToken({
      orgUnitPath: '/Engineering',
      tokenPermanentId: 'eng-browsers-2024'
    });
    
    console.log('Token created:', result.token.token);
    console.log('Enrollment URL:', result.enrollmentUrl);
  }

  async listTokens() {
    const tokens = await this.tokenService.listTokens();
    console.log('All tokens:', tokens);
  }
}
```

### Using Signals

```typescript
export class TokenListComponent {
  private tokenService = inject(EnrollmentTokenService);

  // Reactive access to tokens
  tokens = this.tokenService.tokens;
  activeTokensByOu = this.tokenService.activeTokensByOu;
  isLoading = this.tokenService.isLoading;
  error = this.tokenService.error;

  constructor() {
    effect(() => {
      const tokens = this.tokens();
      console.log(`Found ${tokens.length} tokens`);
    });
  }
}
```

### Generating Enrollment Instructions

```typescript
generateInstructions(token: string) {
  const instructions = this.tokenService.generateEnrollmentInstructions(token);
  
  // Instructions include platform-specific commands for:
  // - Windows (Registry modification)
  // - macOS (defaults write command)
  // - Linux (JSON policy file)
  
  return instructions;
}
```

## Data Models

### EnrollmentToken
```typescript
interface EnrollmentToken {
  tokenId: string;
  token: string;
  tokenPermanentId: string;
  customerId: string;
  orgUnitPath: string;
  createdTime: string;
  revocationTime?: string;
  state: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expireTime?: string;
}
```

### CreateTokenRequest
```typescript
interface CreateTokenRequest {
  orgUnitPath: string; // Required, must exist in OrgUnits service
  tokenPermanentId?: string; // Optional custom ID
  expireTime?: string; // Optional expiration (ISO 8601 format)
}
```

### TokenCreationResponse
```typescript
interface TokenCreationResponse {
  token: EnrollmentToken;
  enrollmentUrl: string; // Helper URL for enrollment
}
```

## Error Handling

The service handles various error scenarios:

- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Service not available
- **409 Conflict**: Quota limits reached
- **429 Too Many Requests**: Rate limiting
- **5xx Server Errors**: Temporary service unavailability

## Security Considerations

- Tokens are masked in UI (only last 4 characters shown)
- Full token values are never logged
- Integration with existing authentication system
- Proper error messages without exposing sensitive information

## Integration Points

- **OrgUnitsService**: Validates organizational unit paths
- **AuthService**: Handles OAuth authentication and token management
- **EmailTemplateService**: Can be used to send enrollment instructions

## Testing

The service includes comprehensive unit tests covering:

- Signal-based state management
- Token lifecycle operations
- Error handling scenarios
- Integration with dependencies
- Utility functions (masking, validation, etc.)

Run tests with:
```bash
npm run test -- --include="**/enrollment-token.service.spec.ts"
```

## Dependencies

- Angular 20+ (signals support)
- `@angular/common/http` for HTTP requests
- `rxjs` for Observable handling
- OrgUnitsService for organizational unit validation
- AuthService for authentication