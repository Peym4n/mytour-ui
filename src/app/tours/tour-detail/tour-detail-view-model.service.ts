import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';

import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourLogsService } from '../../api/generated/services/tour-logs.service';
import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { ToursService } from '../../api/generated/services/tours.service';
import { INTERMEDIATE_TOUR_LOGS } from '../shared/intermediate-tour-logs';
import { INTERMEDIATE_TOUR_DETAILS } from '../shared/intermediate-tours';

type TourTransportType = NonNullable<TourDetailDto['transportType']>;
type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Injectable({
  providedIn: 'root'
})
export class TourDetailViewModel {
  private readonly toursApi = inject(ToursService);
  private readonly tourLogsApi = inject(TourLogsService);
  private readonly tourState = signal<TourDetailDto | null>(null);
  private readonly logsState = signal<TourLogDto[]>([]);
  private readonly loadingState = signal(false);
  private readonly logsLoadingState = signal(false);
  private readonly deletingLogIdState = signal<number | null>(null);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly logsErrorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);

  readonly tour = this.tourState.asReadonly();
  readonly logs = this.logsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly logsLoading = this.logsLoadingState.asReadonly();
  readonly deletingLogId = this.deletingLogIdState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly logsErrorMessage = this.logsErrorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();

  readonly hasCoverImage = computed(() => Boolean(this.tourState()?.coverImage));
  readonly hasRoute = computed(() => Boolean(this.tourState()?.route));

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
    this.deletingLogIdState.set(null);
    this.noticeMessageState.set(null);
    this.errorMessageState.set('The selected tour id is invalid.');
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

  formatDistance(distanceM: number | undefined): string {
    if (typeof distanceM !== 'number') {
      return 'n/a';
    }

    if (distanceM < 1000) {
      return `${Math.round(distanceM)} m`;
    }

    const kilometers = distanceM / 1000;
    return `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`;
  }

  formatDuration(durationS: number | undefined): string {
    if (typeof durationS !== 'number') {
      return 'n/a';
    }

    const totalMinutes = Math.max(1, Math.round(durationS / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${minutes} min`;
  }

  formatBytes(sizeBytes: number | undefined): string {
    if (typeof sizeBytes !== 'number') {
      return 'n/a';
    }

    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDateTime(value: string | undefined): string {
    if (!value) {
      return 'n/a';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'n/a';
    }

    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  formatCoordinate(latitude: number | undefined, longitude: number | undefined): string {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'n/a';
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  formatRating(rating: number | undefined): string {
    return typeof rating === 'number' ? `${rating}/5` : 'n/a';
  }

  formatDifficulty(difficulty: number | undefined): string {
    if (typeof difficulty !== 'number') {
      return 'n/a';
    }

    const label = ['very easy', 'easy', 'moderate', 'hard', 'very hard'][difficulty - 1] ?? 'unknown';
    return `${difficulty}/5, ${label}`;
  }

  formatWeather(log: TourLogDto): string {
    const weather = log.weather;
    if (!weather) {
      return 'No weather snapshot';
    }

    const temperature = typeof weather.temperatureC === 'number' ? `${weather.temperatureC.toFixed(1)} deg C` : 'n/a';
    const description = weather.weatherDescription ?? 'weather recorded';
    const wind = typeof weather.windSpeedKmh === 'number' ? `${weather.windSpeedKmh.toFixed(1)} km/h wind` : 'wind n/a';

    return `${temperature}, ${description}, ${wind}`;
  }

  transportLabel(type: TourTransportType | undefined): string {
    switch (type) {
      case 'BIKE':
        return 'Bike';
      case 'HIKE':
        return 'Hike';
      case 'RUNNING':
        return 'Running';
      case 'VACATION':
        return 'Vacation';
      default:
        return 'Unknown';
    }
  }

  transportSeverity(type: TourTransportType | undefined): TagSeverity {
    switch (type) {
      case 'BIKE':
        return 'info';
      case 'HIKE':
        return 'success';
      case 'RUNNING':
        return 'warn';
      case 'VACATION':
        return 'secondary';
      default:
        return 'contrast';
    }
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
}
