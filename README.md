# CEP Compass

Chrome Enterprise Policy Compass - A comprehensive tool for managing Chrome Enterprise policies, enrollment, and security configurations.

## 🚀 Production Ready

This application has been optimized for production deployment with:

- ✅ **Modern Angular 20+** with standalone components and signals
- ✅ **Zero lint errors** and strict TypeScript configuration
- ✅ **Optimized bundle size** (1.01MB) with lazy loading and dependency cleanup
- ✅ **Security hardened** with proper HTTP headers and type-safe API validation
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

## Testing Setup

### Fresh Ubuntu Installation

For setting up tests on a fresh Ubuntu instance:

#### 1. Install System Dependencies

```bash
# Update package list
sudo apt update

# Install curl and essential build tools
sudo apt install -y curl build-essential

# Install Chrome/Chromium for headless testing
sudo apt install -y chromium-browser

# Alternative: Install Google Chrome (recommended for CI)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

#### 2. Install Node.js

```bash
# Install Node.js 20.x (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### 3. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd cep-compass

# Install dependencies
npm install

# Install Playwright browsers (for e2e tests)
npx playwright install chromium
```

#### 4. CI Environment Setup

For CI environments, ensure these environment variables are set:

```bash
export CHROME_BIN="/usr/bin/google-chrome"
export DISPLAY=:99
```

### Running Tests

#### Unit Tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner:

```bash
# Run tests once
npm test

# Run tests in watch mode
ng test --watch

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode (CI)
ng test --browsers=ChromeHeadlessCI --watch=false
```

#### End-to-End Tests

To run Playwright e2e tests:

```bash
# Run e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts
```

### CI Configuration

The project uses GitHub Actions for continuous integration. Tests are configured for headless Chrome with these flags:

- `--no-sandbox` - Required for containerized environments
- `--disable-gpu` - Improves performance in headless mode
- `--disable-dev-shm-usage` - Prevents shared memory issues in Docker

GitHub Actions automatically runs linting, unit tests, e2e tests, and build verification on every commit and pull request.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment instructions.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
