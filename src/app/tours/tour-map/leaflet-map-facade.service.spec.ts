import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LeafletMapFacade } from './leaflet-map-facade.service';

describe('LeafletMapFacade', () => {
  it('does not touch Leaflet when rendering outside the browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        LeafletMapFacade,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    const facade = TestBed.inject(LeafletMapFacade);
    const container = document.createElement('div');

    await expect(facade.initMap(container)).resolves.toBeUndefined();
    await expect(facade.renderRoute({
      routeSource: 'OPENROUTESERVICE',
      routeProfile: 'cycling-regular',
      startCoordinate: { latitude: 48.2082, longitude: 16.3738 },
      endCoordinate: { latitude: 48.25, longitude: 16.4 },
      routeGeometry: { type: 'FeatureCollection', features: [] }
    })).resolves.toBeUndefined();

    expect(() => facade.destroy()).not.toThrow();
  });
});
