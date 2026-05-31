import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { TourLogDto } from '../../api/generated/models/tour-log-dto';
import { TourSummaryDto } from '../../api/generated/models/tour-summary-dto';

export type TourTransportType = NonNullable<TourSummaryDto['transportType']>;
export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export function formatDistance(distanceM: number | undefined): string {
  if (typeof distanceM !== 'number') {
    return 'n/a';
  }

  if (distanceM < 1000) {
    return `${Math.round(distanceM)} m`;
  }

  const kilometers = distanceM / 1000;
  return `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`;
}

export function formatDuration(durationS: number | undefined): string {
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

export function formatBytes(sizeBytes: number | undefined): string {
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

export function formatDateTime(value: string | undefined): string {
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

export function formatCoordinate(latitude: number | undefined, longitude: number | undefined): string {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return 'n/a';
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function formatRating(rating: number | undefined): string {
  return typeof rating === 'number' ? `${rating}/5` : 'n/a';
}

export function formatDifficulty(difficulty: number | undefined): string {
  if (typeof difficulty !== 'number') {
    return 'n/a';
  }

  const label = ['very easy', 'easy', 'moderate', 'hard', 'very hard'][difficulty - 1] ?? 'unknown';
  return `${difficulty}/5, ${label}`;
}

export function formatWeather(log: TourLogDto): string {
  const weather = log.weather;
  if (!weather) {
    return 'No weather snapshot';
  }

  const temperature = typeof weather.temperatureC === 'number' ? `${weather.temperatureC.toFixed(1)} deg C` : 'n/a';
  const description = weather.weatherDescription ?? 'weather recorded';
  const wind = typeof weather.windSpeedKmh === 'number' ? `${weather.windSpeedKmh.toFixed(1)} km/h wind` : 'wind n/a';

  return `${temperature}, ${description}, ${wind}`;
}

export function formatLogCount(tour: TourSummaryDto): string {
  const logCount = tour.computedAttributes?.logCount ?? 0;
  return logCount === 1 ? '1 log' : `${logCount} logs`;
}

export function transportLabel(type: TourTransportType | undefined): string {
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

export function transportSeverity(type: TourTransportType | undefined): TagSeverity {
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

export function routeLabel(tour: Pick<TourDetailDto, 'startLocation' | 'endLocation'>): string {
  return `${tour.startLocation || 'Unknown start'} to ${tour.endLocation || 'unknown destination'}`;
}
