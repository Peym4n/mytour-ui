# MyTour UI

Angular frontend for the MyTour project.

This app uses Angular 21, Tailwind CSS, PrimeNG, generated OpenAPI clients, and Leaflet. The UI includes authentication, tour CRUD, tour logs, route maps, cover-image upload, search/filtering, import/export, demo data seeding, and automatic weather snapshot display.

## Configuration

The app generates Angular environment files before `npm start` and `npm run build`.

Set `API_URL` to point the frontend at the backend API:

```bash
API_URL=http://localhost:8080
```

If `API_URL` is not set, it defaults to `http://localhost:8080`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
npm start
```

Open `http://localhost:4200`.

## API Contract Sync

The Spring Boot backend is the source of truth for API DTOs and endpoints. Generate the Angular API client from the backend OpenAPI contract:

```bash
API_URL=http://localhost:8080 npm run sync-api
```

PowerShell:

```powershell
$env:API_URL='http://localhost:8080'; npm run sync-api
```

This writes `openapi.json` and generated code in `src/app/api/generated`.

The generated `TourRouteDto.routeGeometry` type is a JSON object map. It must stay synchronized with the backend so Leaflet receives the actual OpenRouteService GeoJSON `FeatureCollection` instead of an internal server-side JSON-tree representation.

Useful individual commands:

```bash
npm run download-api
npm run generate-api
```

Do not manually edit generated files. See [api-contract-sync-workflow.md](api-contract-sync-workflow.md) for the full workflow.

## Docker Compose

The recommended full-stack local setup is managed from the backend project:

```bash
cd ../mytour-api
docker compose up --build
```

That starts PostgreSQL, the Spring Boot backend, and this Angular frontend. The frontend waits until the backend health check is passing.

Default URLs:

* Frontend: `http://localhost:4200`
* Backend API: `http://localhost:8080`
* Backend health check: `http://localhost:8080/actuator/health`

## Building

Build the frontend:

```bash
npm run build
```

The build output is written to `dist/`.

Latest verification: `npm run build` passed on 2026-07-07 after API sync. The build currently reports budget warnings for the initial bundle size and `tours-list.scss`; these are warnings, not compile failures.

## Tests

Run unit tests:

```bash
npm test
```

Latest verification: 30 frontend tests across 9 spec files passed on 2026-07-07.
