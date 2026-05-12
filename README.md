# MyTour UI

Angular frontend for the MyTour project.

This app uses Angular 21, Tailwind CSS, and PrimeNG. The current UI includes a root navigation shell and a backend health view that calls the Spring Boot API.

## Configuration

The app generates Angular environment files before `npm start` and `npm run build`.

Set `API_URL` to point the frontend at the backend API:

```bash
API_URL=http://localhost:8282
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
API_URL=http://localhost:8282 npm run sync-api
```

PowerShell:

```powershell
$env:API_URL='http://localhost:8282'; npm run sync-api
```

This writes `openapi.json` and generated code in `src/app/api/generated`.

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
* Backend API: `http://localhost:8282`
* Backend health check: `http://localhost:8282/actuator/health`

## Building

Build the frontend:

```bash
npm run build
```

The build output is written to `dist/`.

## Tests

Run unit tests:

```bash
npm test
```
