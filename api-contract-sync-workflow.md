# API Contract Sync Workflow

This workflow explains how to keep the Angular frontend models and services synchronized with the Spring Boot backend API.

The core idea is **schema-driven development**:

- The backend is the source of truth.
- Spring Boot generates an OpenAPI specification from controllers and DTOs.
- Angular generates TypeScript interfaces and HTTP services from that OpenAPI specification.
- The Angular compiler catches frontend code that no longer matches the backend contract.

This avoids manually duplicating DTOs in TypeScript and Java.

## Current Project Setup

The workflow is already prepared in this repository.

Backend:

```text
mytour-api
```

Frontend:

```text
mytour-ui
```

Important files:

```text
mytour-api/pom.xml
mytour-ui/openapi.json
mytour-ui/ng-openapi-gen.json
mytour-ui/scripts/download-openapi.mjs
mytour-ui/src/app/api/generated
mytour-ui/src/app/app.config.ts
```

The frontend currently provides the generated API client base URL from Angular environment configuration:

```ts
provideApiConfiguration(environment.apiUrl)
```

This is important because Docker Compose exposes the backend on `localhost:8282`, while the backend container itself still listens on port `8080`.

## Why This Is Needed

When frontend and backend are decoupled, they communicate through an API contract:

- endpoint paths
- HTTP methods
- request bodies
- response bodies
- status codes
- DTO field names
- required/optional fields
- enum values

If the backend changes a field from `userName` to `username`, but the frontend still expects `userName`, the application breaks.

OpenAPI solves this by making the contract explicit and machine-readable.

## Recommended Tooling

### Backend

Use Springdoc OpenAPI:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

This dependency is already present in `mytour-api/pom.xml`.

Springdoc inspects:

- `@RestController` classes
- request mappings like `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- request DTOs
- response DTOs
- validation annotations such as `@NotBlank`, `@Size`, `@Min`, `@Max`
- enum types

It then generates:

- Swagger UI for browser-based API testing
- raw OpenAPI JSON at `/v3/api-docs`

### Frontend

Use an OpenAPI generator in the Angular project.

Recommended for this project:

```bash
npm install -D ng-openapi-gen
```

Alternative:

```bash
npm install -D @openapitools/openapi-generator-cli
```

`ng-openapi-gen` is a good fit because it generates Angular-friendly TypeScript interfaces and `HttpClient` services.

## Step 1: Backend Is the Source of Truth

Do not manually write API documentation as the source of truth.

Instead, design the backend API with explicit DTO classes and controller methods. The OpenAPI file should be generated from the backend code.

Good backend structure:

```text
controller/
service/
repository/
domain/
dto/
mapper/
exception/
config/
```

The API contract should be based on DTOs, not JPA entities.

Example:

```java
@RestController
@RequestMapping("/api/tours")
class TourController {

    @GetMapping
    List<TourSummaryDto> findTours() {
        ...
    }

    @PostMapping
    TourDetailDto createTour(@Valid @RequestBody CreateTourRequest request) {
        ...
    }
}
```

Why DTOs matter:

- They hide internal database/entity details.
- They prevent accidental exposure of fields like `passwordHash`.
- They make the API contract intentional.
- They allow backend internals to change without breaking the frontend.

## Step 2: Start the Backend

Recommended for this project: start the full stack with Docker Compose.

From the backend directory:

```bash
cd mytour-api
docker compose up --build
```

In the current Docker Compose setup, the backend is exposed on:

```text
http://localhost:8282
```

The container still listens internally on port `8080`, but the host port is `8282`.

You can verify the running services with:

```bash
docker compose ps
```

Expected important mapping:

```text
mytour-api-app   0.0.0.0:8282->8080/tcp
```

Alternative local backend run without Docker:

```powershell
cd mytour-api
.\mvnw.cmd spring-boot:run
```

On Linux/macOS:

```bash
cd mytour-api
./mvnw spring-boot:run
```

When running directly with Maven, the backend normally starts on:

```text
http://localhost:8080
```

## Step 3: Inspect Swagger UI

Open Swagger UI:

```text
http://localhost:8282/swagger-ui.html
```

Depending on Springdoc/Spring Boot routing, this may redirect to:

```text
http://localhost:8282/swagger-ui/index.html
```

Use Swagger UI to verify:

- all expected endpoints are visible
- request bodies look correct
- response schemas look correct
- enum values are correct
- required fields are marked correctly
- security/JWT endpoints are documented
- no internal fields are exposed

If something is wrong in Swagger UI, fix the backend DTO/controller first.

## Step 4: Download the OpenAPI JSON

The raw OpenAPI specification is available at:

```text
http://localhost:8282/v3/api-docs
```

For the manual student-project workflow, save it into the Angular project:

```text
mytour-ui/openapi.json
```

Manual browser approach:

1. Start the backend.
2. Open `http://localhost:8282/v3/api-docs`.
3. Save the JSON response as `mytour-ui/openapi.json`.

