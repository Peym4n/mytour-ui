import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourLogWeatherDto } from '../../api/generated/models/tour-log-weather-dto';

export const INTERMEDIATE_TOUR_LOGS: Record<number, TourLogDto[]> = {
  1: [
    log(101, 1, '2026-05-10T17:45:00Z', 'Calm evening ride, light wind, good route for beginners.', 2, 18400, 4380, 5, weather(101, '2026-05-10T18:00:00Z', 18.6, 52, 0, 'clear sky', 11.2)),
    log(102, 1, '2026-05-12T18:10:00Z', 'Short stop at the river, still easy to keep a steady pace.', 2, 18150, 4260, 4, weather(102, '2026-05-12T18:00:00Z', 17.9, 58, 0, 'partly cloudy', 9.4)),
    log(103, 1, '2026-05-15T17:30:00Z', 'A bit crowded near the station, but the island section was excellent.', 3, 18300, 4560, 4, weather(103, '2026-05-15T18:00:00Z', 20.1, 49, 0, 'clear sky', 8.1))
  ],
  2: [
    log(201, 2, '2026-05-03T05:45:00Z', 'Steady climb before sunrise. Great view, but not ideal for small children.', 4, 7900, 8580, 5, weather(201, '2026-05-03T06:00:00Z', 9.8, 67, 0, 'cloudy', 13))
  ],
  3: [
    log(301, 3, '2026-05-02T11:50:00Z', 'Fast lunch run with little waiting at crossings.', 3, 5100, 1760, 4),
    log(302, 3, '2026-05-05T12:05:00Z', 'Good pacing loop; Rathausplatz was busy.', 3, 5200, 1810, 4),
    log(303, 3, '2026-05-08T12:15:00Z', 'Warm day, took it slightly slower through the inner city.', 4, 5050, 1900, 3, weather(303, '2026-05-08T12:00:00Z', 23.4, 45, 0, 'clear sky', 6.6)),
    log(304, 3, '2026-05-12T11:40:00Z', 'Best time so far. Route is now easy to follow.', 3, 5120, 1710, 5),
    log(305, 3, '2026-05-15T12:10:00Z', 'Short detour near Stadtpark, still a useful workday route.', 3, 5300, 1880, 4, weather(305, '2026-05-15T12:00:00Z', 21.8, 51, 0, 'partly cloudy', 7.3))
  ],
  4: []
};

function log(
  id: number,
  tourId: number,
  performedAt: string,
  comment: string,
  difficulty: number,
  totalDistanceM: number,
  totalTimeS: number,
  rating: number,
  weather?: TourLogWeatherDto
): TourLogDto {
  return {
    id,
    tourId,
    performedAt,
    comment,
    difficulty,
    totalDistanceM,
    totalTimeS,
    rating,
    weather,
    createdAt: performedAt,
    updatedAt: performedAt,
    version: 1
  };
}

function weather(
  tourLogId: number,
  weatherObservedAt: string,
  temperatureC: number,
  relativeHumidityPercent: number,
  precipitationMm: number,
  weatherDescription: string,
  windSpeedKmh: number
): TourLogWeatherDto {
  return {
    tourLogId,
    provider: 'OPEN_METEO',
    providerDataset: 'historical-hourly',
    lookupCoordinate: { latitude: 48.253, longitude: 16.3801 },
    weatherObservedAt,
    temperatureC,
    relativeHumidityPercent,
    precipitationMm,
    weatherCode: 0,
    weatherDescription,
    windSpeedKmh,
    fetchedAt: weatherObservedAt
  };
}
