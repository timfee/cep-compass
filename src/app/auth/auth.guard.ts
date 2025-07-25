import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.selectedRole()) {
    router.navigate(['/select-role']);
    return false;
  }

  return true;
};
