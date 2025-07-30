---
applyTo: "src/app/components/**/*.ts"
---

# CEP Compass Feature Implementation

CEP Compass provides IT administrators with Chrome Enterprise Premium management workflows.

## Key Features

- **Create CEP Admin Role**: Delegated admin role creation (Super Admins only)
- **Browser Enrollment**: Display/create enrollment tokens with email templates  
- **Profile Enrollment**: User education and Chrome profile setup guidance
- **One-Click Activation**: Security insights dashboard integration
- **DLP Configuration**: Audit-only policy setup to avoid user disruption

## Role-Based Access Control

Implement proper role-based visibility:
- Super Admin: Full access to all features including role creation
- CEP Admin: Access to enrollment and security features
- Participant: Read-only access

## Component Guidelines

Use Angular Material components for all UI elements.
Follow the 8px spacing grid.
Never override .mat-mdc-* classes directly.
Always use OnPush change detection.
Implement proper loading states and error handling.

## Security Requirements

Never expose or log sensitive data like tokens or passwords.
Use sessionStorage for temporary data, not localStorage.
Always validate user input.
Use the auth interceptor for API authentication.
