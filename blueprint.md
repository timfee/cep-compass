# CEP Compass Blueprint

## Overview

CEP Compass is an administrative tool for managing Chrome Enterprise policies. It requires users to log in with their Google account and select an administrative role for their session.

## Style and Design

The application uses Google's Material Design component library to ensure a consistent, modern, and accessible user experience.

- **Component Library:** Angular Material
- **Layout:** Centered, single-column layouts for focus and clarity, with a main toolbar for navigation.
- **Typography:** The application uses the modern `Google Sans Flex`, `Google Sans Text`, and `Google Sans Code` font families, served from Google Fonts.
- **Color:** A standard Indigo/Pink theme from Angular Material.
- **Architecture:** Code is organized by feature into dedicated folders (e.g., `src/app/auth`). Components use external templates and stylesheets.

## Project Standards

- **Standalone Components:** All components, directives, and pipes are standalone.
- **Modern Asynchronous Code:** The project uses `async/await` with Promises and Signals for all state management and asynchronous operations, avoiding direct use of RxJS operators.
- **Code Quality:** The codebase is automatically formatted with Prettier and linted with ESLint. These checks are run as part of the development workflow.
- **Build Configuration:** The application build is configured with an increased initial bundle size budget (1MB warning, 1.5MB error) to accommodate the Angular Material library without generating warnings.

## Features

### Implemented

- **Authentication:**
  - All authentication-related components, services, and guards are organized in the `src/app/auth` directory.
  - Users log in via a dedicated page at the `/login` route.
  - The login UI is built with Angular Material cards and buttons.
- **Role-Based Access Control (RBAC):**
  - After login, users are redirected to a `/select-role` page.
  - The role selection UI uses Angular Material cards and buttons, which are dynamically enabled/disabled based on the user's available roles.
  - The application is protected by a route guard (`auth.guard.ts`) that ensures a user is both authenticated and has selected a role.
- **Dynamic Role Discovery:** The `AuthService` dynamically discovers if a user has `Super Admin` or `CEP Admin` privileges by inspecting their Google Workspace admin roles.
- **Session Management:** The chosen role is persisted for the duration of the session. A logout button is available in the main toolbar.

### Current Plan

This plan covers the aesthetic and configuration updates to the application.

1.  **Build Budget Adjustment:**
    -   Modified `angular.json` to increase the initial bundle size warning to `1MB` and the error threshold to `1.5MB`, resolving build warnings.
2.  **Font Integration:**
    -   Added the `Google Sans Flex`, `Google Sans Text`, and `Google Sans Code` fonts to `index.html`.
    -   Updated the global stylesheet (`styles.css`) to apply the new fonts to the body, headings, and code elements, creating a consistent typographic scale.
3.  **Verification:**
    -   Ran `pnpm format`, `pnpm lint`, and `ng build` to ensure all checks pass and the budget warning is no longer present.