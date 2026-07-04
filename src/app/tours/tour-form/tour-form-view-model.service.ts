import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, from, map, of, Subject, switchMap, take } from 'rxjs';

import { CreateTourRequest } from '../../api/generated/models/create-tour-request';
import { LocationSuggestionDto } from '../../api/generated/models/location-suggestion-dto';
import { TimezoneSuggestionDto } from '../../api/generated/models/timezone-suggestion-dto';
import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { ToursService } from '../../api/generated/services/tours.service';
import { UpdateTourRequest } from '../../api/generated/models/update-tour-request';
import { INTERMEDIATE_TOUR_DETAILS } from '../shared/intermediate-tours';

type TourTransportType = CreateTourRequest['transportType'];
type TourFormMode = 'create' | 'edit';
type LocationField = 'start' | 'end';
type TourFormControlName =
  | 'name'
  | 'description'
  | 'startLocation'
  | 'endLocation'
  | 'transportType'
  | 'timezoneId'
  | 'startLatitude'
  | 'startLongitude'
  | 'endLatitude'
  | 'endLongitude';

@Injectable({
  providedIn: 'root'
})
export class TourFormViewModel {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toursApi = inject(ToursService);
  private readonly router = inject(Router);
  private readonly modeState = signal<TourFormMode>('create');
  private readonly tourIdState = signal<number | null>(null);
  private readonly versionState = signal<number>(1);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly noticeMessageState = signal<string | null>(null);
  private readonly startLocationSuggestionsState = signal<LocationSuggestionDto[]>([]);
  private readonly endLocationSuggestionsState = signal<LocationSuggestionDto[]>([]);
  private readonly timezoneSuggestionsState = signal<TimezoneSuggestionDto[]>([]);
  private readonly selectedCoverFileState = signal<File | null>(null);
  private readonly locationSuggestionRequests = new Subject<{ field: LocationField; query: string }>();
  private readonly timezoneSuggestionRequests = new Subject<string>();

  readonly mode = this.modeState.asReadonly();
  readonly tourId = this.tourIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly noticeMessage = this.noticeMessageState.asReadonly();
  readonly startLocationSuggestions = this.startLocationSuggestionsState.asReadonly();
  readonly endLocationSuggestions = this.endLocationSuggestionsState.asReadonly();
  readonly timezoneSuggestions = this.timezoneSuggestionsState.asReadonly();
  readonly selectedCoverFile = this.selectedCoverFileState.asReadonly();
  readonly pageTitle = computed(() => this.modeState() === 'create' ? 'New tour' : 'Edit tour');
  readonly submitLabel = computed(() => this.modeState() === 'create' ? 'Create tour' : 'Save changes');
  readonly coverFileLabel = computed(() => this.selectedCoverFileState()?.name ?? 'No image selected');

