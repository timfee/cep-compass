# Browser Enrollment Management

This component provides a comprehensive interface for managing Chrome browser enrollment tokens and creating enrollment emails for IT administrators.

## Features

### 1. View Enrollment Tokens

- **Admin Console Link**: Direct link to Google Admin Console for token management
- **Token List Display**: Shows existing tokens with their status, org unit, and expiration
- **Refresh Functionality**: Manual refresh of token list

### 2. Create New Enrollment Token

- **Org Unit Selection**: Dropdown populated from OrgUnitsService
- **Token Creation**: Generates new enrollment tokens with validation
- **Success Display**: Shows created token details with masked value for security
- **Copy to Clipboard**: One-click copy of full token value

### 3. Email Draft Composition

- **Template Integration**: Uses EmailTemplateService with comprehensive enrollment template
- **Variable Auto-Population**: Pre-fills token, org unit, and expiration data
- **IT Instructions**: Includes deployment commands for Windows, macOS, and Linux
- **Email Composer**: Full-featured email editor with template preview

## Technical Implementation

### Component Architecture

- **Standalone Component**: Modern Angular architecture with no NgModules
- **Signal-Based State**: Reactive state management using signals
- **Change Detection**: OnPush strategy for optimal performance
- **Material Design**: Consistent UI using Angular Material components

### Service Integration

- **EnrollmentTokenService**: Token CRUD operations and validation
- **OrgUnitsService**: Organizational unit data and selection
- **EmailTemplateService**: Email composition and template management

### Accessibility Features

- **ARIA Labels**: Proper accessibility attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML structure
- **High Contrast Mode**: Support for accessibility preferences

### Responsive Design

- **Mobile Optimized**: Responsive layout for all screen sizes
- **Touch Friendly**: Optimized for mobile interaction
- **Progressive Enhancement**: Works on all device types

## Usage

1. **Access**: Navigate to `/enrollment/browsers` (requires CEP Admin or Super Admin role)
2. **View Tokens**: See existing enrollment tokens in the Admin Console
3. **Create Token**: Select an organizational unit and create a new token
4. **Copy Token**: Use the copy button to get the full token value
5. **Draft Email**: Create an email with deployment instructions for IT teams

## Email Template

The component includes a comprehensive email template with:

- **Platform Instructions**: Commands for Windows (Registry), macOS (Terminal), and Linux (Policy Files)
- **Token Information**: Embedded token value and expiration details
- **Documentation Links**: References to official Chrome management documentation
- **Professional Format**: Ready-to-send email format for IT administrators

## Security Considerations

- **Token Masking**: Only shows last 8 characters in UI
- **Secure Clipboard**: Safe copy-to-clipboard functionality
- **Role-Based Access**: Requires appropriate admin permissions
- **Audit Ready**: All actions can be tracked through service logging

## Example Deployment Commands

### Windows (Registry)

```cmd
reg add HKLM\Software\Policies\Google\Chrome\CloudManagementEnrollmentToken /v CloudManagementEnrollmentToken /t REG_SZ /d [TOKEN] /f
```

### macOS (Terminal)

```bash
sudo defaults write com.google.Chrome CloudManagementEnrollmentToken -string "[TOKEN]"
```

### Linux (Policy File)

```json
{ "CloudManagementEnrollmentToken": "[TOKEN]" }
```

## Component Routes

- **Main Route**: `/enrollment/browsers`
- **Protected**: Requires authentication and appropriate role
- **Integration**: Part of CEP Compass dashboard navigation

## Development

The component follows Angular best practices:

- TypeScript strict mode
- ESLint compliance
- Comprehensive unit tests
- Material Design guidelines
- Accessibility standards (WCAG 2.1 AA)
