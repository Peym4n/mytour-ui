import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { StatusMessageComponent } from '../../shared/status-message/status-message';
import { TourLogFormViewModel } from './tour-log-form-view-model.service';

@Component({
  selector: 'app-tour-log-form',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, StatusMessageComponent],
  templateUrl: './tour-log-form.html',
  styleUrl: './tour-log-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourLogFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly tourLogFormVm = inject(TourLogFormViewModel);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap) => {
      const tourId = Number(paramMap.get('tourId'));
      if (!Number.isInteger(tourId) || tourId < 1) {
        this.tourLogFormVm.markInvalidRoute();
        return;
      }

      const logIdParam = paramMap.get('logId');
      if (logIdParam === null) {
        this.tourLogFormVm.initializeCreate(tourId);
        return;
      }

      const logId = Number(logIdParam);
      if (!Number.isInteger(logId) || logId < 1) {
        this.tourLogFormVm.markInvalidRoute(tourId);
        return;
      }

      this.tourLogFormVm.initializeEdit(tourId, logId);
    });
  }
}
