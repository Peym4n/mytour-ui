import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { TourLogFormViewModel } from './tour-log-form-view-model.service';

@Component({
  selector: 'app-tour-log-form',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './tour-log-form.html',
  styleUrl: './tour-log-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourLogFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly tourLogFormVm = inject(TourLogFormViewModel);

  ngOnInit(): void {
    const tourId = Number(this.route.snapshot.paramMap.get('tourId'));
    if (!Number.isInteger(tourId) || tourId < 1) {
      this.tourLogFormVm.markInvalidRoute();
      return;
    }

    const logIdParam = this.route.snapshot.paramMap.get('logId');
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
  }
}
