import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { StatusMessageComponent } from '../../shared/status-message/status-message';
import { TourFormViewModel } from './tour-form-view-model.service';

@Component({
  selector: 'app-tour-form',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, StatusMessageComponent],
  templateUrl: './tour-form.html',
  styleUrl: './tour-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly tourFormVm = inject(TourFormViewModel);

  ngOnInit(): void {
    const tourIdParam = this.route.snapshot.paramMap.get('tourId');

    if (tourIdParam === null) {
      this.tourFormVm.initializeCreate();
      return;
    }

    const tourId = Number(tourIdParam);
    if (!Number.isInteger(tourId) || tourId < 1) {
      this.tourFormVm.markInvalidTour();
      return;
    }

    this.tourFormVm.initializeEdit(tourId);
  }
}
