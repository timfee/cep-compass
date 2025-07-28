import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SelectRoleComponent } from './auth/select-role/select-role.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

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
      {
        path: 'org-units',
        loadComponent: () =>
          import('./components/org-units/org-units.component').then(
            (m) => m.OrgUnitsComponent,
          ),
      },
      {
        path: 'email-templates',
        loadComponent: () =>
          import('./components/email-templates/email-templates.component').then(
            (m) => m.EmailTemplatesComponent,
          ),
      },
      {
        path: 'directory-stats',
        loadComponent: () =>
          import('./components/directory-stats/directory-stats.component').then(
            (m) => m.DirectoryStatsComponent,
          ),
      },
      {
        path: 'demo-loading',
        loadComponent: () =>
          import('./components/demo-loading/demo-loading.component').then(
            (m) => m.DemoLoadingComponent,
          ),
      },
      {
        path: 'enrollment/browsers',
        loadComponent: () =>
          import('./components/browser-enrollment/browser-enrollment.component').then(
            (m) => m.BrowserEnrollmentComponent,
          ),
      },
      {
        path: 'enrollment/profiles',
        loadComponent: () =>
          import('./components/profile-enrollment/profile-enrollment.component').then(
            (m) => m.ProfileEnrollmentComponent,
          ),
      },
      {
        path: 'security/one-click',
        loadComponent: () =>
          import('./components/one-click-activation/one-click-activation.component').then(
            (m) => m.OneClickActivationComponent,
          ),
      },
      {
        path: 'security/dlp',
        loadComponent: () =>
          import('./components/dlp-configuration/dlp-configuration.component').then(
            (m) => m.DlpConfigurationComponent,
          ),
      },
      {
        path: 'admin/create-role',
        loadComponent: () =>
          import('./components/create-role/create-role.component').then(
            (m) => m.CreateRoleComponent,
          ),
        canActivate: [superAdminGuard],
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
  { path: '**', redirectTo: '' },
];
