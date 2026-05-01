import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { HealthViewModel } from './health.service';

@Component({
  selector: 'app-health',
  template: `
    <div class="p-8 max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl border border-gray-200">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Backend Health Status</h2>
      <div class="flex items-center space-x-4">
        <span class="text-lg font-medium text-gray-600">Status:</span>
        <span [class]="getStatusClass()">
          {{ healthVm.status() }}
        </span>
      </div>
      <button 
        (click)="healthVm.checkHealth()"
        class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Refresh Status
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {
  public healthVm = inject(HealthViewModel);

  ngOnInit() {
    this.healthVm.checkHealth();
  }

  getStatusClass() {
    const status = this.healthVm.status();
    if (status === 'UP') return 'text-green-600 font-bold text-lg px-2 py-1 bg-green-100 rounded';
    if (status === 'Checking...') return 'text-blue-600 font-bold text-lg';
    return 'text-red-600 font-bold text-lg px-2 py-1 bg-red-100 rounded';
  }
}
