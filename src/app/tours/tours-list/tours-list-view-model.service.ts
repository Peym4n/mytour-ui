import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounce, from, map, of, Subject, switchMap, take, tap, timer } from 'rxjs';

import { SearchTours$Params } from '../../api/generated/fn/tours/search-tours';
import { DemoDataService } from '../../api/generated/services/demo-data.service';
import { ToursService } from '../../api/generated/services/tours.service';
import { TourSummaryDto } from '../../api/generated/models/tour-summary-dto';
import { TourSuggestionDto } from '../../api/generated/models/tour-suggestion-dto';
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
type TourLoadResult =
  | { readonly kind: 'api'; readonly tours: TourSummaryDto[] }
  | { readonly kind: 'error' };
type TourSuggestionResult =
  | { readonly kind: 'api'; readonly suggestions: TourSuggestionDto[] }
  | { readonly kind: 'error' };

const SEARCH_DEBOUNCE_MS = 250;
const SUGGESTION_DEBOUNCE_MS = 180;

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly toursApi = inject(ToursService);
  private readonly demoDataApi = inject(DemoDataService);
  private readonly toursState = signal<TourSummaryDto[]>([]);
  private readonly selectedTourIdState = signal<number | null>(null);
  private readonly pendingDeleteIdState = signal<number | null>(null);
  private readonly searchQueryState = signal('');
  private readonly tourSuggestionsState = signal<TourSuggestionDto[]>([]);
  private readonly transportFilterState = signal<TourTransportFilter>('');
  private readonly loadingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);
  private readonly tourLoadRequests = new Subject<number>();
  private readonly tourSuggestionRequests = new Subject<string>();

  readonly tours = this.toursState.asReadonly();
  readonly selectedTourId = this.selectedTourIdState.asReadonly();
  readonly pendingDeleteId = this.pendingDeleteIdState.asReadonly();
  readonly searchQuery = this.searchQueryState.asReadonly();
  readonly tourSuggestions = this.tourSuggestionsState.asReadonly();
  readonly transportFilter = this.transportFilterState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();

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
  readonly hasTourSuggestions = computed(() => this.tourSuggestionsState().length > 0);

  readonly visibleTourCount = computed(() => this.tourRows().length);

  private readonly seedingDemoState = signal(false);
  readonly seedingDemo = this.seedingDemoState.asReadonly();
  private readonly pendingSeedDemoState = signal(false);
  readonly pendingSeedDemo = this.pendingSeedDemoState.asReadonly();

  constructor() {
    this.tourLoadRequests.pipe(
      debounce((debounceMs) => debounceMs > 0 ? timer(debounceMs) : of(0)),
      tap(() => this.beginTourLoad()),
      switchMap(() => this.searchTours()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      this.applyLoadResult(result);
    });

    this.tourSuggestionRequests.pipe(
      debounce(() => timer(SUGGESTION_DEBOUNCE_MS)),
      switchMap((query) => this.fetchTourSuggestions(query)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      this.tourSuggestionsState.set(result.kind === 'api' ? result.suggestions : []);
    });
  }

  loadTours(): void {
    this.requestTourLoad(0);
  }

  setSearchQuery(query: string): void {
    this.searchQueryState.set(query);
    this.tourSuggestionRequests.next(query);
    this.requestTourLoad(SEARCH_DEBOUNCE_MS);
  }

  setTransportFilter(filter: TourTransportFilter): void {
    this.transportFilterState.set(filter);
    this.requestTourLoad(0);
  }

  applyFilters(): void {
    this.loadTours();
  }

  clearFilters(): void {
    this.searchQueryState.set('');
    this.tourSuggestionsState.set([]);
    this.transportFilterState.set('');
    this.loadTours();
  }

  selectSuggestion(suggestion: TourSuggestionDto): void {
    this.searchQueryState.set(suggestion.label ?? '');
    this.tourSuggestionsState.set([]);
    if (typeof suggestion.tourId === 'number') {
      this.selectedTourIdState.set(suggestion.tourId);
    }
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

  requestSeedDemo(): void {
    this.pendingSeedDemoState.set(true);
  }

  cancelSeedDemo(): void {
    this.pendingSeedDemoState.set(false);
  }

  confirmSeedDemo(): void {
    this.pendingSeedDemoState.set(false);
    this.seedingDemoState.set(true);
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);

    this.demoDataApi.seedDemoData().pipe(take(1)).subscribe({
      next: (result) => {
        this.seedingDemoState.set(false);
        this.noticeMessageState.set(
          `Demo data loaded: ${result.createdTourCount} tours and ${result.createdLogCount} logs.`
        );
        this.loadTours();
      },
      error: () => {
        this.seedingDemoState.set(false);
        this.errorMessageState.set('Demo data could not be loaded. Please check the backend connection.');
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

  private requestTourLoad(debounceMs: number): void {
    this.tourLoadRequests.next(debounceMs);
  }

  private beginTourLoad(): void {
    this.loadingState.set(true);
    this.errorMessageState.set(null);
    this.pendingDeleteIdState.set(null);
  }

  private searchTours() {
    return this.toursApi.searchTours(this.buildSearchParams()).pipe(
      switchMap((response) => from(this.resolveTours(response)).pipe(
        map((tours): TourLoadResult => {
          if (tours === null) {
            return { kind: 'error' };
          }

          return { kind: 'api', tours };
        }),
        catchError(() => of<TourLoadResult>({ kind: 'error' }))
      )),
      catchError(() => of<TourLoadResult>({ kind: 'error' }))
    );
  }

  private fetchTourSuggestions(query: string) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return of<TourSuggestionResult>({ kind: 'api', suggestions: [] });
    }

    return this.toursApi.suggestTours({ q: trimmedQuery, limit: 6 }).pipe(
      switchMap((response) => from(this.resolveSuggestions<TourSuggestionDto>(response)).pipe(
        map((suggestions): TourSuggestionResult => ({
          kind: 'api',
          suggestions: suggestions ?? []
        })),
        catchError(() => of<TourSuggestionResult>({ kind: 'error' }))
      )),
      catchError(() => of<TourSuggestionResult>({ kind: 'error' }))
    );
  }

  private applyLoadResult(result: TourLoadResult): void {
    if (result.kind === 'api') {
      this.noticeMessageState.set(null);
      this.applyTours(result.tours);
      this.loadingState.set(false);
      return;
    }

    this.applyTours([]);
    this.loadingState.set(false);
    this.errorMessageState.set('Tours could not be loaded. Please check the backend connection.');
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

  private async resolveSuggestions<T>(response: unknown): Promise<T[] | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return [];
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return Array.isArray(parsedResponse) ? parsedResponse as T[] : null;
    }

    return Array.isArray(response) ? response as T[] : null;
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
