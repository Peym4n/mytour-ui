import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { HealthViewModel } from './health.service';

describe('HealthViewModel', () => {
  let http: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = {
      get: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        HealthViewModel,
        { provide: HttpClient, useValue: http }
      ]
    });
  });

  it('maps a healthy backend response into success state', () => {
    http.get.mockReturnValue(of({ status: 'UP' }));

    const viewModel = TestBed.inject(HealthViewModel);
    viewModel.checkHealth();

    expect(viewModel.status()).toBe('UP');
    expect(viewModel.isChecking()).toBe(false);
    expect(viewModel.statusSeverity()).toBe('success');
  });

  it('maps backend connection failures into a user-facing down state', () => {
    http.get.mockReturnValue(throwError(() => new Error('offline')));

    const viewModel = TestBed.inject(HealthViewModel);
    viewModel.checkHealth();

    expect(viewModel.status()).toBe('DOWN (Cannot reach backend)');
    expect(viewModel.isChecking()).toBe(false);
    expect(viewModel.statusSeverity()).toBe('danger');
  });
});
