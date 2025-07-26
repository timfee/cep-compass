import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'create-role',
    loadComponent: () =>
      import('./create-role/create-role.component').then(
        (m) => m.CreateRoleComponent,
      ),
  },
];