import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { StatusMessageComponent } from '../../shared/status-message/status-message';
import { TourDetailViewModel } from './tour-detail-view-model.service';

@Component({
  selector: 'app-tour-detail',
  imports: [RouterLink, ButtonModule, TagModule, StatusMessageComponent],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly tourVm = inject(TourDetailViewModel);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap) => {
      const tourId = Number(paramMap.get('tourId'));

      if (!Number.isInteger(tourId) || tourId < 1) {
        this.tourVm.markInvalidTour();
        return;
      }

      this.tourVm.loadTour(tourId);
    });
  }
}
