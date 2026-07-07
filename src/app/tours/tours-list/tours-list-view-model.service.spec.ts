import { TestBed } from '@angular/core/testing';
import { Subject, throwError, of } from 'rxjs';

import { TourSearchResponse } from '../../api/generated/models/tour-search-response';
import { ToursService } from '../../api/generated/services/tours.service';
import { ToursListViewModel } from './tours-list-view-model.service';

describe('ToursListViewModel', () => {
  let toursApi: {
    searchTours: ReturnType<typeof vi.fn>;
    suggestTours: ReturnType<typeof vi.fn>;
    deleteTour: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toursApi = {
      searchTours: vi.fn(),
      suggestTours: vi.fn().mockReturnValue(of([])),
      deleteTour: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ToursListViewModel,
        { provide: ToursService, useValue: toursApi }
      ]
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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
    toursApi.searchTours.mockReturnValue(of({
      tours: [
        {
          id: 7,
          name: 'Danube Ride',
          startLocation: 'Vienna',
          endLocation: 'Tulln',
          transportType: 'BIKE'
        }
      ]
    }));

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

  it('updates tours for the active search query after a debounce', async () => {
    vi.useFakeTimers();
    toursApi.searchTours.mockReturnValue(of({
      tours: [
        {
          id: 9,
          name: 'Family Hike',
          startLocation: 'Nussdorf',
          endLocation: 'Kahlenberg',
          transportType: 'HIKE'
        }
      ]
    }));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.setSearchQuery(' family ');

    expect(toursApi.searchTours).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    await flushPromises();

    expect(toursApi.searchTours).toHaveBeenCalledWith({ q: 'family' });
    expect(viewModel.tourRows()).toEqual([
      expect.objectContaining({
        id: 9,
        name: 'Family Hike'
      })
    ]);
    vi.useRealTimers();
  });

  it('loads selectable tour suggestions and applies a selected suggestion', async () => {
    vi.useFakeTimers();
    toursApi.searchTours.mockReturnValue(of({
      tours: [
        {
          id: 7,
          name: 'Danube Ride',
          startLocation: 'Vienna',
          endLocation: 'Tulln',
          transportType: 'BIKE'
        }
      ]
    }));
    toursApi.suggestTours.mockReturnValue(of([
      {
        tourId: 7,
        label: 'Danube Ride',
        route: 'Vienna to Tulln'
      }
    ]));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.setSearchQuery('dan');
    vi.advanceTimersByTime(180);
    await flushPromises();

    expect(toursApi.suggestTours).toHaveBeenCalledWith({ q: 'dan', limit: 6 });
    expect(viewModel.tourSuggestions()).toHaveLength(1);

    viewModel.selectSuggestion(viewModel.tourSuggestions()[0]);
    await flushPromises();

    expect(viewModel.searchQuery()).toBe('Danube Ride');
    expect(viewModel.selectedTourId()).toBe(7);
    expect(viewModel.tourSuggestions()).toEqual([]);
    vi.useRealTimers();
  });


  it('refreshes immediately when the transport filter changes', async () => {
    toursApi.searchTours.mockReturnValue(of({ tours: [] }));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.setTransportFilter('RUNNING');
    await flushPromises();

    expect(toursApi.searchTours).toHaveBeenCalledWith({ transportType: 'RUNNING' });
  });

  it('keeps the newest search result when an older request completes later', async () => {
    vi.useFakeTimers();
    const oldSearchResponse = new Subject<TourSearchResponse>();
    toursApi.searchTours
      .mockReturnValueOnce(oldSearchResponse.asObservable())
      .mockReturnValueOnce(of({
        tours: [
          {
            id: 2,
            name: 'Newest result',
            startLocation: 'Stadtpark',
            endLocation: 'Rathausplatz',
            transportType: 'RUNNING'
          }
        ]
      }));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.setSearchQuery('old');
    vi.advanceTimersByTime(250);
    await flushPromises();

    viewModel.setSearchQuery('newest');
    vi.advanceTimersByTime(250);
    await flushPromises();

    oldSearchResponse.next({
      tours: [
        {
          id: 1,
          name: 'Old result',
          startLocation: 'Wien',
          endLocation: 'Tulln',
          transportType: 'BIKE'
        }
      ]
    });
    oldSearchResponse.complete();
    await flushPromises();

    expect(toursApi.searchTours).toHaveBeenNthCalledWith(1, { q: 'old' });
    expect(toursApi.searchTours).toHaveBeenNthCalledWith(2, { q: 'newest' });
    expect(viewModel.tourRows()).toEqual([
      expect.objectContaining({
        id: 2,
        name: 'Newest result'
      })
    ]);
    vi.useRealTimers();
  });

  it('shows an error message when the backend is unavailable', async () => {
    toursApi.searchTours.mockReturnValue(throwError(() => new Error('offline')));

    const viewModel = TestBed.inject(ToursListViewModel);
    viewModel.loadTours();
    await flushPromises();

    expect(viewModel.loading()).toBe(false);
    expect(viewModel.errorMessage()).toContain('could not be loaded');
    expect(viewModel.tourRows()).toHaveLength(0);
  });
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
