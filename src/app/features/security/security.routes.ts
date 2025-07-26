import { Routes } from '@angular/router';

export const securityRoutes: Routes = [
  {
    path: 'one-click',
    loadComponent: () =>
      import('./one-click/one-click-activation.component').then(
        (m) => m.OneClickActivationComponent,
      ),
  },
  {
    path: 'dlp',
    loadComponent: () =>
      import('./dlp/dlp-configuration.component').then(
        (m) => m.DlpConfigurationComponent,
      ),
  },
];
