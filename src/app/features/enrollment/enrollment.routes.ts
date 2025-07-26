import { Routes } from '@angular/router';

export const enrollmentRoutes: Routes = [
  {
    path: 'browsers',
    loadComponent: () =>
      import('./browsers/browser-enrollment.component').then(
        (m) => m.BrowserEnrollmentComponent,
      ),
  },
  {
    path: 'profiles',
    loadComponent: () =>
      import('./profiles/profile-enrollment.component').then(
        (m) => m.ProfileEnrollmentComponent,
      ),
  },
];
