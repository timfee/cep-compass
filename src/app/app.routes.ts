import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SelectRoleComponent } from './auth/select-role/select-role';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OrgUnitsDemoComponent } from './org-units-demo/org-units-demo.component';
import { EmailDemoComponent } from './email-demo/email-demo.component';
import { EmailStandaloneDemoComponent } from './email-demo/email-standalone-demo.component';
import { DirectoryStatsComponent } from './components/directory-stats/directory-stats.component';
import { CreateRoleComponent } from './features/admin/create-role/create-role.component';
import { BrowserEnrollmentComponent } from './features/enrollment/browsers/browser-enrollment.component';
import { ProfileEnrollmentComponent } from './features/enrollment/profiles/profile-enrollment.component';
import { ProfileEnrollmentDemoComponent } from './features/enrollment/profiles/profile-enrollment-demo.component';
import { OneClickActivationComponent } from './features/security/one-click/one-click-activation.component';
import { OneClickActivationDemoComponent } from './features/security/one-click/one-click-activation-demo.component';
import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';

// A pipe to allow access only if a user is logged in AND has selected a role.
const canActivate = () => {
  const authService = inject(AuthService);
  return authService.selectedRole() ? true : ['/select-role'];
};

// A guard to ensure only Super Admins can access certain routes
const superAdminGuard = () => {
  const authService = inject(AuthService);
  const user = authService.user();
  const selectedRole = authService.selectedRole();
  const availableRoles = authService.availableRoles();
  
  if (!user) {
    return ['/login'];
  }
  
  if (!selectedRole) {
    return ['/select-role'];
  }
  
  if (selectedRole !== 'superAdmin' || !availableRoles.isSuperAdmin) {
    return ['/dashboard']; // Redirect to dashboard if not super admin
  }
  
  return true;
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, canActivate],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['/login']) },
    // This is the main, protected application view.
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'org-units-demo', component: OrgUnitsDemoComponent },
      { path: 'email-demo', component: EmailDemoComponent },
      { path: 'directory-stats', component: DirectoryStatsComponent },
      { path: 'enrollment/browsers', component: BrowserEnrollmentComponent },
      { path: 'enrollment/profiles', component: ProfileEnrollmentComponent },
      { path: 'security/one-click', component: OneClickActivationComponent },
      { 
        path: 'admin/create-role', 
        component: CreateRoleComponent,
        canActivate: [superAdminGuard]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectLoggedInTo(['/']) },
  },
  {
    path: 'select-role',
    component: SelectRoleComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['/login']) },
  },
  {
    path: 'email-template-demo',
    component: EmailStandaloneDemoComponent,
    // No auth guard - public demo
  },
  {
    path: 'profile-enrollment-demo',
    component: ProfileEnrollmentDemoComponent,
    // No auth guard - public demo
  },
  {
    path: 'one-click-demo',
    component: OneClickActivationDemoComponent,
    // No auth guard - public demo
  },
  { path: '**', redirectTo: '' },
];
