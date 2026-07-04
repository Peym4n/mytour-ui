import { computed, inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, from, map, of, switchMap, take } from 'rxjs';

import { AuthResponse } from '../api/generated/models/auth-response';
import { AuthenticationService } from '../api/generated/services/authentication.service';
import { AuthSessionService } from './auth-session.service';

type AuthMode = 'login' | 'register';
type AuthSubmitResult =
  | { readonly kind: 'success'; readonly response: AuthResponse }
  | { readonly kind: 'failure' };

@Injectable({
  providedIn: 'root'
})
export class AuthViewModel {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthenticationService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly modeState = signal<AuthMode>('login');
  private readonly loadingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);

  readonly mode = this.modeState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly title = computed(() => this.modeState() === 'login' ? 'Sign in' : 'Create account');
  readonly submitLabel = computed(() => this.modeState() === 'login' ? 'Sign in' : 'Register');
  readonly alternateActionLabel = computed(() => this.modeState() === 'login'
    ? 'Create a new account'
    : 'Use an existing account');

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
  });

  initialize(): void {
    this.authSession.initialize();
  }

  switchMode(): void {
    this.modeState.update((mode) => mode === 'login' ? 'register' : 'login');
    this.errorMessageState.set(null);
    this.form.markAsPristine();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessageState.set('Please enter a valid username and password.');
      return;
    }

    this.loadingState.set(true);
    this.errorMessageState.set(null);
    const request = this.form.getRawValue();
    const authRequest = this.modeState() === 'login'
      ? this.authApi.login({ body: request })
      : this.authApi.register({ body: request });

    authRequest.pipe(
      switchMap((response) => from(this.resolveAuthResponse(response)).pipe(
        map((resolvedResponse): AuthSubmitResult => resolvedResponse === null
          ? { kind: 'failure' }
          : { kind: 'success', response: resolvedResponse })
      )),
      catchError(() => of<AuthSubmitResult>({ kind: 'failure' })),
      take(1)
    ).subscribe((result) => {
      this.loadingState.set(false);
      if (result.kind === 'failure' || !this.authSession.applyAuthResponse(result.response)) {
        this.errorMessageState.set('Authentication failed. Please check your credentials.');
        return;
      }

      void this.router.navigateByUrl('/tours');
    });
  }

  controlInvalid(controlName: 'username' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  controlError(controlName: 'username' | 'password'): string | null {
    const control = this.form.controls[controlName];
    if (!this.controlInvalid(controlName)) {
      return null;
    }

    if (control.errors?.['required']) {
      return controlName === 'username' ? 'Username is required.' : 'Password is required.';
    }

    if (control.errors?.['minlength']) {
      return controlName === 'username'
        ? 'Username must be at least 3 characters.'
        : 'Password must be at least 8 characters.';
    }

    return controlName === 'username'
      ? 'Username must be 50 characters or fewer.'
      : 'Password must be 128 characters or fewer.';
  }

  private async resolveAuthResponse(response: AuthResponse | Blob): Promise<AuthResponse | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return null;
      }

      return this.extractAuthResponse(JSON.parse(responseText));
    }

    return this.extractAuthResponse(response);
  }

  private extractAuthResponse(response: unknown): AuthResponse | null {
    if (typeof response !== 'object' || response === null) {
      return null;
    }

    if (!('accessToken' in response)) {
      return null;
    }

    return response as AuthResponse;
  }
}
