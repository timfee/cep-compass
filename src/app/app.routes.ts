import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SelectRoleComponent } from './auth/select-role/select-role';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OrgUnitsDemoComponent } from './org-units-demo/org-units-demo.component';
import { EmailDemoComponent } from './email-demo/email-demo.component';
import { EmailStandaloneDemoComponent } from './email-demo/email-standalone-demo.component';
import { DirectoryStatsComponent } from './components/directory-stats/directory-stats.component';
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
  { path: '**', redirectTo: '' },
];
