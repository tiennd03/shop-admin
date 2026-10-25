import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Note: inject() must run before the first `await` — after it we're outside the injection context.

/** Only signed-in users can enter the admin area. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.currentUser();
  return user ? true : router.createUrlTree(['/login']);
};

/** Signed-in users skip the login page. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.currentUser();
  return user ? router.createUrlTree(['/dashboard']) : true;
};
