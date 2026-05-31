import { computed, inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';

import { SearchTours$Params } from '../../api/generated/fn/tours/search-tours';
import { ToursService } from '../../api/generated/services/tours.service';
import { TourSummaryDto } from '../../api/generated/models/tour-summary-dto';
import { INTERMEDIATE_TOUR_DETAILS, toTourSummary } from '../shared/intermediate-tours';
import {
  formatDistance,
  formatDuration,
  formatLogCount,
  routeLabel,
  TagSeverity,
  TourTransportType,
  transportLabel,
  transportSeverity
} from '../shared/tour-display';

export type TourTransportFilter = TourTransportType | '';
type TourDataSource = 'api' | 'intermediate';

const INTERMEDIATE_TOURS = INTERMEDIATE_TOUR_DETAILS.map(toTourSummary);

export interface TourListRow {
  readonly tour: TourSummaryDto;
  readonly trackId: number | string;
  readonly id: number | undefined;
  readonly name: string;
  readonly route: string;
  readonly distance: string;
  readonly duration: string;
  readonly logCount: string;
  readonly popularity: string;
  readonly childFriendliness: string;
  readonly coverImage: {
    readonly initials: string;
    readonly label: string;
    readonly hasImage: boolean;
  };
  readonly transport: {
    readonly label: string;
    readonly severity: TagSeverity;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToursListViewModel {
  private readonly toursApi = inject(ToursService);
  private readonly localToursState = signal<TourSummaryDto[]>(INTERMEDIATE_TOURS);
  private readonly toursState = signal<TourSummaryDto[]>([]);
  private readonly selectedTourIdState = signal<number | null>(null);
  private readonly pendingDeleteIdState = signal<number | null>(null);
  private readonly searchQueryState = signal('');
  private readonly transportFilterState = signal<TourTransportFilter>('');
  private readonly loadingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);
  private readonly dataSourceState = signal<TourDataSource>('api');

  readonly tours = this.toursState.asReadonly();
  readonly selectedTourId = this.selectedTourIdState.asReadonly();
  readonly pendingDeleteId = this.pendingDeleteIdState.asReadonly();
  readonly searchQuery = this.searchQueryState.asReadonly();
  readonly transportFilter = this.transportFilterState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();
  readonly dataSource = this.dataSourceState.asReadonly();

  readonly transportOptions: ReadonlyArray<{ label: string; value: TourTransportFilter }> = [
    { label: 'All types', value: '' },
    { label: 'Bike', value: 'BIKE' },
    { label: 'Hike', value: 'HIKE' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Vacation', value: 'VACATION' }
  ];

  readonly tourRows = computed(() => this.toursState().map((tour) => this.toTourRow(tour)));

  readonly selectedTour = computed<TourListRow | null>(() => {
    const selectedId = this.selectedTourIdState();
    if (selectedId === null) {
      return null;
    }

    return this.tourRows().find((tour) => tour.id === selectedId) ?? null;
  });

  readonly pendingDeleteTour = computed<TourListRow | null>(() => {
    const pendingId = this.pendingDeleteIdState();
    if (pendingId === null) {
      return null;
    }

    return this.tourRows().find((tour) => tour.id === pendingId) ?? null;
  });

  readonly hasFilters = computed(
    () => this.searchQueryState().trim().length > 0 || this.transportFilterState() !== ''
  );

  readonly visibleTourCount = computed(() => this.tourRows().length);

  loadTours(): void {
    this.loadingState.set(true);
    this.errorMessageState.set(null);
    this.pendingDeleteIdState.set(null);

    this.toursApi.searchTours(this.buildSearchParams()).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTours(response).then((tours) => {
          if (tours === null) {
            this.useIntermediateTours('The API response is not readable by the generated client yet. Showing intermediate tour data.');
            return;
          }

          this.dataSourceState.set('api');
          this.noticeMessageState.set(null);
          this.applyTours(tours);
          this.loadingState.set(false);
        }).catch(() => {
          this.useIntermediateTours('The API response is not readable by the generated client yet. Showing intermediate tour data.');
        });
      },
      error: () => {
        this.useIntermediateTours('The tour backend is not available yet. Showing intermediate tour data.');
      }
    });
  }

  setSearchQuery(query: string): void {
    this.searchQueryState.set(query);
  }

  setTransportFilter(filter: TourTransportFilter): void {
    this.transportFilterState.set(filter);
  }

  applyFilters(): void {
    this.loadTours();
  }

  clearFilters(): void {
    this.searchQueryState.set('');
    this.transportFilterState.set('');
    this.loadTours();
  }

  selectTour(tourId: number | undefined): void {
    if (typeof tourId !== 'number') {
      return;
    }

    this.selectedTourIdState.set(tourId);
    this.pendingDeleteIdState.set(null);
  }

  requestDelete(tourId: number | undefined): void {
    if (typeof tourId !== 'number') {
      return;
    }

    this.selectedTourIdState.set(tourId);
    this.pendingDeleteIdState.set(tourId);
  }

  cancelDelete(): void {
    this.pendingDeleteIdState.set(null);
  }

  deletePendingTour(): void {
    const tourId = this.pendingDeleteIdState();
    if (tourId === null) {
      return;
    }

    if (this.dataSourceState() === 'intermediate') {
      this.deleteLocalTour(tourId);
      return;
    }

    this.loadingState.set(true);
    this.errorMessageState.set(null);

    this.toursApi.deleteTour({ tourId }).pipe(take(1)).subscribe({
      next: () => {
        this.pendingDeleteIdState.set(null);
        this.noticeMessageState.set('Tour deleted.');
        this.loadTours();
      },
      error: () => {
        this.loadingState.set(false);
        this.errorMessageState.set('The tour could not be deleted. Please check the backend connection.');
      }
    });
  }

  private buildSearchParams(): SearchTours$Params | undefined {
    const query = this.searchQueryState().trim();
    const transportType = this.transportFilterState();
    const params: SearchTours$Params = {};

    if (query.length > 0) {
      params.q = query;
    }

    if (transportType !== '') {
      params.transportType = transportType;
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  private useIntermediateTours(message: string): void {
    this.dataSourceState.set('intermediate');
    this.noticeMessageState.set(message);
    this.applyTours(this.filterLocalTours());
    this.loadingState.set(false);
  }

  private deleteLocalTour(tourId: number): void {
    this.loadingState.set(true);
    this.localToursState.update((tours) => tours.filter((tour) => tour.id !== tourId));
    this.pendingDeleteIdState.set(null);
    this.noticeMessageState.set('Tour removed from the intermediate list.');
    this.applyTours(this.filterLocalTours());
    this.loadingState.set(false);
  }

  private filterLocalTours(): TourSummaryDto[] {
    const query = this.searchQueryState().trim().toLowerCase();
    const transportType = this.transportFilterState();

    return this.localToursState().filter((tour) => {
      const matchesTransport = transportType === '' || tour.transportType === transportType;
      const searchableText = [
        tour.name,
        tour.startLocation,
        tour.endLocation,
        tour.transportType,
        tour.computedAttributes?.popularityLabel,
        tour.computedAttributes?.childFriendlinessLabel
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();

      return matchesTransport && (query.length === 0 || searchableText.includes(query));
    });
  }

  private applyTours(tours: TourSummaryDto[]): void {
    this.toursState.set(tours);

    const selectedId = this.selectedTourIdState();
    if (selectedId !== null && tours.some((tour) => tour.id === selectedId)) {
      return;
    }

    this.selectedTourIdState.set(tours.find((tour) => typeof tour.id === 'number')?.id ?? null);
  }

  private async resolveTours(response: unknown): Promise<TourSummaryDto[] | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return [];
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return this.extractTours(parsedResponse);
    }

    return this.extractTours(response);
  }

  private extractTours(response: unknown): TourSummaryDto[] | null {
    if (!this.isRecord(response)) {
      return null;
    }

    if (!('tours' in response)) {
      return null;
    }

    const tours = response['tours'];
    if (typeof tours === 'undefined') {
      return [];
    }

    return Array.isArray(tours) ? tours.filter((tour) => this.isTourSummary(tour)) : null;
  }

  private isTourSummary(value: unknown): value is TourSummaryDto {
    return this.isRecord(value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toTourRow(tour: TourSummaryDto): TourListRow {
    return {
      tour,
      trackId: tour.id ?? `${tour.name ?? 'tour'}-${tour.startLocation ?? ''}-${tour.endLocation ?? ''}`,
      id: tour.id,
      name: tour.name || 'Untitled tour',
      route: routeLabel(tour),
      distance: formatDistance(tour.plannedDistanceM),
      duration: formatDuration(tour.estimatedDurationS),
      logCount: formatLogCount(tour),
      popularity: tour.computedAttributes?.popularityLabel || 'n/a',
      childFriendliness: tour.computedAttributes?.childFriendlinessLabel || 'n/a',
      coverImage: {
        initials: this.imageInitials(tour.name),
        label: tour.coverImage?.originalFilename || 'No cover image',
        hasImage: Boolean(tour.coverImage)
      },
      transport: {
        label: transportLabel(tour.transportType),
        severity: transportSeverity(tour.transportType)
      }
    };
  }

  private imageInitials(name: string | undefined): string {
    const words = (name || 'Tour')
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('') || 'T';
  }
}
