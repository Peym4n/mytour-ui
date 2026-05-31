import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import {
  formatDifficulty,
  formatDistance,
  formatDuration,
  formatLogCount,
  formatWeather,
  routeLabel,
  transportLabel,
  transportSeverity
} from './tour-display';

describe('tour display helpers', () => {
  it('formats distances and durations for compact tour display', () => {
    expect(formatDistance(undefined)).toBe('n/a');
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(12_400)).toBe('12 km');
    expect(formatDuration(undefined)).toBe('n/a');
    expect(formatDuration(45)).toBe('1 min');
    expect(formatDuration(7_500)).toBe('2 h 5 min');
  });

  it('maps transport values to labels and tag severities', () => {
    expect(transportLabel('BIKE')).toBe('Bike');
    expect(transportSeverity('BIKE')).toBe('info');
    expect(transportLabel('VACATION')).toBe('Vacation');
    expect(transportSeverity(undefined)).toBe('contrast');
  });

  it('formats log metadata without exposing missing values as undefined', () => {
    const log: TourLogDto = {
      difficulty: 3,
      weather: {
        temperatureC: 21.25,
        weatherDescription: 'clear sky',
        windSpeedKmh: 8.5
      }
    };

    expect(formatDifficulty(log.difficulty)).toBe('3/5, moderate');
    expect(formatWeather(log)).toBe('21.3 deg C, clear sky, 8.5 km/h wind');
    expect(formatWeather({})).toBe('No weather snapshot');
  });

  it('formats tour summary labels with stable fallbacks', () => {
    expect(formatLogCount({ computedAttributes: { logCount: 1 } })).toBe('1 log');
    expect(formatLogCount({ computedAttributes: { logCount: 4 } })).toBe('4 logs');
    expect(routeLabel({ startLocation: 'Vienna', endLocation: 'Graz' })).toBe('Vienna to Graz');
    expect(routeLabel({})).toBe('Unknown start to unknown destination');
  });
});
