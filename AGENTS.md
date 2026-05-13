You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Specific Architecture (Tour Planner)

- This frontend is part of a two-tier application. It communicates via HTTP/REST with a separate backend (Java Spring Boot).
- You MUST strictly apply the MVVM-pattern.
  - **Model:** TypeScript interfaces representing Tour and TourLog data.
  - **View:** Standalone Angular components (HTML/SCSS).
  - **ViewModel:** Angular Services (`@Injectable`) utilizing Signals to manage state, handle business logic, and communicate with the backend via `HttpClient`. Components must remain as "dumb" as possible, delegating logic to the ViewModel.
- You must integrate the `OpenRouteservice.org` API for distance/time calculations and `Leaflet` for graphical map rendering.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Templates & Styling

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Use Tailwind CSS for structural layouts (grids, flexbox, spacing).
- **Tailwind v4 Integration:** This project uses Tailwind CSS v4 with PostCSS. Tailwind is processed in parallel with SCSS via `src/tailwind.css`.
  - Do NOT import Tailwind directly into SCSS files.
  - When using `@apply` or Tailwind theme variables inside an SCSS file, you MUST add `@reference "../tailwind.css";` (adjust path as needed) at the top of the file to provide Tailwind context without re-importing the library.
- Use SCSS (indented or standard) for highly custom, reusable web-UI component styling to keep utility classes manageable.

## Components & State Management

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer Reactive forms instead of Template-driven ones
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Services & APIs (OpenAPI & MVVM Integration)

- **CRITICAL: Schema-Driven Development.** The application uses an OpenAPI generator to build the data access layer based on the backend repository's Swagger/OpenAPI spec.
- Generated API client files live in `src/app/api/generated` and are produced from `openapi.json` via `ng-openapi-gen.json`.
- Do NOT manually edit anything in `src/app/api/generated`. If the contract is wrong, update the backend OpenAPI source or `ng-openapi-gen.json`, then regenerate.
- Useful commands from `mytour-ui`:
  - `npm run download-api` downloads the backend OpenAPI contract.
  - `npm run generate-api` regenerates the Angular client.
  - `npm run sync-api` downloads and regenerates in one step.
- **Do NOT manually create TypeScript interfaces for backend entities.** Import the auto-generated DTOs and models from `src/app/api/generated` or `src/app/api/generated/models`.
- **Do NOT manually write `HttpClient` calls (GET, POST, etc.).** Inject the auto-generated backend services from `src/app/api/generated` or `src/app/api/generated/services`.
- The generated API root URL is configured in `src/app/app.config.ts` with `provideApiConfiguration(environment.apiUrl)`. Keep environment-based configuration instead of hardcoding backend URLs.
- **ViewModel Integration:** Your custom ViewModels (Angular Services using Signals) should act as a middleman. They must inject the auto-generated OpenAPI services, execute the API calls, and map the returned generated models into local Signals for the components to consume.
- Use the `providedIn: 'root'` option for your custom ViewModel services.
- Use the `inject()` function instead of constructor injection for all dependencies (including the generated OpenAPI services).

## Accessibility & Testing Requirements

- The application MUST pass all AXE checks and follow WCAG AA minimums (focus management, color contrast, ARIA).
- You must write comprehensive unit tests for components, view-models, and services using Angular's default testing framework to help meet the 20+ unit test project requirement.
