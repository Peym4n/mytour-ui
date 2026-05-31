You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Specific Architecture (Tour Planner)

- This frontend is part of a two-tier application. It communicates via HTTP/REST with a separate backend (Java Spring Boot).
- Treat the app as SPA-first: `index.html` hosts the root component, routing renders feature views through `router-outlet`, and the backend serves JSON rather than HTML pages.
- Keep the root/shell component responsible for application layout, navigation, and the router outlet. Feature pages belong behind routes; reusable widgets belong in focused child components.
- You MUST strictly apply the MVVM-pattern.
  - **Model:** Generated backend DTOs/models plus small local view-state types where needed.
  - **View:** Standalone Angular components (HTML/SCSS).
  - **ViewModel:** Angular Services (`@Injectable`) utilizing Signals to manage state, handle business logic, and communicate with the backend through the generated API services. Components must remain as "dumb" as possible, delegating logic to the ViewModel.
- In this project, ViewModel/mediator services are the single source of truth for feature state. Components may expose view bindings and delegate user intent, but shared state, API orchestration, invariants, derived rules, and business decisions belong in services.
- Integrate route, distance, and duration data through the backend-generated API client. Do not expose OpenRouteService API keys or call OpenRouteService directly from Angular.
- Use `Leaflet` for graphical map rendering through a facade service, not directly from templates or general feature components.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Prefer declarative router links (`routerLink`, `routerLinkActive`) for navigation. Use programmatic `Router` navigation only for real application logic.
- SSR/hydration is optional for this project, but write browser-safe code: do not access `window`, `document`, `localStorage`, or third-party DOM libraries during service/component construction. Put browser-only work behind lifecycle hooks, effects, or platform guards.
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Templates & Styling

- Keep templates simple and avoid complex logic
- Template expressions must be side-effect free. Do not call methods from templates if they perform work, mutate state, allocate heavily, or trigger IO.
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Always provide a stable `track` expression for `@for`, such as `track tour.id`; use `@empty` for intentional empty states.
- Use `@defer` for heavy, non-critical UI such as maps, charts, or analytics panels. Provide useful `@placeholder` and `@loading` states when deferred content is visible to users.
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Use pipes for display formatting only. Keep custom pipes pure and lightweight; business rules belong in ViewModel services or dedicated helpers.
- Use Tailwind CSS for structural layouts (grids, flexbox, spacing).
- **Tailwind v4 Integration:** This project uses Tailwind CSS v4 with PostCSS. Tailwind is processed in parallel with SCSS via `src/tailwind.css`.
  - Do NOT import Tailwind directly into SCSS files.
  - When using `@apply` or Tailwind theme variables inside an SCSS file, you MUST add `@reference "../tailwind.css";` (adjust path as needed) at the top of the file to provide Tailwind context without re-importing the library.
- Use SCSS (indented or standard) for highly custom, reusable web-UI component styling to keep utility classes manageable.

## Components & State Management

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use component inputs for data flowing from parent to child and outputs for child-to-parent user intent. Keep child components reusable; they should not reach into parent or sibling state directly.
- Mark required inputs as required. Use input transforms only for boundary hygiene such as trimming or coercion, not for business logic.
- Use `computed()` for derived state
- Never store derived state manually. If a value can be calculated from other signals, expose it as `computed()`.
- Keep writable signals in ViewModel/state services where possible. Expose state changes through intention-revealing methods such as `selectTour`, `setSearchText`, `refreshTours`, or `clearSelection`.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer Reactive forms instead of Template-driven ones
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- Avoid duplicating shared state across components. If multiple components need the same data or need to coordinate, introduce or reuse a mediator/ViewModel service.
- Use `effect()` sparingly and only for side effects such as synchronizing with Leaflet, browser storage, logging, or browser APIs. Do not use effects to calculate state that belongs in `computed()`, and do not create feedback loops by writing to signals an effect depends on.

## RxJS, Signals, and Async Work

- Use Signals for synchronous UI/application state and Observables for asynchronous workflows such as HTTP, router streams, DOM events, timers, and websockets.
- Keep RxJS pipelines declarative with operators such as `map`, `filter`, `catchError`, `startWith`, and the appropriate concurrency operator.
- Choose concurrency deliberately:
  - `switchMap` for search/filter/latest-request-wins flows.
  - `mergeMap` for independent parallel work.
  - `concatMap` when order must be preserved.
  - `exhaustMap` when new events should be ignored while work is in progress.
- Convert Observables with `toSignal()` when the value becomes ViewModel state, participates in `computed()`, or must be read synchronously in TypeScript.
- Use the `async` pipe when an Observable is only displayed in a template and does not become application state.
- Bind long-lived subscriptions to Angular lifecycle cleanup with `takeUntilDestroyed()` and `DestroyRef`. Avoid manual subscription fields unless there is a clear reason.
- Treat RxJS errors as data at the ViewModel boundary where practical, exposing loading/error/success state to the view instead of letting streams fail silently.
- Use `shareReplay({ bufferSize: 1, refCount: true })` only when sharing a cold Observable result is intentional and does not hide stale data.

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
- ViewModel services should expose intention-based methods and read-only state to components. Components should not know API endpoint details, generated request shapes beyond what their ViewModel accepts, or external library APIs.
- Keep API and integration errors mapped into user-meaningful ViewModel state. Do not expose raw backend stack traces, generated client internals, or third-party error objects directly in components.

## External APIs, Maps, and Facades

- Wrap external APIs, browser APIs, and third-party libraries in facade services. Components and templates must not call them directly.
- Leaflet integration belongs behind a map facade service that owns the map instance, base tile setup, layers, markers, route geometry rendering, and cleanup.
- Initialize Leaflet only after the map container exists and only in the browser. Include an OpenStreetMap tile layer or another configured tile provider with attribution; without a tile layer the map background will be blank.
- Map components should react to signal state and call high-level facade methods such as `initMap`, `setCenter`, `renderRoute`, `setMarker`, or `clearLayers`. The facade should hide Leaflet-specific implementation details wherever possible.
- The frontend visualizes route geometry and tour state. Route calculation, geocoding, OpenRouteService calls, and weather lookup belong behind the backend/API layer unless a task explicitly changes that architecture.
- Mock or fake facade/API behavior in unit tests so component tests do not depend on network calls, real map tiles, or third-party service availability.

## Accessibility & Testing Requirements

- The application MUST pass all AXE checks and follow WCAG AA minimums (focus management, color contrast, ARIA).
- Unit tests are required whenever a change has clear testing value. Do not leave behavior such as ViewModel state transitions, form validation/request mapping, computed signals, error mapping, formatting helpers, facade behavior, route-parameter handling, import/export logic, or API fallback logic untested.
- Prefer TDD for new behavior with clear acceptance criteria: write or update the failing unit test first, implement the smallest change that passes, then refactor while keeping the test green.
- Add or update tests in the same change as the implementation. If a change is intentionally not unit-tested, the reason must be clear, for example pure markup/styling only, generated code, or behavior already covered by a higher-value test.
- Keep tests focused on behavior and public ViewModel/component contracts. Avoid brittle tests that assert private implementation details or generated OpenAPI client internals.
- Mock generated API services, router dependencies, browser APIs, and external facades. Unit tests must not perform network calls, load real map tiles, or depend on backend availability.
- Cover both success and meaningful failure/edge cases for stateful services and forms, including loading/error state and validation messages where applicable.
- Run `npm test` after adding or changing tests, and run `npm run build` when implementation files changed.
- Maintain the project target of at least 20 meaningful frontend unit tests; prefer adding tests incrementally with each feature rather than catching up at the end.
