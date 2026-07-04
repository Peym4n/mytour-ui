import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CreateTourLogRequest } from '../../api/generated/models/create-tour-log-request';
import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { UpdateTourLogRequest } from '../../api/generated/models/update-tour-log-request';
import { TourLogsService } from '../../api/generated/services/tour-logs.service';
import { TourLogFormViewModel } from './tour-log-form-view-model.service';

describe('TourLogFormViewModel', () => {
  let tourLogsApi: {
    getLog: ReturnType<typeof vi.fn>;
    createLog: ReturnType<typeof vi.fn>;
    updateLog: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    tourLogsApi = {
      getLog: vi.fn(),
      createLog: vi.fn(),
      updateLog: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TourLogFormViewModel,
        { provide: TourLogsService, useValue: tourLogsApi },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('marks invalid forms and does not call the API', () => {
    const viewModel = TestBed.inject(TourLogFormViewModel);
    viewModel.initializeCreate(7);
    viewModel.form.patchValue({
      performedAt: '',
      difficulty: 6
    });

    viewModel.submit();

    expect(viewModel.errorMessage()).toBe('Please fix the highlighted fields before saving.');
    expect(viewModel.controlInvalid('performedAt')).toBe(true);
    expect(viewModel.controlError('difficulty')).toBe('Use a value from 1 to 5.');
    expect(tourLogsApi.createLog).not.toHaveBeenCalled();
  });

  it('trims and maps create form values into the generated API request', async () => {
    tourLogsApi.createLog.mockReturnValue(of({ id: 401 }));
    const viewModel = TestBed.inject(TourLogFormViewModel);
    viewModel.initializeCreate(7);
    viewModel.form.setValue({
      performedAt: '2026-05-10T17:45',
      comment: '  Calm evening ride  ',
      difficulty: 2,
      totalDistanceM: 18400,
      totalTimeS: 4380,
      rating: 5
    });

    viewModel.submit();
    await flushPromises();

    const expectedBody: CreateTourLogRequest = {
      performedAt: new Date('2026-05-10T17:45').toISOString(),
      comment: 'Calm evening ride',
      difficulty: 2,
      totalDistanceM: 18400,
      totalTimeS: 4380,
      rating: 5
    };
    expect(tourLogsApi.createLog).toHaveBeenCalledWith({ tourId: 7, body: expectedBody });
    expect(router.navigate).toHaveBeenCalledWith(['/tours', 7]);
  });

  it('loads an existing log and submits updates with the current version', async () => {
    tourLogsApi.getLog.mockReturnValue(of(log()));
    tourLogsApi.updateLog.mockReturnValue(of({ id: 101 }));
    const viewModel = TestBed.inject(TourLogFormViewModel);

    viewModel.initializeEdit(1, 101);
    await flushPromises();

    expect(tourLogsApi.getLog).toHaveBeenCalledWith({ tourId: 1, logId: 101 });
    expect(viewModel.loading()).toBe(false);
    expect(viewModel.pageTitle()).toBe('Edit tour log');
    expect(viewModel.form.controls.comment.value).toBe('Backend log');

    viewModel.form.patchValue({
      comment: '  Updated backend log  ',
      rating: 4
    });
    viewModel.submit();
    await flushPromises();

    const expectedBody: UpdateTourLogRequest = {
      performedAt: new Date('2026-05-10T17:45').toISOString(),
      comment: 'Updated backend log',
      difficulty: 2,
      totalDistanceM: 18400,
      totalTimeS: 4380,
      rating: 4,
      version: 3
    };
    expect(tourLogsApi.updateLog).toHaveBeenCalledWith({ tourId: 1, logId: 101, body: expectedBody });
    expect(router.navigate).toHaveBeenCalledWith(['/tours', 1]);
  });

  it('maps backend validation failures to a user-facing save error', async () => {
    tourLogsApi.createLog.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const viewModel = TestBed.inject(TourLogFormViewModel);
    viewModel.initializeCreate(7);
    viewModel.form.setValue({
      performedAt: '2026-05-10T17:45',
      comment: '',
      difficulty: 2,
      totalDistanceM: 18400,
      totalTimeS: 4380,
      rating: 5
    });

    viewModel.submit();
    await flushPromises();

    expect(viewModel.saving()).toBe(false);
    expect(viewModel.errorMessage()).toBe('The tour log values are invalid. Please check the highlighted fields.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

function log(): TourLogDto {
  return {
    id: 101,
    tourId: 1,
    performedAt: new Date('2026-05-10T17:45').toISOString(),
    comment: 'Backend log',
    difficulty: 2,
    totalDistanceM: 18400,
    totalTimeS: 4380,
    rating: 5,
    version: 3
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
