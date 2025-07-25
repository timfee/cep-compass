import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SelectRoleComponent } from './auth/select-role/select-role';
import { authGuard } from './auth/auth.guard';
import { App } from './app';

export const routes: Routes = [
  {
    path: '',
    component: App,
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'select-role',
    component: SelectRoleComponent,
  },
];
