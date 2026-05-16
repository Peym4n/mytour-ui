import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { TourDetailViewModel } from './tour-detail-view-model.service';

@Component({
  selector: 'app-tour-detail',
  imports: [RouterLink, ButtonModule, TagModule],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly tourVm = inject(TourDetailViewModel);

  ngOnInit(): void {
    const tourId = Number(this.route.snapshot.paramMap.get('tourId'));

    if (!Number.isInteger(tourId) || tourId < 1) {
      this.tourVm.markInvalidTour();
      return;
    }

    this.tourVm.loadTour(tourId);
  }
}
