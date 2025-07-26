# CEP Compass

Chrome Enterprise Policy Compass - A comprehensive tool for managing Chrome Enterprise policies, enrollment, and security configurations.

## 🚀 Production Ready

This application has been optimized for production deployment with:

- ✅ **Modern Angular 20+** with standalone components and signals
- ✅ **Zero lint errors** and strict TypeScript configuration
- ✅ **Optimized bundle size** (1.17MB vs 1.40MB) with lazy loading
- ✅ **Security hardened** with CSP headers and proper configuration
- ✅ **Error monitoring** and global error handling
- ✅ **Environment-based configuration** for dev/prod separation

## Features

- **Dashboard**: Overview of Chrome Enterprise policies and status
- **Enrollment Management**: Browser and profile enrollment workflows
- **Security Configuration**: One-click activation and DLP policies
- **Admin Tools**: Role management and organization unit controls
- **Email Templates**: Automated communication workflows

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Production Build

```bash
# Build for production
npm run build --configuration=production

# Deploy to Firebase
firebase deploy
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Architecture

### Modern Angular Patterns

- **Standalone Components**: All components are standalone (no NgModules)
- **Signals**: Reactive state management with Angular signals
- **Control Flow**: Native `@if`, `@for`, `@switch` syntax
- **OnPush Change Detection**: Performance-optimized change detection

### Lazy Loading

Features are lazy-loaded to optimize initial bundle size:

- `/enrollment/*` - Enrollment management features
- `/security/*` - Security configuration features
- `/admin/*` - Administrative tools

### State Management

- **Signals**: Component-level reactive state
- **Services**: Business logic and data access
- **Firebase**: Authentication and backend services

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment instructions.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
