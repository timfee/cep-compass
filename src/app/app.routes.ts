import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SelectRoleComponent } from './auth/select-role/select-role';
import { OrgUnitsDemoComponent } from './org-units-demo/org-units-demo.component';
import { EmailDemoComponent } from './email-demo/email-demo.component';
import { EmailStandaloneDemoComponent } from './email-demo/email-standalone-demo.component';
import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';

// A pipe to redirect to role selection if a user is logged in but hasn't
// selected a role for the session yet.
const redirectLoggedInToRoleSelection = () =>
  pipe(
    map(user => (user ? ['/select-role'] : true)),
  );

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
    // Add your dashboard/main component here for child routes.
    children: [
      { path: 'org-units-demo', component: OrgUnitsDemoComponent },
      { path: 'email-demo', component: EmailDemoComponent },
      { path: '', redirectTo: 'org-units-demo', pathMatch: 'full' },
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
