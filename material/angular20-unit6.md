

## Angular 20
External API Integration & Leaflet
## SWEN2 | BIF4

Table of Contents
External APIs in Frontend Applications
## Facade Pattern
Why a Facade for External Libraries
## Leaflet
Installing & Configuring Leaflet in Angular 20
Base Map Tiles (OpenStreetMap)
Map Facade Service (Architecture)
Map Component + effect()
Simulating External APIs (OpenRouteService)
Preparation for Backend Integration
## Further Reading
Angular 20 – Unit 6 | SWEN2 | BIF4
## 1

External APIs in Frontend Applications

What is an External API?
An external API is a system that:
lives outside the frontend application
exposes functionality or data
is accessed via a well-defined interface
Typical examples:
REST APIs (HTTP + JSON)
Browser APIs (Geolocation, Canvas, Storage)
Third-party JS libraries (maps, charts, editors)
Angular 20 – Unit 6 | SWEN2 | BIF4
## 2

External APIs in Angular
In Angular applications, external APIs are usually:
asynchronous
stateful
not designed with Angular in mind
## Therefore:
They must be wrapped and controlled.
External APIs should never be accessed directly from templates.
## “
## “
Angular 20 – Unit 6 | SWEN2 | BIF4
## 3

## Facade Pattern

Angular 20 – Unit 6 | SWEN2 | BIF4
## 4

## Facade Pattern – Definition
The Facade Pattern provides:
a simplified interface
in front of a complex system
Clients interact with the facade, not with the subsystem itself.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 5

Problem Without a Facade
If components directly use external libraries:
tight coupling
library-specific logic leaks into UI
hard to replace or mock
testing becomes difficult
The UI becomes dependent on implementation details.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 6

Angular 20 – Unit 6 | SWEN2 | BIF4
## 7

## Facade Pattern – Benefits
Using a facade:
decouples UI from implementation
centralizes integration logic
makes testing and replacement easier
enforces a clear boundary
In Angular, a service is a natural facade.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 8

Why a Facade for External Libraries

External JS Libraries
Libraries like Leaflet:
manage their own state
manipulate the DOM
are not reactive by default
Angular components must not depend on these details.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 9

## Role Split
Recommended responsibility split:
## Component
UI state (signals)
reacts to state changes
no direct Leaflet access
## Facade Service
talks to the external library
hides Leaflet-specific details
exposes intention-based methods
Angular 20 – Unit 6 | SWEN2 | BIF4
## 10

## Leaflet

What is Leaflet?
Leaflet is a lightweight JavaScript library for interactive maps.
## Features:
OpenStreetMap support (provides the map data and tiles. Leaflet is only responsible for rendering
them. Routing and business logic are not part of OpenStreetMap and belong in the backend.)
markers, popups, layers
small API surface
no framework dependency
Leaflet is commonly used as a frontend map rendering engine.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 11

Leaflet in a Modern Stack
Typical setup:
Leaflet → rendering & interaction
Map data
Routing & geo calculations → backend services
Frontend responsibility:
Visualize map state, not compute routes.
## “
## “
Angular 20 – Unit 6 | SWEN2 | BIF4
## 12

Installing & Configuring Leaflet in Angular 20

## Installing Leaflet
npm install leaflet
npm install --save-dev @types/leaflet
Importing Leaflet CSS
Leaflet requires global CSS.
Option A – styles.css:
## @import "leaflet/dist/leaflet.css";
Option B – angular.json:
## "styles": [
## "src/styles.css",
## "node_modules/leaflet/dist/leaflet.css"
## ]
Angular 20 – Unit 6 | SWEN2 | BIF4
## 13

Base Map Tiles (OpenStreetMap)

Why you need a tile layer
Leaflet provides:
the map viewport (pan/zoom)
layers (marker/polyline)
interaction
## But:
A tile provider supplies background map images.
Without a tile layer, you will see an empty map (no background).
## “
## “
Angular 20 – Unit 6 | SWEN2 | BIF4
## 14