  readonly transportOptions: ReadonlyArray<{ label: string; value: TourTransportType }> = [
    { label: 'Bike', value: 'BIKE' },
    { label: 'Hike', value: 'HIKE' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Vacation', value: 'VACATION' }
  ];

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(5000)]],
    startLocation: ['', [Validators.required, Validators.maxLength(255)]],
    endLocation: ['', [Validators.required, Validators.maxLength(255)]],
    transportType: ['BIKE' as TourTransportType, [Validators.required]],
    timezoneId: ['Europe/Vienna', [Validators.required, Validators.maxLength(64)]],
    startLatitude: [48.2082, [Validators.required, Validators.min(-90), Validators.max(90)]],
    startLongitude: [16.3738, [Validators.required, Validators.min(-180), Validators.max(180)]],
    endLatitude: [48.25, [Validators.required, Validators.min(-90), Validators.max(90)]],
    endLongitude: [16.4, [Validators.required, Validators.min(-180), Validators.max(180)]]
  });

  constructor() {
    this.locationSuggestionRequests.pipe(
      debounceTime(200),
      switchMap((request) => this.fetchLocationSuggestions(request.field, request.query)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ field, suggestions }) => {
      if (field === 'start') {
        this.startLocationSuggestionsState.set(suggestions);
      } else {
        this.endLocationSuggestionsState.set(suggestions);
      }
    });

    this.timezoneSuggestionRequests.pipe(
      debounceTime(160),
      switchMap((query) => this.fetchTimezoneSuggestions(query)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((suggestions) => {
      this.timezoneSuggestionsState.set(suggestions);
    });
  }

  initializeCreate(): void {
    this.modeState.set('create');
    this.tourIdState.set(null);
    this.versionState.set(1);
    this.loadingState.set(false);
    this.savingState.set(false);
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.clearSuggestionState();
    this.selectedCoverFileState.set(null);
    this.form.reset({
      name: '',
      description: '',
      startLocation: '',
      endLocation: '',
      transportType: 'BIKE',
      timezoneId: 'Europe/Vienna',
      startLatitude: 48.2082,
      startLongitude: 16.3738,
      endLatitude: 48.25,
      endLongitude: 16.4
    });
  }

  initializeEdit(tourId: number): void {
    this.modeState.set('edit');
    this.tourIdState.set(tourId);
    this.loadingState.set(true);
    this.savingState.set(false);
    this.errorMessageState.set(null);
    this.noticeMessageState.set(null);
    this.clearSuggestionState();
    this.selectedCoverFileState.set(null);
    this.form.reset();

    this.toursApi.getTour({ tourId }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTour(response).then((tour) => {
          if (tour === null) {
            this.useIntermediateTour(tourId);
            return;
          }

          this.patchForm(tour);
          this.loadingState.set(false);
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
    this.modeState.set('edit');
    this.tourIdState.set(null);
    this.loadingState.set(false);
    this.savingState.set(false);
    this.noticeMessageState.set(null);
    this.errorMessageState.set('The selected tour id is invalid.');
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
      this.createTour();
      return;
    }

    this.updateTour();
  }

  controlInvalid(controlName: TourFormControlName): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  controlError(controlName: TourFormControlName): string | null {
    const control = this.form.controls[controlName];

    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    const maxLengthError = control.getError('maxlength') as { requiredLength: number } | null;
    if (maxLengthError) {
      return `Use ${maxLengthError.requiredLength} characters or fewer.`;
    }

    if (control.hasError('min') || control.hasError('max')) {
      if (controlName.includes('Latitude')) {
        return 'Latitude must be between -90 and 90.';
      }

      return 'Longitude must be between -180 and 180.';
    }

    return 'The value is invalid.';
  }

  requestLocationSuggestions(field: LocationField): void {
    const control = field === 'start' ? this.form.controls.startLocation : this.form.controls.endLocation;
    this.locationSuggestionRequests.next({ field, query: control.value });
  }

  selectLocationSuggestion(field: LocationField, suggestion: LocationSuggestionDto): void {
    const coordinate = suggestion.coordinate;
    if (!suggestion.label || !coordinate) {
      return;
    }

    if (field === 'start') {
      this.form.patchValue({
        startLocation: suggestion.label,
        startLatitude: Number(coordinate.latitude),
        startLongitude: Number(coordinate.longitude),
        timezoneId: suggestion.timezoneId ?? this.form.controls.timezoneId.value
      });
      this.startLocationSuggestionsState.set([]);
      return;
    }

    this.form.patchValue({
      endLocation: suggestion.label,
      endLatitude: Number(coordinate.latitude),
      endLongitude: Number(coordinate.longitude)
    });
    this.endLocationSuggestionsState.set([]);
  }

  requestTimezoneSuggestions(): void {
    this.timezoneSuggestionRequests.next(this.form.controls.timezoneId.value);
  }

  selectTimezoneSuggestion(suggestion: TimezoneSuggestionDto): void {
    if (!suggestion.timezoneId) {
      return;
    }

    this.form.controls.timezoneId.setValue(suggestion.timezoneId);
    this.timezoneSuggestionsState.set([]);
  }

  selectCoverFile(file: File | null): void {
    this.selectedCoverFileState.set(file);
  }

  clearSelectedCoverFile(): void {
    this.selectedCoverFileState.set(null);
  }

  private createTour(): void {
    this.toursApi.createTour({ body: this.buildCreateRequest() }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTour(response).then((tour) => {
          this.uploadCoverImageIfNeeded(tour?.id ?? null);
        }).catch(() => {
          void this.router.navigate(['/tours']);
        });
      },
      error: () => {
        this.savingState.set(false);
        this.errorMessageState.set('The tour could not be created. Please check the backend connection.');
      }
    });
  }

  private updateTour(): void {
    const tourId = this.tourIdState();
    if (tourId === null) {
      this.savingState.set(false);
      this.errorMessageState.set('The selected tour id is invalid.');
      return;
    }

    this.toursApi.updateTour({ tourId, body: this.buildUpdateRequest() }).pipe(take(1)).subscribe({
      next: (response) => {
        void this.resolveTour(response).then((tour) => {
          this.uploadCoverImageIfNeeded(tour?.id ?? tourId);
        }).catch(() => {
          void this.router.navigate(['/tours', tourId]);
        });
      },
      error: () => {
        this.savingState.set(false);
        this.errorMessageState.set('The tour could not be updated. Please check the backend connection.');
      }
    });
  }

  private buildCreateRequest(): CreateTourRequest {
    const rawValue = this.form.getRawValue();

    return {
      name: rawValue.name.trim(),
      description: rawValue.description.trim(),
      startLocation: rawValue.startLocation.trim(),
      endLocation: rawValue.endLocation.trim(),
      transportType: rawValue.transportType,
      timezoneId: rawValue.timezoneId.trim(),
      startCoordinate: {
        latitude: Number(rawValue.startLatitude),
        longitude: Number(rawValue.startLongitude)
      },
      endCoordinate: {
        latitude: Number(rawValue.endLatitude),
        longitude: Number(rawValue.endLongitude)
      }
    };
  }

  private buildUpdateRequest(): UpdateTourRequest {
    return {
      ...this.buildCreateRequest(),
      version: this.versionState()
    };
  }

  private patchForm(tour: TourDetailDto): void {
    this.versionState.set(tour.version ?? 1);
    this.form.patchValue({
      name: tour.name ?? '',
      description: tour.description ?? '',
      startLocation: tour.startLocation ?? '',
      endLocation: tour.endLocation ?? '',
      transportType: tour.transportType ?? 'BIKE',
      timezoneId: tour.timezoneId ?? 'Europe/Vienna',
      startLatitude: tour.route?.startCoordinate?.latitude ?? 48.2082,
      startLongitude: tour.route?.startCoordinate?.longitude ?? 16.3738,
      endLatitude: tour.route?.endCoordinate?.latitude ?? 48.25,
      endLongitude: tour.route?.endCoordinate?.longitude ?? 16.4
    });
  }

  private uploadCoverImageIfNeeded(tourId: number | null): void {
    if (typeof tourId !== 'number') {
      void this.router.navigate(['/tours']);
      return;
    }

    const selectedCoverFile = this.selectedCoverFileState();
    if (selectedCoverFile === null) {
      void this.router.navigate(['/tours', tourId]);
      return;
    }

    this.toursApi.uploadCoverImage({
      tourId,
      body: {
        file: selectedCoverFile
      }
    }).pipe(take(1)).subscribe({
      next: () => {
        this.selectedCoverFileState.set(null);
        void this.router.navigate(['/tours', tourId]);
      },
      error: () => {
        this.savingState.set(false);
        this.errorMessageState.set('The tour was saved, but the cover image could not be uploaded.');
      }
    });
  }

  private fetchLocationSuggestions(field: LocationField, query: string) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return of({ field, suggestions: [] });
    }

    return this.toursApi.suggestLocations({ q: trimmedQuery, limit: 6 }).pipe(
      switchMap((response) => from(this.resolveArray<LocationSuggestionDto>(response)).pipe(
        map((suggestions) => ({ field, suggestions: suggestions ?? [] })),
        catchError(() => of({ field, suggestions: [] }))
      )),
      catchError(() => of({ field, suggestions: [] }))
    );
  }

  private fetchTimezoneSuggestions(query: string) {
    return this.toursApi.suggestTimezones({ q: query.trim(), limit: 8 }).pipe(
      switchMap((response) => from(this.resolveArray<TimezoneSuggestionDto>(response)).pipe(
        map((suggestions) => suggestions ?? []),
        catchError(() => of<TimezoneSuggestionDto[]>([]))
      )),
      catchError(() => of<TimezoneSuggestionDto[]>([]))
    );
  }

  private useIntermediateTour(tourId: number): void {
    const fallbackTour = INTERMEDIATE_TOUR_DETAILS.find((tour) => tour.id === tourId) ?? null;
    this.loadingState.set(false);

    if (fallbackTour === null) {
      this.noticeMessageState.set(null);
      this.errorMessageState.set('Tour not found.');
      return;
    }

    this.patchForm(fallbackTour);
    this.noticeMessageState.set('The tour backend is not available yet. Editing intermediate tour data.');
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

  private async resolveArray<T>(response: unknown): Promise<T[] | null> {
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

  private extractTour(response: unknown): TourDetailDto | null {
    if (!this.isRecord(response)) {
      return null;
    }

    return response;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private clearSuggestionState(): void {
    this.startLocationSuggestionsState.set([]);
    this.endLocationSuggestionsState.set([]);
    this.timezoneSuggestionsState.set([]);
  }
}
