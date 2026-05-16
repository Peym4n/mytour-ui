import { TourDetailDto } from '../../api/generated/models/tour-detail-dto';
import { TourSummaryDto } from '../../api/generated/models/tour-summary-dto';

export const INTERMEDIATE_TOUR_DETAILS: TourDetailDto[] = [
  {
    id: 1,
    userId: 1,
    name: 'Danube Island Evening Ride',
    description: 'Easy after-work cycling route along the Danube with wide paths and a calm finish near the water.',
    startLocation: 'Wien Praterstern',
    endLocation: 'Donauinsel Nord',
    transportType: 'BIKE',
    timezoneId: 'Europe/Vienna',
    plannedDistanceM: 18200,
    estimatedDurationS: 4200,
    coverImage: {
      originalFilename: 'danube-island.jpg',
      contentType: 'image/jpeg',
      path: 'intermediate/danube-island.jpg',
      sizeBytes: 264000
    },
    route: {
      routeSource: 'OPENROUTESERVICE',
      routeProfile: 'cycling-regular',
      startCoordinate: { latitude: 48.2189, longitude: 16.3927 },
      endCoordinate: { latitude: 48.2872, longitude: 16.3674 },
      midpointCoordinate: { latitude: 48.253, longitude: 16.3801 },
      routeFetchedAt: '2026-05-10T17:30:00Z'
    },
    computedAttributes: {
      logCount: 3,
      popularityCategory: 'POPULAR',
      popularityLabel: 'popular',
      popularityScore: 68,
      childFriendlinessCategory: 'FAMILY_FRIENDLY',
      childFriendlinessLabel: 'family friendly',
      childFriendlinessScore: 88
    },
    createdAt: '2026-04-02T08:15:00Z',
    updatedAt: '2026-05-10T17:30:00Z',
    version: 1
  },
  {
    id: 2,
    userId: 1,
    name: 'Kahlenberg Sunrise Hike',
    description: 'A compact morning hike from Nussdorf up to Kahlenberg with a steady climb and a clear city view.',
    startLocation: 'Nussdorf',
    endLocation: 'Kahlenberg',
    transportType: 'HIKE',
    timezoneId: 'Europe/Vienna',
    plannedDistanceM: 7600,
    estimatedDurationS: 8100,
    route: {
      routeSource: 'OPENROUTESERVICE',
      routeProfile: 'foot-hiking',
      startCoordinate: { latitude: 48.2601, longitude: 16.3688 },
      endCoordinate: { latitude: 48.2767, longitude: 16.3339 },
      midpointCoordinate: { latitude: 48.2684, longitude: 16.3512 },
      routeFetchedAt: '2026-05-03T06:25:00Z'
    },
    computedAttributes: {
      logCount: 1,
      popularityCategory: 'RARELY_USED',
      popularityLabel: 'rarely used',
      popularityScore: 24,
      childFriendlinessCategory: 'CHALLENGING_ROUTE',
      childFriendlinessLabel: 'challenging route',
      childFriendlinessScore: 36
    },
    createdAt: '2026-03-19T06:00:00Z',
    updatedAt: '2026-05-03T06:25:00Z',
    version: 1
  },
  {
    id: 3,
    userId: 1,
    name: 'Ringstrasse Lunch Run',
    description: 'Short urban running loop for lunch breaks, with predictable streets and several easy exit points.',
    startLocation: 'Stadtpark',
    endLocation: 'Rathausplatz',
    transportType: 'RUNNING',
    timezoneId: 'Europe/Vienna',
    plannedDistanceM: 5100,
    estimatedDurationS: 1800,
    route: {
      routeSource: 'OPENROUTESERVICE',
      routeProfile: 'foot-walking',
      startCoordinate: { latitude: 48.2042, longitude: 16.3802 },
      endCoordinate: { latitude: 48.2109, longitude: 16.3576 },
      midpointCoordinate: { latitude: 48.2075, longitude: 16.3689 },
      routeFetchedAt: '2026-05-15T12:20:00Z'
    },
    computedAttributes: {
      logCount: 5,
      popularityCategory: 'VERY_POPULAR',
      popularityLabel: 'very popular',
      popularityScore: 92,
      childFriendlinessCategory: 'ADULT_ORIENTED',
      childFriendlinessLabel: 'adult oriented',
      childFriendlinessScore: 18
    },
    createdAt: '2026-02-11T11:45:00Z',
    updatedAt: '2026-05-15T12:20:00Z',
    version: 1
  },
  {
    id: 4,
    userId: 1,
    name: 'Salzkammergut Weekend',
    description: 'Vacation tour draft from Bad Ischl to Hallstatt for a relaxed weekend route with photo stops.',
    startLocation: 'Bad Ischl',
    endLocation: 'Hallstatt',
    transportType: 'VACATION',
    timezoneId: 'Europe/Vienna',
    plannedDistanceM: 22400,
    estimatedDurationS: 14400,
    route: {
      routeSource: 'OPENROUTESERVICE',
      routeProfile: 'driving-car',
      startCoordinate: { latitude: 47.7111, longitude: 13.6236 },
      endCoordinate: { latitude: 47.5622, longitude: 13.6493 },
      midpointCoordinate: { latitude: 47.6367, longitude: 13.6365 },
      routeFetchedAt: '2026-05-01T09:00:00Z'
    },
    computedAttributes: {
      logCount: 0,
      popularityCategory: 'NEW',
      popularityLabel: 'new',
      popularityScore: 0,
      childFriendlinessCategory: 'UNKNOWN',
      childFriendlinessLabel: 'unknown',
      childFriendlinessScore: 0
    },
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
    version: 1
  }
];

export function toTourSummary(tour: TourDetailDto): TourSummaryDto {
  return {
    id: tour.id,
    userId: tour.userId,
    name: tour.name,
    startLocation: tour.startLocation,
    endLocation: tour.endLocation,
    transportType: tour.transportType,
    timezoneId: tour.timezoneId,
    plannedDistanceM: tour.plannedDistanceM,
    estimatedDurationS: tour.estimatedDurationS,
    coverImage: tour.coverImage,
    computedAttributes: tour.computedAttributes,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt
  };
}
