import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourLogsService } from '../../api/generated/services/tour-logs.service';
import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { ToursService } from '../../api/generated/services/tours.service';
import { INTERMEDIATE_TOUR_LOGS } from '../shared/intermediate-tour-logs';
import { INTERMEDIATE_TOUR_DETAILS } from '../shared/intermediate-tours';
import {
  formatBytes,
  formatCoordinate,
  formatDateTime,
  formatDifficulty,
  formatDistance,
  formatDuration,
  formatRating,
  formatWeather,
  routeLabel,
  TagSeverity,
  transportLabel,
  transportSeverity
} from '../shared/tour-display';

interface TourCoverImageView {
  readonly initials: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: string;
  readonly path: string;
}

interface TourRouteView {
  readonly source: string;
  readonly profile: string;
  readonly startCoordinate: string;
  readonly endCoordinate: string;
  readonly fetchedAt: string;
}

interface TourDetailView {
  readonly tour: TourDetailDto;
  readonly id: number | undefined;
  readonly name: string;
  readonly description: string;
  readonly route: string;
  readonly timezone: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly distance: string;
  readonly duration: string;
  readonly transport: {
    readonly label: string;
    readonly severity: TagSeverity;
  };
  readonly computed: {
    readonly logCount: number;
    readonly popularityLabel: string;
    readonly popularityScore: number | string;
    readonly childFriendlinessLabel: string;
    readonly childFriendlinessScore: number | string;
  };
  readonly coverImage: TourCoverImageView | null;
  readonly routeData: TourRouteView | null;
}

interface TourLogRow {
  readonly log: TourLogDto;
  readonly trackId: number | string;
  readonly id: number | undefined;
  readonly performedAtIso: string | null;
  readonly performedAt: string;
  readonly comment: string;
  readonly weather: string;
  readonly difficulty: string;
  readonly distance: string;
  readonly duration: string;
  readonly rating: string;
  readonly deleteAriaLabel: string;
}

