import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthResponse } from '../api/generated/models/auth-response';
import { UserDto } from '../api/generated/models/user-dto';

interface StoredAuthSession {
  readonly accessToken: string;
  readonly expiresAt: string | undefined;
  readonly user: UserDto | undefined;
}

const AUTH_STORAGE_KEY = 'mytour.auth';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<UserDto | null>(null);
  private readonly expiresAtState = signal<string | null>(null);
  private initialized = false;

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly expiresAt = this.expiresAtState.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenState() !== null);

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    if (!this.isBrowser()) {
      return;
    }

    const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedSession === null) {
      return;
    }

    try {
      const parsedSession = JSON.parse(storedSession) as Partial<StoredAuthSession>;
      if (typeof parsedSession.accessToken !== 'string' || parsedSession.accessToken.length === 0) {
        this.clear();
        return;
      }

      this.tokenState.set(parsedSession.accessToken);
      this.userState.set(parsedSession.user ?? null);
      this.expiresAtState.set(parsedSession.expiresAt ?? null);
    } catch {
      this.clear();
    }
  }

  applyAuthResponse(response: AuthResponse): boolean {
    if (typeof response.accessToken !== 'string' || response.accessToken.length === 0) {
      return false;
    }

    this.tokenState.set(response.accessToken);
    this.userState.set(response.user ?? null);
    this.expiresAtState.set(response.expiresAt ?? null);
    this.persist();
    return true;
  }

  clear(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.expiresAtState.set(null);
    if (this.isBrowser()) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!this.isBrowser()) {
      return;
    }

    const storedSession: StoredAuthSession = {
      accessToken: this.tokenState() ?? '',
      expiresAt: this.expiresAtState() ?? undefined,
      user: this.userState() ?? undefined
    };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedSession));
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
