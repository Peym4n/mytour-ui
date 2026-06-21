import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  effect,
  input,
  signal,
  viewChild
} from '@angular/core';

import { TourRouteDto } from '../../api/generated/models/tour-route-dto';
import { LeafletMapFacade } from './leaflet-map-facade.service';

@Component({
  selector: 'app-tour-map',
  providers: [LeafletMapFacade],
  templateUrl: './tour-map.html',
  styleUrl: './tour-map.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourMapComponent implements AfterViewInit, OnDestroy {
  readonly route = input.required<TourRouteDto>();

  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');
  private readonly viewReady = signal(false);

  constructor(private readonly mapFacade: LeafletMapFacade) {
    effect(() => {
      const route = this.route();
      if (!this.viewReady()) {
        return;
      }

      void this.mapFacade.renderRoute(route);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.mapFacade.initMap(this.mapContainer().nativeElement);
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.mapFacade.destroy();
  }
}
