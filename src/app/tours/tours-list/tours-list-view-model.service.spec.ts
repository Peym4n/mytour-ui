import { TestBed } from '@angular/core/testing';
import { throwError, of } from 'rxjs';

import { TourSearchResponse } from '../../api/generated/models/tour-search-response';
import { ToursService } from '../../api/generated/services/tours.service';
import { ToursListViewModel } from './tours-list-view-model.service';

describe('ToursListViewModel', () => {
  let toursApi: {
    searchTours: ReturnType<typeof vi.fn>;
    deleteTour: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toursApi = {
      searchTours: vi.fn(),
      deleteTour: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ToursListViewModel,
        { provide: ToursService, useValue: toursApi }
      ]
    });
  });

  it('loads tours from the generated API and exposes computed display rows', async () => {
    const response: TourSearchResponse = {
      tours: [
        {
          id: 7,
          name: 'Danube Ride',
          startLocation: 'Vienna',
          endLocation: 'Tulln',
          plannedDistanceM: 41_200,
          estimatedDurationS: 8_100,
          transportType: 'BIKE',
          computedAttributes: {
            logCount: 2,
            popularityLabel: 'rarely used',
            childFriendlinessLabel: 'family friendly'
          }
        }
      ]
    };
    toursApi.searchTours.mockReturnValue(of(response));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.loadTours();
    await flushPromises();

    expect(toursApi.searchTours).toHaveBeenCalledWith(undefined);
    expect(viewModel.dataSource()).toBe('api');
    expect(viewModel.selectedTourId()).toBe(7);
    expect(viewModel.tourRows()).toEqual([
      expect.objectContaining({
        id: 7,
        name: 'Danube Ride',
        route: 'Vienna to Tulln',
        distance: '41 km',
        duration: '2 h 15 min',
        logCount: '2 logs',
        popularity: 'rarely used',
        childFriendliness: 'family friendly',
        transport: { label: 'Bike', severity: 'info' }
      })
    ]);
  });

  it('passes active filters as structured API parameters', async () => {
    toursApi.searchTours.mockReturnValue(of({ tours: [] }));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.setSearchQuery(' family ');
    viewModel.setTransportFilter('HIKE');
    viewModel.applyFilters();
    await flushPromises();

    expect(toursApi.searchTours).toHaveBeenCalledWith({
      q: 'family',
      transportType: 'HIKE'
    });
    expect(viewModel.hasFilters()).toBe(true);
  });

  it('falls back to intermediate tours when the backend is unavailable', async () => {
    toursApi.searchTours.mockReturnValue(throwError(() => new Error('offline')));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.loadTours();
    await flushPromises();

    expect(viewModel.dataSource()).toBe('intermediate');
    expect(viewModel.noticeMessage()).toContain('tour backend is not available');
    expect(viewModel.loading()).toBe(false);
    expect(viewModel.tourRows().length).toBeGreaterThan(0);
  });
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
