import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthSessionService } from './auth-session.service';

const AUTH_STORAGE_KEY = 'mytour.auth';

describe('AuthSessionService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('restores a stored browser session', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      accessToken: 'stored-token',
      expiresAt: '2026-07-04T12:00:00Z',
      user: {
        id: 7,
        username: 'alice'
      }
    }));

    const service = TestBed.inject(AuthSessionService);
    service.initialize();

    expect(service.token()).toBe('stored-token');
    expect(service.user()?.username).toBe('alice');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('persists a successful auth response and clears it on sign out', () => {
    const service = TestBed.inject(AuthSessionService);

    const applied = service.applyAuthResponse({
      accessToken: 'new-token',
      tokenType: 'Bearer',
      expiresAt: '2026-07-04T13:00:00Z',
      user: {
        id: 9,
        username: 'Bob'
      }
    });

    expect(applied).toBe(true);
    expect(service.token()).toBe('new-token');
    expect(JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({
      accessToken: 'new-token',
      expiresAt: '2026-07-04T13:00:00Z',
      user: {
        id: 9,
        username: 'Bob'
      }
    });

    service.clear();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('rejects auth responses without an access token', () => {
    const service = TestBed.inject(AuthSessionService);

    expect(service.applyAuthResponse({ tokenType: 'Bearer' })).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