The project already has a cross-platform Node download script, so the preferred command is:

```bash
cd mytour-ui
API_URL=http://localhost:8282 npm run download-api
```

PowerShell:

```powershell
cd mytour-ui
$env:API_URL='http://localhost:8282'; npm run download-api
```

Manual PowerShell approach:

```powershell
Invoke-WebRequest `
  -Uri http://localhost:8282/v3/api-docs `
  -OutFile mytour-ui/openapi.json
```

This file is the bridge between backend and frontend.

## Step 5: Configure Angular Code Generation

Install the generator in the Angular project:

```powershell
cd mytour-ui
npm install -D ng-openapi-gen
```

This has already been installed in this project.

The generator is configured in:

```text
mytour-ui/ng-openapi-gen.json
```

Current configuration:

```json
{
  "input": "openapi.json",
  "output": "src/app/api/generated",
  "services": true,
  "promises": false,
  "indexFile": true,
  "removeStaleFiles": true,
  "endOfLineStyle": "lf"
}
```

The relevant scripts in `mytour-ui/package.json` are:

```json
{
  "scripts": {
    "download-api": "node scripts/download-openapi.mjs",
    "generate-api": "ng-openapi-gen",
    "sync-api": "npm run download-api && npm run generate-api"
  }
}
```

The output folder should be treated as generated code:

```text
mytour-ui/src/app/api/generated
```

Do not manually edit generated files. If generated files are wrong, fix the backend API/DTOs or the generator configuration, then regenerate.

## Step 6: Generate Frontend Models and Services

Run:

```bash
cd mytour-ui
API_URL=http://localhost:8282 npm run sync-api
```

PowerShell:

```powershell
cd mytour-ui
$env:API_URL='http://localhost:8282'; npm run sync-api
```

Expected result:

```text
src/app/api/generated/
```

The generated folder should contain:

- TypeScript interfaces for backend DTOs
- Angular services for API endpoints
- request/response model types
- enum types
- generated `HttpClient` calls

Example generated types:

```text
TourSummaryDto
TourDetailDto
CreateTourRequest
UpdateTourRequest
TourLogDto
CreateTourLogRequest
LoginRequest
LoginResponse
```

Example generated services:

```text
AuthenticationService
ToursService
TourLogsService
```

The exact names depend on controller and DTO names in the backend.

## Step 7: Use Generated Code in Angular

Angular components and view-model services should use the generated types instead of hand-written duplicate interfaces.

Instead of this:

```ts
export interface Tour {
  id: number;
  name: string;
}
```

Prefer generated DTOs:

```ts
import { TourSummaryDto } from './api/generated/models';
```

Or import from the generated index:

```ts
import { TourSummaryDto, ToursService } from './api/generated';
```

Application-specific view models are still allowed.

Example:

```ts
interface TourListItemViewModel {
  id: number;
  title: string;
  subtitle: string;
  distanceLabel: string;
}
```

But API request/response contracts should come from generated OpenAPI code.

## Step 8: Compile the Frontend

After generating the API code, run:

```bash
cd mytour-ui
npm run build
```

If the backend API changed in a breaking way, TypeScript should catch it.

Example:

- backend renames `userName` to `username`
- OpenAPI JSON changes
- generated TypeScript model changes
- Angular code still using `userName` fails to compile

This catches contract bugs before deployment.

## Student-Project Sync Process

This is the recommended manual workflow for this project.

1. Change backend controller/DTO code.
2. Start the stack with `docker compose up --build` from `mytour-api`.
3. Check Swagger UI at `http://localhost:8282/swagger-ui.html`.
4. Run `API_URL=http://localhost:8282 npm run sync-api` from `mytour-ui`.
5. Confirm `mytour-ui/openapi.json` changed as expected.
6. Confirm generated code under `mytour-ui/src/app/api/generated` changed as expected.
7. Fix Angular compile errors caused by API changes.
8. Run `npm run build`.
9. Rebuild the frontend container if Docker Compose is running: `docker compose up -d --build frontend` from `mytour-api`.
10. Commit backend changes, `openapi.json`, generated Angular API code, and frontend fixes together.

