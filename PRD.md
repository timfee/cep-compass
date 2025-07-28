# CEP Compass

## **Chrome Enterprise Premium onboarding wizard for IT administrators**

Team: Chrome Enterprise  
Contributors: [PM], [Designer], [Engineer], [Analyst]  
Resources: [Designs](./designs), [Analytics](./analytics), [Notes](./docs)  
Status: **Solution Review** / Draft / Problem Review / Launch Review / Launched  
Last Updated: Monday, January 28, 2025

---

# Problem Alignment 

| IT administrators with existing GCP billing relationships cannot easily onboard Chrome Enterprise Premium because the Workspace/GCP admin won't grant them Super Admin privileges. Even when they get access, they don't know where to start - which APIs to enable, what tokens to generate, or how to safely roll out policies without disrupting users. |
| :---- |

## High Level Approach

| Build a guided wizard with 5 action cards that walk IT admins through: creating delegated admin roles, generating enrollment tokens, educating users, activating security features, and configuring safe audit-only policies. |
| :---- |

## Goals

1. Enable Chrome management without requiring full Super Admin access
2. Provide clear next steps after license purchase
3. Prevent disruptive policy deployments through safe defaults
4. Show enrollment progress with real metrics
5. Generate ready-to-send deployment instructions

## Non-goals

1. Replace Google Admin Console
2. Automate software deployment to endpoints
3. Build custom policy editors
4. Handle license purchasing
5. Support multi-tenant scenarios

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

1. **Create CEP Admin Role (Card 1 - Super Admins only)**  
   - One-click creation of delegated admin role
   - Minimal permissions: Chrome management + read-only directory access
   - Direct link to assign users: `https://admin.google.com/ac/roles/{RoleID}/admins`

2. **Enroll Browsers (Card 2)**  
   - List existing enrollment tokens
   - Create new tokens with OU picker
   - Draft deployment email with token and platform-specific instructions

3. **Enroll Profiles (Card 3)**  
   - Show directory user count for validation
   - Draft user education email
   - Instructions for signing into Chrome

4. **One-Click Activation (Card 4)**  
   - Link to `https://admin.google.com/ac/chrome/reports/securityinsights`
   - Prerequisite validation (browsers/profiles enrolled)
   - Explain dashboard population timeline

5. **DLP Configuration (Card 5)**  
   - Direct to `https://admin.google.com/ac/dp?hl=en`
   - Recommend audit-only policies first
   - Avoid blocking actions initially

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
1. **OrgUnit Service** - Enumerate OUs for dropdown
2. **Email Composer** - Rich text editor with templates
3. **User/Group Service** - Validate directory sync
4. **Enrollment Token Service** - Create and list tokens

### API Authentication
- All calls require OAuth token from AuthService
- Scopes needed:
  - `admin.directory.orgunit.readonly`
  - `admin.directory.device.chromebrowsers`
  - `admin.directory.user.readonly`