@Injectable({
  providedIn: 'root'
})
export class TourDetailViewModel {
  private readonly toursApi = inject(ToursService);
  private readonly tourLogsApi = inject(TourLogsService);
  private readonly router = inject(Router);
  private readonly tourState = signal<TourDetailDto | null>(null);
  private readonly logsState = signal<TourLogDto[]>([]);
  private readonly loadingState = signal(false);
  private readonly logsLoadingState = signal(false);
  private readonly pendingDeleteTourState = signal(false);
  private readonly deletingTourState = signal(false);
  private readonly deletingLogIdState = signal<number | null>(null);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly logsErrorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);

  readonly tour = this.tourState.asReadonly();
  readonly logs = this.logsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly logsLoading = this.logsLoadingState.asReadonly();
  readonly pendingDeleteTour = this.pendingDeleteTourState.asReadonly();
  readonly deletingTour = this.deletingTourState.asReadonly();
  readonly deletingLogId = this.deletingLogIdState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly logsErrorMessage = this.logsErrorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();

  readonly hasCoverImage = computed(() => Boolean(this.tourState()?.coverImage));
  readonly hasRoute = computed(() => Boolean(this.tourState()?.route));
  readonly tourView = computed<TourDetailView | null>(() => {
    const tour = this.tourState();
    return tour === null ? null : this.toTourView(tour);
  });
  readonly logRows = computed(() => this.logsState().map((log) => this.toLogRow(log)));

  loadTour(tourId: number): void {
    this.loadingState.set(true);
    this.errorMessageState.set(null);
    this.logsErrorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.tourState.set(null);
    this.logsState.set([]);

    this.toursApi.getTour({ tourId }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTour(response).then((tour) => {
          if (tour === null) {
            this.useIntermediateTour(tourId);
            return;
          }

          this.tourState.set(tour);
          this.loadingState.set(false);
          this.loadLogs(tourId);
        }).catch(() => {
          this.useIntermediateTour(tourId);
        });
      },
      error: (error: unknown) => {
        if (this.shouldUseIntermediateTour(error)) {
          this.useIntermediateTour(tourId);
          return;
        }

        this.loadingState.set(false);
        this.errorMessageState.set('Tour not found.');
      }
    });
  }

  markInvalidTour(): void {
    this.tourState.set(null);
    this.logsState.set([]);
    this.loadingState.set(false);
    this.logsLoadingState.set(false);
    this.pendingDeleteTourState.set(false);
    this.deletingTourState.set(false);
    this.deletingLogIdState.set(null);
    this.noticeMessageState.set(null);
    this.errorMessageState.set('The selected tour id is invalid.');
  }

  requestDeleteTour(): void {
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.pendingDeleteTourState.set(true);
  }

  cancelDeleteTour(): void {
    this.pendingDeleteTourState.set(false);
  }

  deleteTour(tourId: number | undefined): void {
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);

    if (!this.isPositiveInteger(tourId)) {
      this.errorMessageState.set('The selected tour id is invalid.');
      return;
    }

    this.deletingTourState.set(true);

    this.toursApi.deleteTour({ tourId }).pipe(take(1)).subscribe({
      next: () => {
        this.pendingDeleteTourState.set(false);
        this.deletingTourState.set(false);
        void this.router.navigate(['/tours']);
      },
      error: () => {
        this.deletingTourState.set(false);
        this.errorMessageState.set('The tour could not be deleted. Please check the backend connection.');
      }
    });
  }

  deleteLog(tourId: number | undefined, logId: number | undefined): void {
    this.logsErrorMessageState.set(null);
    this.noticeMessageState.set(null);

    if (!this.isPositiveInteger(tourId) || !this.isPositiveInteger(logId)) {
      this.logsErrorMessageState.set('The selected tour log id is invalid.');
      return;
    }

    this.deletingLogIdState.set(logId);

    this.tourLogsApi.deleteLog({ tourId, logId }).pipe(take(1)).subscribe({
      next: () => {
        this.removeLog(logId);
        this.deletingLogIdState.set(null);
        this.noticeMessageState.set('Tour log deleted.');
      },
      error: (error: unknown) => {
        if (this.shouldUseIntermediateTour(error)) {
          this.removeLog(logId);
          this.deletingLogIdState.set(null);
          this.noticeMessageState.set('Backend unavailable. Removed this log from the intermediate view only.');
          return;
        }

        this.deletingLogIdState.set(null);
        this.logsErrorMessageState.set('Tour log could not be deleted.');
      }
    });
  }

  private useIntermediateTour(tourId: number): void {
    const fallbackTour = INTERMEDIATE_TOUR_DETAILS.find((tour) => tour.id === tourId) ?? null;

    this.tourState.set(fallbackTour);
    this.loadingState.set(false);

    if (fallbackTour === null) {
      this.noticeMessageState.set(null);
      this.errorMessageState.set('Tour not found.');
      return;
    }

    this.noticeMessageState.set('The tour backend is not available yet. Showing intermediate tour data.');
    this.useIntermediateLogs(tourId);
  }

  private loadLogs(tourId: number): void {
    this.logsLoadingState.set(true);
    this.logsErrorMessageState.set(null);

    this.tourLogsApi.listLogs({ tourId }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveLogs(response).then((logs) => {
          if (logs === null) {
            this.useIntermediateLogs(tourId);
            return;
          }

          this.logsState.set(this.sortLogs(logs));
          this.logsLoadingState.set(false);
        }).catch(() => {
          this.useIntermediateLogs(tourId);
        });
      },
      error: (error: unknown) => {
        if (this.shouldUseIntermediateTour(error)) {
          this.useIntermediateLogs(tourId);
          return;
        }

        this.logsLoadingState.set(false);
        this.logsErrorMessageState.set('Tour logs could not be loaded.');
      }
    });
  }

  private useIntermediateLogs(tourId: number): void {
    this.logsState.set(this.sortLogs(INTERMEDIATE_TOUR_LOGS[tourId] ?? []));
    this.logsLoadingState.set(false);
    this.logsErrorMessageState.set(null);
  }

  private shouldUseIntermediateTour(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 0 || error.status === 501);
  }

  private async resolveTour(response: unknown): Promise<TourDetailDto | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return null;
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return this.extractTour(parsedResponse);
    }

    return this.extractTour(response);
  }

  private async resolveLogs(response: unknown): Promise<TourLogDto[] | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return [];
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return this.extractLogs(parsedResponse);
    }

    return this.extractLogs(response);
  }

  private extractTour(response: unknown): TourDetailDto | null {
    if (!this.isRecord(response)) {
      return null;
    }

    return response;
  }

  private extractLogs(response: unknown): TourLogDto[] | null {
    return Array.isArray(response) ? response.filter(this.isTourLog) : null;
  }

  private isTourLog(value: unknown): value is TourLogDto {
    return typeof value === 'object' && value !== null;
  }

  private sortLogs(logs: TourLogDto[]): TourLogDto[] {
    return [...logs].sort((left, right) => {
      const leftTime = left.performedAt ? new Date(left.performedAt).getTime() : 0;
      const rightTime = right.performedAt ? new Date(right.performedAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }

  private removeLog(logId: number): void {
    this.logsState.update((logs) => logs.filter((log) => log.id !== logId));
  }

  private isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toTourView(tour: TourDetailDto): TourDetailView {
    const coverImage = tour.coverImage;
    const route = tour.route;

    return {
      tour,
      id: tour.id,
      name: tour.name || 'Untitled tour',
      description: tour.description || 'No description stored.',
      route: routeLabel(tour),
      timezone: tour.timezoneId || 'n/a',
      createdAt: formatDateTime(tour.createdAt),
      updatedAt: formatDateTime(tour.updatedAt),
      distance: formatDistance(tour.plannedDistanceM),
      duration: formatDuration(tour.estimatedDurationS),
      transport: {
        label: transportLabel(tour.transportType),
        severity: transportSeverity(tour.transportType)
      },
      computed: {
        logCount: tour.computedAttributes?.logCount ?? 0,
        popularityLabel: tour.computedAttributes?.popularityLabel || 'n/a',
        popularityScore: tour.computedAttributes?.popularityScore ?? 'n/a',
        childFriendlinessLabel: tour.computedAttributes?.childFriendlinessLabel || 'n/a',
        childFriendlinessScore: tour.computedAttributes?.childFriendlinessScore ?? 'n/a'
      },
      coverImage: coverImage
        ? {
            initials: coverImage.originalFilename?.slice(0, 2) || 'IM',
            fileName: coverImage.originalFilename || 'n/a',
            contentType: coverImage.contentType || 'n/a',
            size: formatBytes(coverImage.sizeBytes),
            path: coverImage.path || 'n/a'
          }
        : null,
      routeData: route
        ? {
            source: route.routeSource || 'n/a',
            profile: route.routeProfile || 'n/a',
            startCoordinate: formatCoordinate(route.startCoordinate?.latitude, route.startCoordinate?.longitude),
            endCoordinate: formatCoordinate(route.endCoordinate?.latitude, route.endCoordinate?.longitude),
            fetchedAt: formatDateTime(route.routeFetchedAt)
          }
        : null
    };
  }

  private toLogRow(log: TourLogDto): TourLogRow {
    const performedAt = formatDateTime(log.performedAt);

    return {
      log,
      trackId: log.id ?? `${log.performedAt ?? 'log'}-${log.rating ?? ''}-${log.totalTimeS ?? ''}`,
      id: log.id,
      performedAtIso: log.performedAt ?? null,
      performedAt,
      comment: log.comment || 'No comment stored.',
      weather: formatWeather(log),
      difficulty: formatDifficulty(log.difficulty),
      distance: formatDistance(log.totalDistanceM),
      duration: formatDuration(log.totalTimeS),
      rating: formatRating(log.rating),
      deleteAriaLabel: `Delete log from ${performedAt}`
    };
  }
}
