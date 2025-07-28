# CEP Compass

## **Chrome Enterprise Premium onboarding wizard for IT administrators**

Team: Chrome Enterprise  
Contributors: PM, Designer, Engineer, Analyst  
Resources: [Designs](./designs), [Analytics](./analytics), [Notes](./docs)  
Status: **Solution Review**  
Last Updated: Monday, January 28, 2025

---

# Problem Alignment 

| Phase-1: Account has GCP billing relationship, domain has been verified. Need to get the Citrix admin the right privilege level to login to http://admin.google.com, so they can start their CEP journey (80% of account base). Problems: Citrix admin is disconnected from the GCP/Workspace admin in the account. Why would that team give a Citrix admin superadmin privileges to http://admin.google? Even after the Citrix admin has been provisioned the login privilege - where do they go first, and what do they do. |
| :---- |

## High Level Approach

| Build a guided wizard with 5 action cards that walk IT admins through: creating delegated admin roles, generating enrollment tokens, educating users, activating security features, and configuring safe audit-only policies. Optimize by auto-assigning licenses to the org. |
| :---- |

## Goals

1. Enable Chrome management without requiring full Super Admin access (delegated CEP Admin role)
2. Auto-assign licenses to the organization for streamlined onboarding
3. Provide clear guidance for post-license assignment workflows
4. Prevent disruptive policy deployments through safe audit-only defaults
5. Generate ready-to-send deployment instructions for end users

## Non-goals

1. Replace Google Admin Console functionality
2. Handle multi-tenant scenarios or complex org structures
3. Automate software deployment to endpoints
4. Build custom policy editors beyond linking to Google's tools
5. Handle license purchasing workflow

| 🛑  Do not continue if all contributors are not aligned on the problem.  🟢  Complete the following table with "signatures" from all reviewers to move on.  |
| :---- |

| REVIEWER | TEAM/ROLE | STATUS |
| :---- | :---- | :---- |
|  |  |  |
|  |  |  |

# Solution Alignment 

|  ✅  *Draw the perimeter*  |  🚫  *Do not force others to identify scope*  |
| :---: | :---: |
|  |  |

## Key Features

Plan of record

## Key Features

Plan of record

1. **Create CEP Admin Role (Card 1 - Super Admins only)**  
   - One-click creation of delegated admin role with Chrome management permissions
   - Direct link to assign users: `https://admin.google.com/ac/roles/{RoleID}/admins`
   - Minimal permissions: CHROME_MANAGEMENT + read-only directory access

2. **Enroll Browsers (Card 2)**  
   - View existing enrollment tokens at `https://admin.google.com/ac/chrome/browser-tokens?org&hl=en`
   - Create new enrollment tokens via `GET https://www.googleapis.com/admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens?pageSize=1&orgUnitPath={LET_USER_PICK}`
   - Draft email template with token value for IT admin deployment

3. **Enroll Profiles (Card 3)**  
   - Show directory user count for sync validation
   - Draft user education email for work account login to Chrome
   - Guide users through SSO authentication process

4. **One-Click Activation (Card 4)**  
   - Direct to `https://admin.google.com/ac/chrome/reports/securityinsights` 
   - Prerequisite validation (browsers/profiles must be enrolled first)
   - Enable dashboard data population

5. **DLP Configuration (Card 5)**  
   - Direct to `https://admin.google.com/ac/dp?hl=en`
   - Recommend audit-only policies to generate logs without user disruption
   - Safe rollout approach to prevent user complaints or job-threatening incidents

## Key Flows

| **Admin First Experience**

1. Admin logs in → System checks permissions via Directory API
2. IF Super Admin → Show all 5 cards
3. IF CEP Admin → Show cards 2-5
4. ELSE → Show permission request instructions

**Token Generation Flow**

1. Click "Enroll Browsers" → Fetch OUs from API
2. Select OU → POST to `/admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens`
3. Display token with copy button
4. Open email composer with pre-filled template |
| :---- |

## Key Logic

1. **Permission Detection**
   - Use Directory API to check admin roles
   - Enable cards based on permission level

2. **API Endpoints**
   - OrgUnits: `GET /admin/directory/v1/customer/my_customer/orgunits`
   - Tokens: `POST /admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens`
   - Users: `GET /admin/directory/v1/users`

3. **Role Creation**
   - Name: "CEP Admin"
   - Privileges: CHROME_MANAGEMENT, READ_USERS, READ_ORGUNITS

4. **Email Templates**
   - Browser enrollment with registry/terminal commands
   - User education for profile sign-in

| 🛑  Do not continue if all contributors are not aligned on the problem.  🟢  Complete the following table with "signatures" from all reviewers to move on.  |
| :---- |

| REVIEWER | TEAM/ROLE | STATUS |
| :---- | :---- | :---- |
|  |  |  |
|  |  |  |

# Launch Plan

| Phase rollout starting with internal testing, then early access customers with onboarding issues, then general availability. |
| :---- |

## Key Milestones

| TARGET DATE | MILESTONE | DESCRIPTION | EXIT CRITERIA |
| :---- | :---- | :---- | :---- |
| TBD | Internal Testing | Test with internal domains | Core functionality working |
| TBD | Early Access | Selected customers | Successful onboarding |
| TBD | GA | All customers | Stable deployment |

## Operational Checklist

| TEAM | PROMPT | Y/N | ACTION (if yes) |
| :---- | :---- | :---- | :---- |
| Analytics | Do you need additional tracking? | Y | Track card completion rates |
| Customer Success | Do you need to update support content or training? | Y | Update onboarding guides |
| Security | Does this expose a risk vector? | Y | Review admin delegation model |

# Appendix

## Open Questions

1. How to handle orgs without Google Workspace?
2. What if admin can't get any elevated permissions?
3. How to detect existing CEP Admin roles?

## Implementation Notes

### Shared Infrastructure
1. **OrgUnit Service** - Enumerate organizational units starting from root for dropdown selection
2. **Email Composer** - Rich text editor using `https://www.npmjs.com/package/ngx-editor` with meaningful helpful message templates  
3. **User/Group Service** - Enumerate users and groups to validate directory sync state
4. **Enrollment Token Service** - Create and list Chrome browser enrollment tokens

### API Authentication
- All calls require OAuth token from AuthService
- Scopes needed:
  - `admin.directory.orgunit.readonly`
  - `admin.directory.device.chromebrowsers`
  - `admin.directory.user.readonly`