import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { HealthViewModel } from './health.service';

@Component({
  selector: 'app-health',
  imports: [ButtonModule, CardModule, TagModule],
  template: `
    <section class="px-4 py-10">
      <p-card class="mx-auto block max-w-2xl">
        <ng-template pTemplate="title">Backend Health Status</ng-template>
        <ng-template pTemplate="content">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <span class="text-lg font-medium text-gray-600">Status</span>
              <p-tag
                [value]="healthVm.status()"
                [severity]="healthVm.statusSeverity()"
                [rounded]="true"
              />
            </div>

            <p-button
              label="Refresh Status"
              [loading]="healthVm.isChecking()"
              [disabled]="healthVm.isChecking()"
              (onClick)="healthVm.checkHealth()"
            />
          </div>
        </ng-template>
      </p-card>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {
  protected readonly healthVm = inject(HealthViewModel);

  ngOnInit(): void {
    this.healthVm.checkHealth();
  }
}
