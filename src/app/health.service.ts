import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthViewModel {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/actuator/health`;

  status = signal<string>('Checking...');

  checkHealth() {
    this.status.set('Checking...');

    this.http.get<{status: string}>(this.apiUrl).subscribe({
      next: (res) => this.status.set(res.status),
      error: () => this.status.set('DOWN (Cannot reach backend)')
    });
  }
}
