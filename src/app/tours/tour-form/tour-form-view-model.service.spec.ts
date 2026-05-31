import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CreateTourRequest } from '../../api/generated/models/create-tour-request';
import { ToursService } from '../../api/generated/services/tours.service';
import { TourFormViewModel } from './tour-form-view-model.service';

describe('TourFormViewModel', () => {
  let toursApi: {
    getTour: ReturnType<typeof vi.fn>;
    createTour: ReturnType<typeof vi.fn>;
    updateTour: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toursApi = {
      getTour: vi.fn(),
      createTour: vi.fn(),
      updateTour: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TourFormViewModel,
        { provide: ToursService, useValue: toursApi },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('marks invalid forms and does not call the API', () => {
    const viewModel = TestBed.inject(TourFormViewModel);
    viewModel.initializeCreate();

    viewModel.submit();

    expect(viewModel.errorMessage()).toBe('Please fix the highlighted fields before saving.');
    expect(toursApi.createTour).not.toHaveBeenCalled();
  });

  it('trims and maps create form values into the generated API request', async () => {
    toursApi.createTour.mockReturnValue(of({ id: 42 }));
    const viewModel = TestBed.inject(TourFormViewModel);
    viewModel.initializeCreate();
    viewModel.form.setValue({
      name: '  City loop  ',
      description: '  Easy evening ride  ',
      startLocation: '  Vienna  ',
      endLocation: '  Prater  ',
      transportType: 'BIKE',
      timezoneId: '  Europe/Vienna  ',
      startLatitude: 48.2082,
      startLongitude: 16.3738,
      endLatitude: 48.2167,
      endLongitude: 16.395
    });

    viewModel.submit();
    await flushPromises();

    const expectedBody: CreateTourRequest = {
      name: 'City loop',
      description: 'Easy evening ride',
      startLocation: 'Vienna',
      endLocation: 'Prater',
      transportType: 'BIKE',
      timezoneId: 'Europe/Vienna',
      startCoordinate: {
        latitude: 48.2082,
        longitude: 16.3738
      },
      endCoordinate: {
        latitude: 48.2167,
        longitude: 16.395
      }
    };
    expect(toursApi.createTour).toHaveBeenCalledWith({ body: expectedBody });
    expect(router.navigate).toHaveBeenCalledWith(['/tours', 42]);
  });

  it('exposes mode-specific labels as derived state', () => {
    const viewModel = TestBed.inject(TourFormViewModel);

    viewModel.initializeCreate();
    expect(viewModel.pageTitle()).toBe('New tour');
    expect(viewModel.submitLabel()).toBe('Create tour');

    toursApi.getTour.mockReturnValue(of({
      id: 5,
      name: 'Existing tour',
      startLocation: 'A',
      endLocation: 'B',
      transportType: 'HIKE',
      timezoneId: 'Europe/Vienna'
    }));
    viewModel.initializeEdit(5);

    expect(viewModel.pageTitle()).toBe('Edit tour');
    expect(viewModel.submitLabel()).toBe('Save changes');
  });
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