OpenStreetMap tiles (default choice)
A common default tile layer (OpenStreetMap):
L.tileLayer(
## "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{ attribution: "© OpenStreetMap contributors" }
## )
This is not “business integration” yet — it is the required base layer to see a map.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 15

Why this belongs in the facade
The tile layer is:
part of the map setup
not a component concern
needed exactly once per map instance
Therefore it belongs in initMap(...) inside the facade.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 16

## Map Facade Service – Architecture

MapFacadeService – Responsibility
The facade:
owns the Leaflet map instance
performs one-time setup (tiles, defaults)
exposes high-level operations
hides Leaflet-specific types
Components interact only with the facade API.
Facade API (example)
initMap(containerId: string): void
setCenter(lat: number, lng: number, zoom?: number): void
setMarker(lat: number, lng: number): void
These methods express intent, not Leaflet implementation details.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 17

Facade: initMap includes base tiles
import * as L from "leaflet";
export class MapFacadeService {
private map: L.Map | null = null;
initMap(containerId: string): void {
if (this.map) return;
this.map = L.map(containerId, {
zoomControl: true,
attributionControl: true,
## });
// Base tiles (OpenStreetMap)
L.tileLayer(
## "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{ attribution: "© OpenStreetMap contributors" }
).addTo(this.map);
// Safe default view
this.map.setView([48.2082, 16.3738], 12); // Vienna
## }
setCenter(lat: number, lng: number, zoom = 13): void {
this.map?.setView([lat, lng], zoom);
## }
setMarker(lat: number, lng: number): void {
if (!this.map) return;
L.marker([lat, lng]).addTo(this.map);
## }
## }
Angular 20 – Unit 6 | SWEN2 | BIF4
## 18

Map Component + effect()

Role of the map component
The component:
holds UI-relevant state as signals
reacts to state changes
triggers map updates via the facade
effect() as the integration point
Use effect() when:
reacting to signal changes
calling external APIs
performing side effects
This fits map integration perfectly.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 19

Example pattern (component drives facade)
effect(() => {
const c = this.center();           // signal
this.mapFacade.setCenter(c.lat, c.lng, c.zoom);
## });
effect(() => {
const m = this.marker();           // signal
if (m) this.mapFacade.setMarker(m.lat, m.lng);
## });
Signals drive the map.
The map does not drive state.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 20

Simulating External APIs (OpenRouteService)

Why simulate?
At this point:
the backend may not exist yet
the focus is frontend architecture
Simulation avoids blocking progress.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 21

Simulation approach
## Use:
hard-coded coordinates
static “route geometry” (polyline points)
a service method that returns a result
Later, replace the simulated method with:
Java backend API
C# backend API
The component stays unchanged if it depends on a facade.
Angular 20 – Unit 6 | SWEN2 | BIF4
## 22

Preparation for Backend Integration

Clean separation pays off
## Because:
UI talks only to facades
facades hide API details
Switching from mock data to real APIs means:
Only the facade changes.
## “
## “
Angular 20 – Unit 6 | SWEN2 | BIF4
## 23

Target architecture
Angular UI (signals)
Facade services (integration boundary)
Backend APIs (e.g., Java, C#)
External services (e.g., routing, geocoding)
Angular 20 – Unit 6 | SWEN2 | BIF4
## 24

## Further Reading

## Facade Pattern
https://refactoring.guru/design-patterns/facade
## Leaflet Documentation
https://leafletjs.com/
## Openstreetmap
https://www.openstreetmap.org/#map=8/47.714/13.349
## Openrouteservice
https://openrouteservice.org/
## Angular Signals & Effects
https://angular.dev/guide/signals
Angular HTTP guide
https://angular.dev/guide/http
Angular 20 – Unit 6 | SWEN2 | BIF4
## 25