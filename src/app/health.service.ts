import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, take } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthViewModel {
  private readonly http = inject(HttpClient);
  private readonly statusState = signal('Checking...');

  private readonly apiUrl = `${environment.apiUrl}/actuator/health`;

  readonly status = this.statusState.asReadonly();

  readonly isChecking = computed(() => this.statusState() === 'Checking...');

  readonly statusSeverity = computed<'success' | 'info' | 'danger'>(() => {
    const status = this.statusState();
    if (status === 'UP') {
      return 'success';
    }

    return status === 'Checking...' ? 'info' : 'danger';
  });

  checkHealth(): void {
    this.statusState.set('Checking...');

    this.http.get<{ status: string }>(this.apiUrl).pipe(
      take(1),
      map((response) => response.status),
      catchError(() => of('DOWN (Cannot reach backend)'))
    ).subscribe((status) => {
      this.statusState.set(status);
    });
  }
}
