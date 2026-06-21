import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { GeoJsonObject } from 'geojson';
import type * as Leaflet from 'leaflet';

import { CoordinateDto } from '../../api/generated/models/coordinate-dto';
import { TourRouteDto } from '../../api/generated/models/tour-route-dto';

@Injectable()
export class LeafletMapFacade {
  private readonly platformId = inject(PLATFORM_ID);
  private leaflet: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private routeLayer: Leaflet.Layer | null = null;
  private markerLayer: Leaflet.LayerGroup | null = null;

  async initMap(container: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const leaflet = await this.loadLeaflet();
    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    this.map = leaflet.map(container, {
      center: [48.2082, 16.3738],
      zoom: 12,
      zoomControl: true,
      attributionControl: true
    });

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
  }

  async renderRoute(route: TourRouteDto): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.map === null) {
      return;
    }

    const leaflet = await this.loadLeaflet();
    this.clearRouteLayers();

    const bounds = leaflet.latLngBounds([]);
    const routeGeometry = this.toGeoJsonObject(route.routeGeometry);

    if (routeGeometry) {
      const geoJsonLayer = leaflet.geoJSON(routeGeometry, {
        style: {
          color: '#2563eb',
          weight: 5,
          opacity: 0.88
        }
      }).addTo(this.map);
      this.routeLayer = geoJsonLayer;

      const routeBounds = geoJsonLayer.getBounds();
      if (routeBounds.isValid()) {
        bounds.extend(routeBounds);
      }
    } else if (this.hasCoordinate(route.startCoordinate) && this.hasCoordinate(route.endCoordinate)) {
      this.routeLayer = leaflet.polyline([
        this.toLatLngTuple(route.startCoordinate),
        this.toLatLngTuple(route.endCoordinate)
      ], {
        color: '#2563eb',
        weight: 5,
        opacity: 0.88
      }).addTo(this.map);

      bounds.extend(this.toLatLngTuple(route.startCoordinate));
      bounds.extend(this.toLatLngTuple(route.endCoordinate));
    }

    this.markerLayer = leaflet.layerGroup().addTo(this.map);
    this.addEndpointMarker(route.startCoordinate, 'Start', '#16a34a', bounds);
    this.addEndpointMarker(route.endCoordinate, 'End', '#f97316', bounds);

    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.18), {
        animate: false,
        maxZoom: 15
      });
    }

    window.setTimeout(() => this.map?.invalidateSize(), 0);
  }

  destroy(): void {
    this.clearRouteLayers();
    this.map?.remove();
    this.map = null;
  }

  private async loadLeaflet(): Promise<typeof Leaflet> {
    if (this.leaflet === null) {
      this.leaflet = await import('leaflet');
    }

    return this.leaflet;
  }

  private addEndpointMarker(
    coordinate: CoordinateDto | undefined,
    label: string,
    color: string,
    bounds: Leaflet.LatLngBounds
  ): void {
    if (!this.hasCoordinate(coordinate) || this.markerLayer === null) {
      return;
    }

    const leaflet = this.leaflet;
    if (leaflet === null) {
      return;
    }

    const latLng = this.toLatLngTuple(coordinate);
    leaflet.circleMarker(latLng, {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: color,
      fillOpacity: 1
    }).bindTooltip(label, {
      permanent: true,
      direction: 'top',
      offset: [0, -8]
    }).addTo(this.markerLayer);
    bounds.extend(latLng);
  }

  private clearRouteLayers(): void {
    this.routeLayer?.remove();
    this.markerLayer?.remove();
    this.routeLayer = null;
    this.markerLayer = null;
  }

  private toGeoJsonObject(value: unknown): GeoJsonObject | null {
    if (!this.isRecord(value) || typeof value['type'] !== 'string') {
      return null;
    }

    const type = value['type'];
    if (type === 'FeatureCollection' || type === 'Feature' || type === 'LineString' || type === 'MultiLineString') {
      return value as unknown as GeoJsonObject;
    }

    return null;
  }

  private hasCoordinate(coordinate: CoordinateDto | undefined): coordinate is Required<CoordinateDto> {
    return typeof coordinate?.latitude === 'number' && typeof coordinate.longitude === 'number';
  }

  private toLatLngTuple(coordinate: Required<CoordinateDto>): Leaflet.LatLngTuple {
    return [coordinate.latitude, coordinate.longitude];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
