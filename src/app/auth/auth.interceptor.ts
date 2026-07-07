import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from './auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  authSession.initialize();
  const token = authSession.token();

  if (token === null || isPublicAuthRequest(request.url)) {
    return next(request);
  }

  const authorizedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authSession.clear();
        void router.navigateByUrl('/auth');
      }

      return throwError(() => error);
    })
  );
};

function isPublicAuthRequest(url: string): boolean {
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}
