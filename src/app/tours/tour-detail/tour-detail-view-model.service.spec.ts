import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourLogWeatherDto } from '../../api/generated/models/tour-log-weather-dto';
import { TourLogsService } from '../../api/generated/services/tour-logs.service';
import { ToursService } from '../../api/generated/services/tours.service';
import { TourDetailViewModel } from './tour-detail-view-model.service';

describe('TourDetailViewModel', () => {
  let toursApi: {
    getTour: ReturnType<typeof vi.fn>;
    deleteTour: ReturnType<typeof vi.fn>;
  };
  let tourLogsApi: {
    listLogs: ReturnType<typeof vi.fn>;
    deleteLog: ReturnType<typeof vi.fn>;
    refreshWeather: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toursApi = {
      getTour: vi.fn(),
      deleteTour: vi.fn()
    };
    tourLogsApi = {
      listLogs: vi.fn(),
      deleteLog: vi.fn(),
      refreshWeather: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TourDetailViewModel,
        { provide: ToursService, useValue: toursApi },
        { provide: TourLogsService, useValue: tourLogsApi },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    });
  });

  it('exposes weather snapshot details for loaded tour logs', async () => {
    toursApi.getTour.mockReturnValue(of(tour()));
    tourLogsApi.listLogs.mockReturnValue(of([
      log({
        provider: 'OPEN_METEO',
        providerDataset: 'historical-hourly',
        lookupCoordinate: { latitude: 48.253, longitude: 16.38 },
        weatherObservedAt: '2026-05-10T18:00:00Z',
        temperatureC: 18.6,
        relativeHumidityPercent: 52,
        precipitationMm: 0,
        weatherDescription: 'clear sky',
        windSpeedKmh: 11.2,
        fetchedAt: '2026-05-10T18:00:30Z'
      })
    ]));

    const viewModel = TestBed.inject(TourDetailViewModel);
    viewModel.loadTour(1);
    await flushPromises();

    expect(viewModel.logRows()).toEqual([
      expect.objectContaining({
        weather: '18.6 deg C, clear sky, 11.2 km/h wind',
        weatherSnapshot: expect.objectContaining({
          provider: 'OPEN_METEO',
          dataset: 'historical-hourly',
          observedAt: expect.stringContaining('10 May 2026'),
          fetchedAt: expect.stringContaining('10 May 2026'),
          lookupCoordinate: '48.2530, 16.3800',
          humidity: '52 %',
          precipitation: '0.0 mm'
        })
      })
    ]);
  });

  it('refreshes one weather snapshot through the generated API service', async () => {
    const refreshedWeather = {
      provider: 'OPEN_METEO',
      providerDataset: 'intermediate-generated',
      weatherObservedAt: '2026-05-10T19:00:00Z',
      temperatureC: 20.1,
      windSpeedKmh: 8.4,
      weatherDescription: 'partly cloudy',
      fetchedAt: '2026-05-10T19:00:10Z'
    };
    const refreshResponse = new Subject<TourLogWeatherDto>();

    toursApi.getTour.mockReturnValue(of(tour()));
    tourLogsApi.listLogs.mockReturnValue(of([log({ temperatureC: 18.6, weatherDescription: 'clear sky' })]));
    tourLogsApi.refreshWeather.mockReturnValue(refreshResponse.asObservable());

    const viewModel = TestBed.inject(TourDetailViewModel);
    viewModel.loadTour(1);
    await flushPromises();

    viewModel.refreshWeather(1, 101);

    expect(tourLogsApi.refreshWeather).toHaveBeenCalledWith({ tourId: 1, logId: 101 });
    expect(viewModel.refreshingWeatherLogId()).toBe(101);

    refreshResponse.next(refreshedWeather);
    refreshResponse.complete();
    await flushPromises();

    expect(viewModel.refreshingWeatherLogId()).toBeNull();
    expect(viewModel.noticeMessage()).toBe('Weather snapshot refreshed.');
    expect(viewModel.logRows()[0].weatherSnapshot).toEqual(expect.objectContaining({
      provider: 'OPEN_METEO',
      summary: '20.1 deg C, partly cloudy, 8.4 km/h wind'
    }));
  });
});

function tour(): TourDetailDto {
  return {
    id: 1,
    name: 'Danube Ride',
    startLocation: 'Wien Praterstern',
    endLocation: 'Donauinsel Nord',
    transportType: 'BIKE',
    timezoneId: 'Europe/Vienna'
  };
}

function log(weather: TourLogWeatherDto): TourLogDto {
  return {
    id: 101,
    performedAt: '2026-05-10T17:45:00Z',
    comment: 'Calm evening ride.',
    difficulty: 2,
    totalDistanceM: 18_400,
    totalTimeS: 4_380,
    rating: 5,
    weather
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
