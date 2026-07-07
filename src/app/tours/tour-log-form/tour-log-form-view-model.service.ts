import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { CreateTourLogRequest } from '../../api/generated/models/create-tour-log-request';
import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { UpdateTourLogRequest } from '../../api/generated/models/update-tour-log-request';
import { TourLogsService } from '../../api/generated/services/tour-logs.service';
import { ToursService } from '../../api/generated/services/tours.service';

type TourLogFormMode = 'create' | 'edit';
type TourLogFormControlName =
  | 'performedAt'
  | 'comment'
  | 'difficulty'
  | 'totalDistanceM'
  | 'totalTimeS'
  | 'rating';

@Injectable({
  providedIn: 'root'
})
export class TourLogFormViewModel {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly tourLogsApi = inject(TourLogsService);
  private readonly toursApi = inject(ToursService);
  private readonly router = inject(Router);
  private readonly modeState = signal<TourLogFormMode>('create');
  private readonly tourIdState = signal<number | null>(null);
  private readonly logIdState = signal<number | null>(null);
  private readonly versionState = signal<number>(1);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);
  private readonly tourTimezoneIdState = signal('Europe/Vienna');
  private readonly loadedLogState = signal<TourLogDto | null>(null);

  readonly mode = this.modeState.asReadonly();
  readonly tourId = this.tourIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();
  readonly tourTimezoneId = this.tourTimezoneIdState.asReadonly();
  readonly pageTitle = computed(() => this.modeState() === 'create' ? 'New tour log' : 'Edit tour log');
  readonly submitLabel = computed(() => this.modeState() === 'create' ? 'Create log' : 'Save changes');
  readonly timezoneHint = computed(() => `Interpreted in ${this.tourTimezoneIdState()}`);
  readonly backLink = computed(() => {
    const tourId = this.tourIdState();
    return tourId === null ? ['/tours'] : ['/tours', tourId];
  });

  readonly difficultyOptions = [
    { label: '1 - Very easy', value: 1 },
    { label: '2 - Easy', value: 2 },
    { label: '3 - Moderate', value: 3 },
    { label: '4 - Hard', value: 4 },
    { label: '5 - Very hard', value: 5 }
  ] as const;

  readonly ratingOptions = [
    { label: '1 - Poor', value: 1 },
    { label: '2 - Okay', value: 2 },
    { label: '3 - Good', value: 3 },
    { label: '4 - Great', value: 4 },
    { label: '5 - Excellent', value: 5 }
  ] as const;

  readonly form = this.formBuilder.group({
    performedAt: [this.defaultPerformedAt(), [Validators.required, localDateTimeValidator()]],
    comment: ['', [Validators.maxLength(5000)]],
    difficulty: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    totalDistanceM: [5000, [Validators.required, Validators.min(0)]],
    totalTimeS: [1800, [Validators.required, Validators.min(1)]],
    rating: [4, [Validators.required, Validators.min(1), Validators.max(5)]]
  });

  initializeCreate(tourId: number): void {
    this.modeState.set('create');
    this.tourIdState.set(tourId);
    this.logIdState.set(null);
    this.versionState.set(1);
    this.loadedLogState.set(null);
    this.tourTimezoneIdState.set('Europe/Vienna');
    this.loadingState.set(false);
    this.savingState.set(false);
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.form.reset({
      performedAt: this.defaultPerformedAt(),
      comment: '',
      difficulty: 3,
      totalDistanceM: 5000,
      totalTimeS: 1800,
      rating: 4
    });
    this.loadTourTimezone(tourId);
  }

  initializeEdit(tourId: number, logId: number): void {
    this.modeState.set('edit');
    this.tourIdState.set(tourId);
    this.logIdState.set(logId);
    this.loadedLogState.set(null);
    this.tourTimezoneIdState.set('Europe/Vienna');
    this.loadingState.set(true);
    this.savingState.set(false);
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.loadTourTimezone(tourId);

    this.tourLogsApi.getLog({ tourId, logId }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveLog(response).then((log) => {
          if (log === null) {
            this.loadingState.set(false);
            this.errorMessageState.set('Tour log not found.');
            return;
          }

          this.loadedLogState.set(log);
          this.patchForm(log);
          this.loadingState.set(false);
        }).catch(() => {
          this.loadingState.set(false);
          this.errorMessageState.set('Tour log not found.');
        });
      },
      error: () => {
        this.loadingState.set(false);
        this.errorMessageState.set('Tour log not found.');
      }
    });
  }

  markInvalidRoute(tourId: number | null = null): void {
    this.tourIdState.set(tourId);
    this.logIdState.set(null);
    this.loadingState.set(false);
    this.savingState.set(false);
    this.noticeMessageState.set(null);
    this.errorMessageState.set('The selected tour log route is invalid.');
  }

  submit(): void {
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessageState.set('Please fix the highlighted fields before saving.');
      return;
    }

    this.savingState.set(true);

    if (this.modeState() === 'create') {
      this.createLog();
      return;
    }

    this.updateLog();
  }

  controlInvalid(controlName: TourLogFormControlName): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  controlError(controlName: TourLogFormControlName): string | null {
    const control = this.form.controls[controlName];

    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('localDateTime')) {
      return 'Use a valid date and time.';
    }

    const maxLengthError = control.getError('maxlength') as { requiredLength: number } | null;
    if (maxLengthError) {
      return `Use ${maxLengthError.requiredLength} characters or fewer.`;
    }

    if (control.hasError('min') || control.hasError('max')) {
      if (controlName === 'difficulty' || controlName === 'rating') {
        return 'Use a value from 1 to 5.';
      }

      if (controlName === 'totalTimeS') {
        return 'Total time must be at least 1 second.';
      }

      return 'Distance must be 0 meters or more.';
    }

    return 'The value is invalid.';
  }

  private createLog(): void {
    const tourId = this.tourIdState();
    if (tourId === null) {
      this.savingState.set(false);
      this.errorMessageState.set('The selected tour id is invalid.');
      return;
    }

    this.tourLogsApi.createLog({ tourId, body: this.buildCreateRequest() }).pipe(take(1)).subscribe({
      next: () => {
        void this.router.navigate(['/tours', tourId]);
      },
      error: (error: unknown) => {
        this.savingState.set(false);
        this.errorMessageState.set(this.saveErrorMessage(error, 'created'));
      }
    });
  }

  private updateLog(): void {
    const tourId = this.tourIdState();
    const logId = this.logIdState();
    if (tourId === null || logId === null) {
      this.savingState.set(false);
      this.errorMessageState.set('The selected tour log id is invalid.');
      return;
    }

    this.tourLogsApi.updateLog({ tourId, logId, body: this.buildUpdateRequest() }).pipe(take(1)).subscribe({
      next: () => {
        void this.router.navigate(['/tours', tourId]);
      },
      error: (error: unknown) => {
        this.savingState.set(false);
        this.errorMessageState.set(this.saveErrorMessage(error, 'updated'));
      }
    });
  }

  private buildCreateRequest(): CreateTourLogRequest {
    const rawValue = this.form.getRawValue();
    const comment = rawValue.comment.trim();

    return {
      performedAt: this.toIsoDate(rawValue.performedAt),
      comment: comment.length > 0 ? comment : undefined,
      difficulty: Number(rawValue.difficulty),
      totalDistanceM: Number(rawValue.totalDistanceM),
      totalTimeS: Number(rawValue.totalTimeS),
      rating: Number(rawValue.rating)
    };
  }

  private buildUpdateRequest(): UpdateTourLogRequest {
    return {
      ...this.buildCreateRequest(),
      version: this.versionState()
    };
  }

  private patchForm(log: TourLogDto): void {
    this.versionState.set(log.version ?? 1);
    this.form.patchValue({
      performedAt: this.toLocalInputValue(log.performedAt),
      comment: log.comment ?? '',
      difficulty: log.difficulty ?? 3,
      totalDistanceM: log.totalDistanceM ?? 0,
      totalTimeS: log.totalTimeS ?? 1,
      rating: log.rating ?? 4
    });
  }

  private loadTourTimezone(tourId: number): void {
    this.toursApi.getTour({ tourId }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTour(response).then((tour) => {
          this.applyTourTimezone(tour?.timezoneId ?? 'Europe/Vienna');
        }).catch(() => {
          this.applyTourTimezone('Europe/Vienna');
        });
      },
      error: () => {
        this.applyTourTimezone('Europe/Vienna');
      }
    });
  }

  private applyTourTimezone(timezoneId: string): void {
    this.tourTimezoneIdState.set(timezoneId || 'Europe/Vienna');
    const loadedLog = this.loadedLogState();
    if (loadedLog) {
      this.form.controls.performedAt.setValue(this.toLocalInputValue(loadedLog.performedAt));
      return;
    }

    if (this.modeState() === 'create' && !this.form.controls.performedAt.dirty) {
      this.form.controls.performedAt.setValue(this.defaultPerformedAt());
    }
  }

  private saveErrorMessage(error: unknown, action: 'created' | 'updated'): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return 'The tour log values are invalid. Please check the highlighted fields.';
    }

    return `The tour log could not be ${action}. Please check the backend connection.`;
  }

  private async resolveLog(response: unknown): Promise<TourLogDto | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return null;
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return this.extractLog(parsedResponse);
    }

    return this.extractLog(response);
  }

  private async resolveTour(response: unknown): Promise<TourDetailDto | null> {
    if (response instanceof Blob) {
      const responseText = await response.text();
      if (responseText.trim().length === 0) {
        return null;
      }

      const parsedResponse: unknown = JSON.parse(responseText);
      return this.isRecord(parsedResponse) ? parsedResponse : null;
    }

    return this.isRecord(response) ? response : null;
  }

  private extractLog(response: unknown): TourLogDto | null {
    return this.isRecord(response) ? response : null;
  }

  private toIsoDate(value: string): string {
    return zonedLocalDateTimeToIso(value, this.tourTimezoneIdState()) ?? new Date().toISOString();
  }

  private toLocalInputValue(value: string | undefined): string {
    if (!value) {
      return this.defaultPerformedAt();
    }

    return instantToLocalInputValue(value, this.tourTimezoneIdState()) ?? this.defaultPerformedAt();
  }

  private defaultPerformedAt(): string {
    return instantToLocalInputValue(new Date().toISOString(), this.tourTimezoneIdState())
      ?? new Date().toISOString().slice(0, 16);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

function zonedLocalDateTimeToIso(value: string, timezoneId: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const localAsUtcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  try {
    const firstOffset = timezoneOffsetMs(localAsUtcMs, timezoneId);
    let instantMs = localAsUtcMs - firstOffset;
    const secondOffset = timezoneOffsetMs(instantMs, timezoneId);
    if (secondOffset !== firstOffset) {
      instantMs = localAsUtcMs - secondOffset;
    }

    return new Date(instantMs).toISOString();
  } catch {
    const fallbackDate = new Date(value);
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate.toISOString();
  }
}

function instantToLocalInputValue(value: string, timezoneId: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    const parts = zonedParts(date.getTime(), timezoneId);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  }
}

function timezoneOffsetMs(instantMs: number, timezoneId: string): number {
  const parts = zonedParts(instantMs, timezoneId);
  const zonedAsUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return zonedAsUtcMs - instantMs;
}

function zonedParts(instantMs: number, timezoneId: string): Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instantMs))
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));

  return {
    year: parts['year'],
    month: parts['month'],
    day: parts['day'],
    hour: parts['hour'],
    minute: parts['minute'],
    second: parts['second']
  };
}

function localDateTimeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    return Number.isNaN(new Date(value).getTime()) ? { localDateTime: true } : null;
  };
}