This is the "sneakernet" approach:

- manual
- fast
- reliable
- no CI/CD setup required
- ideal for a student project

## Optional Automation Later

If the project grows, the manual copy step can be automated.

The automation already exists in the frontend:

```json
{
  "scripts": {
    "download-api": "node scripts/download-openapi.mjs",
    "generate-api": "ng-openapi-gen",
    "sync-api": "npm run download-api && npm run generate-api"
  }
}
```

The Node script reads:

```text
API_URL
OPENAPI_URL
OPENAPI_OUTPUT
```

Typical usage:

```bash
API_URL=http://localhost:8282 npm run sync-api
```

PowerShell:

```powershell
$env:API_URL='http://localhost:8282'; npm run sync-api
```

## Backend Rules for Good OpenAPI Output

Use DTOs for every request and response.

Good:

```java
CreateTourRequest
UpdateTourRequest
TourDetailDto
TourSummaryDto
TourLogDto
```

Avoid exposing JPA entities directly.

Bad:

```java
@PostMapping
TourEntity create(@RequestBody TourEntity entity)
```

Add validation annotations to DTOs:

```java
public record CreateTourRequest(
    @NotBlank
    @Size(max = 120)
    String name,

    @NotBlank
    String startLocation,

    @NotBlank
    String endLocation,

    @NotNull
    TransportType transportType
) {}
```

Use clear enum names:

```java
enum TransportType {
    BIKE,
    HIKE,
    RUNNING,
    VACATION
}
```

Do not return sensitive data:

- never return `passwordHash`
- never return internal security tokens except from login responses
- never expose filesystem base directory paths
- avoid exposing implementation-only fields unless the frontend needs them

## Frontend Rules for Generated Code

Do not manually edit:

```text
src/app/api/generated
```

Use generated services for backend calls.

Wrap generated services in application services when useful.

Example:

```text
TourApiService wraps generated ToursService
TourListViewModelService prepares data for components
TourListComponent binds to view-model state
```

This keeps the Angular app aligned with MVVM-style separation:

- generated service: raw HTTP contract
- application service: frontend-specific behavior
- component: UI binding and user interaction

## What Should Be Committed

For this project, commit:

- backend DTO/controller changes
- `mytour-ui/openapi.json`
- generated Angular API code
- Angular code changes needed after regeneration
- `mytour-ui/ng-openapi-gen.json` if generator behavior changes
- `mytour-ui/scripts/download-openapi.mjs` if the download workflow changes

Committing generated code is acceptable for a student project because:

- the evaluator can build the project without running extra generation steps
- changes are visible in git history
- frontend/backend contract changes can be reviewed together

## Definition of Done for API Sync

An API sync is complete when:

- backend starts successfully
- Swagger UI shows the expected API
- `mytour-ui/openapi.json` is updated
- Angular generated API code is regenerated
- Angular code compiles
- generated services use `environment.apiUrl` through `provideApiConfiguration(environment.apiUrl)`
- frontend services/components use generated DTOs where appropriate
- no hand-written duplicate API models are left for synced backend DTOs

## Current Verification Commands

With Docker Compose running:

```bash
curl http://localhost:8282/actuator/health
curl http://localhost:8282/v3/api-docs
```

From `mytour-ui` in Git Bash:

```bash
API_URL=http://localhost:8282 npm run sync-api
npm run build
```

From `mytour-ui` in PowerShell:

```powershell
$env:API_URL='http://localhost:8282'; npm run sync-api
npm run build
```

Expected generation summary at the time this guide was updated:

```text
Generation from openapi.json finished with 25 models and 3 services.
```
