# CEP Compass - Product Requirements Document

## Executive Summary

CEP Compass is a comprehensive web-based administration platform for Community Eligibility Provision (CEP) programs within educational institutions. The platform enables administrators to manage student enrollment, communicate with families, track directory statistics, and ensure program compliance through role-based access control and Google Workspace integration.

## Product Vision

To provide educational administrators with a unified, secure, and user-friendly platform for managing all aspects of their CEP programs, reducing administrative burden while ensuring compliance and improving communication with families.

## Core Problems

1. **Fragmented Administration**: Schools currently use multiple disconnected tools for enrollment, communication, and reporting
2. **Manual Processes**: Heavy reliance on paper forms and manual data entry
3. **Limited Access Control**: Difficulty managing who can access and modify sensitive student data
4. **Communication Gaps**: No centralized system for reaching families with program updates
5. **Compliance Tracking**: Manual tracking of eligibility and participation rates

## Target Users

### Primary Users
1. **Super Administrators** (District Level)
   - Manage multiple CEP programs across schools
   - Create and assign administrative roles
   - Access all features and data

2. **CEP Administrators** (School Level)
   - Manage their school's CEP program
   - Send communications to families
   - View enrollment statistics
   - Cannot modify system-wide settings

3. **Participants** (Read-only users)
   - View program information
   - Access directory information
   - Cannot modify any data

### User Personas

**Maria Rodriguez - CEP Administrator**
- Manages CEP program at Lincoln Elementary
- Needs to quickly send updates to 500+ families
- Often works from school visits on her tablet
- Frustrated by current email/paper process

**James Chen - Super Administrator**
- Oversees CEP programs for entire district
- Needs visibility into all schools' enrollment
- Manages access for 50+ administrators
- Requires audit trails for compliance

## Feature Requirements

### 1. Authentication & Authorization

**Current State**: ✅ Implemented (with issues)
- Google OAuth integration via Firebase Auth
- Role-based access control (Super Admin, CEP Admin, Participant)
- Session management with token refresh

**Known Issues**:
- Race condition causing admin lockouts (#73)
- Insecure token storage (#72)
- Missing CSRF protection (#79)

### 2. Dashboard

**Current State**: ✅ Implemented
- Role-specific dashboard cards
- Quick access to common tasks
- Directory statistics overview
- Responsive grid layout

**Enhancements Needed**:
- Loading states for better UX (#74)
- Mobile responsive design (#75)

### 3. Email Communication

**Current State**: ✅ Implemented
- Template-based email composer
- Variable replacement system
- Quill rich text editor
- Batch email capabilities

**Features**:
- Pre-built templates for common communications
- Custom variable insertion
- Preview before sending
- Recipient selection from directory

### 4. Directory Management

**Current State**: ✅ Implemented
- Search and filter capabilities
- Pagination for large datasets
- Integration with Google Workspace Directory API
- Export functionality

**Features**:
- Real-time search
- Filter by organization unit
- View user details
- Track enrollment statistics

### 5. Admin Features

**Current State**: ⚠️ Partially Implemented
- Role creation for CEP Admins
- Basic admin console access

**Planned Features**:
- Email template management
- Bulk user operations
- Audit logging
- Custom role permissions

### 6. Security Features

**Current State**: ⚠️ Needs Improvement
- Google OAuth for authentication
- Role-based permissions
- API authentication via interceptors

**Required Improvements**:
- Implement secure token storage
- Add CSRF protection
- Fix authentication race conditions
- Add comprehensive audit logging

### 7. Enrollment Features

**Current State**: 🚧 Stub Implementation
- Browser enrollment component (stub)
- Profile enrollment component (stub)

**Planned Features**:
- Student enrollment forms
- Document upload
- Approval workflows
- Enrollment tracking

## Technical Architecture

### Frontend
- **Framework**: Angular 20+ with standalone components
- **UI Library**: Angular Material v20 (Material Design 3)
- **State Management**: Angular Signals
- **Styling**: SCSS with Material Design tokens
- **Build Tool**: Angular CLI with esbuild

### Backend Services
- **Authentication**: Firebase Auth with Google OAuth
- **APIs**: Direct Google Workspace API integration
- **Functions**: Firebase Functions for specific operations
- **Database**: Firebase Firestore (planned)

### Infrastructure
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **Monitoring**: Google Analytics (planned)
- **Error Tracking**: To be implemented

## Design Principles

1. **Mobile-First**: 30% of administrators work from mobile devices
2. **Accessibility**: WCAG 2.1 AA compliance required
3. **Performance**: Sub-3 second page loads
4. **Security**: Educational data protection compliance
5. **Simplicity**: Reduce clicks for common tasks

## Success Metrics

### User Adoption
- 90% of eligible administrators activated within 30 days
- 80% weekly active usage rate
- <5% support ticket rate

### Performance
- <3 second average page load time
- 99.9% uptime
- <1% error rate

### Business Impact
- 50% reduction in time spent on administrative tasks
- 75% reduction in paper-based processes
- 100% compliance with CEP reporting requirements

## MVP Scope

### Phase 1 (Current)
- ✅ Authentication with Google
- ✅ Role-based access control
- ✅ Dashboard with statistics
- ✅ Email composer with templates
- ✅ Directory search and stats

### Phase 2 (Next)
- 🔧 Fix authentication issues
- 🔧 Add comprehensive testing
- 🔧 Mobile responsive design
- 🔧 Loading states and polish

### Phase 3 (Future)
- 📋 Complete enrollment system
- 📋 Document management
- 📋 Audit logging
- 📋 Analytics dashboard
- 📋 Bulk operations

## Risk Mitigation

### Technical Risks
1. **Google API Quotas**: Implement caching and rate limiting
2. **Data Security**: Regular security audits, encryption at rest
3. **Browser Compatibility**: Test on all major browsers

### User Adoption Risks
1. **Training**: Provide video tutorials and documentation
2. **Migration**: Offer data import tools
3. **Support**: Dedicated support during rollout

## Constraints

1. **Compliance**: Must meet educational data privacy laws
2. **Integration**: Must work with existing Google Workspace
3. **Performance**: Must work on older devices/networks
4. **Accessibility**: Must be usable by users with disabilities

## Out of Scope

1. Financial management/payment processing
2. Student gradebook functionality
3. Parent portal access
4. Third-party LMS integration
5. Custom reporting beyond CEP requirements

## Appendix

### Terminology
- **CEP**: Community Eligibility Provision - Federal program providing free meals
- **Directory**: Google Workspace user directory
- **Organization Unit**: Hierarchical grouping in Google Workspace

### Related Documents
- [CLAUDE.md](./CLAUDE.md) - Development standards and guidelines
- [README.md](./README.md) - Technical setup instructions
- [GitHub Issues](https://github.com/timfee/cep-compass/issues) - Current bugs and enhancements