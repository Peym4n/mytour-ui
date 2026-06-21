# Tour Planner Implementation TODO

This order is optimized for passing the intermediate hand-in first, then extending the same work into the final hand-in without throwing away the UI foundation.

## Project Decisions

- Backend: Java Spring Boot with a layered architecture: controller/presentation, business/service, data access/repository, domain/entity, DTO/mapper, configuration, and exception handling.
- Frontend: Angular with MVVM-style separation, where components bind to view-model state and delegate data/backend calls to services.
- Database: PostgreSQL accessed through JPA/Hibernate.
- Database initialization: use Flyway versioned SQL migrations from `mytour-api/src/main/resources/db/migration`, instead of relying on Hibernate `ddl-auto=update` for schema creation.
- O/R mapping: still use JPA/Hibernate for application persistence; migrations create/evolve the schema, while Hibernate maps entities to tables and validates the schema at startup.
- JPA mode: use `spring.jpa.hibernate.ddl-auto=validate`, so the app fails early if the Flyway schema and JPA mappings diverge.
- Database IDs: use numeric IDs, with security enforced through authenticated user ownership checks in the backend.
- Database design source: design from `semester-project.md` and current requirements; ignore the old draft class diagram.
- Core tables: `app_users`, `tours`, `tour_routes`, `tour_logs`, and `tour_log_weather`.
- Usernames: treat usernames as case-insensitive by storing both `username` and `username_normalized`, with a unique constraint on `username_normalized`.
- Authentication: use username/password registration and JWT login. No email address, email verification, or email sending is required.
- Tour images: support one cover image per tour. Store image files externally on the filesystem and store only metadata/path fields in PostgreSQL.
- Route integration: use OpenRouteService for planned distance, estimated duration, and route geometry; store route geometry as GeoJSON in PostgreSQL `jsonb`; use Leaflet in Angular for map display.
- Time handling: store actual moments as UTC timestamps in PostgreSQL; store a tour `timezone_id` based on the tour location and let the frontend display tour/log times in that timezone.
- Deletes: use physical deletes for tours and tour logs.
- Import/export: include route geometry and weather snapshots so exported data can be restored without immediately calling external APIs again.
- Transport types: use `BIKE`, `HIKE`, `RUNNING`, and `VACATION`.
- Tour log difficulty and rating: store both as numeric values from 1 to 5; the frontend can display labels for these values.
- Computed tour attributes: store numeric scores for calculations/sorting and non-overlapping text labels for display/search.
- Full-text search: include tour fields, tour log fields, and computed labels; use structured filters for exact categories where keyword search is ambiguous.
- Unique feature: automatic weather snapshot for each tour log based on route/log location and performed date/time.
- Weather API: use Open-Meteo because it supports coordinate-based historical hourly weather, is free for non-commercial use, and does not require an API key. Use the midpoint between tour start/end coordinates for the weather lookup.
- Weather snapshots: treat stored weather snapshots as immutable generated data. If a log's performed time or route coordinates change, refetch and replace the snapshot.

## Intermediate Hand-In TODO

Checklist requirements from `TourPlanner_Checklist_Intermediate.xlsx`:

- [x] Must have: uses Angular as frontend framework.
- [x] Must have: uses MVVM for UI.
- [x] GUI: correct data binding between UI elements and view model properties.
- [x] GUI: UI responds to window size changes.
- [x] GUI: defines a reusable UI component.
- [x] Tours: create, modify, and delete tours.
- [x] Tours: tours have required attributes, including image, and are managed in a list view.
- [x] Tours: tour details show all tour attributes of a selected tour and a map placeholder.
- [x] Tours: validates user input with no crash on wrong input.
- [x] Tour Logs: create, modify, and delete tour logs.
- [x] Tour Logs: tour logs have required attributes.
- [x] Tour Logs: show all logs of a selected tour with all log attributes in a list view.
- [x] Tour Logs: validates user input with no crash on wrong input.
- [x] Protocol: describes UX and includes wireframes.

Implementation tasks:

1. [x] Re-read the intermediate checklist and mark the exact must-haves: Angular frontend, MVVM-style UI structure, reusable component, responsive UI, CRUD screens, validation, and wireframes.
2. [x] Define the frontend domain models for `Tour` and `TourLog`, including all required attributes from the spec.
3. [x] Decide the intermediate data strategy: use Angular services with mock/in-memory data first, then connect the same service API to the backend once endpoints exist.
4. [x] Build the main Angular shell: routing, navigation, shared layout, empty/error/loading states, and responsive structure.
5. [x] Implement the tours list view with selection, search/filter if cheap, and clear create/edit/delete actions.
6. [x] Implement the tour detail view showing all required tour attributes, including an image field and a map placeholder.
7. [x] Implement tour create/edit forms with Angular validation and user-friendly validation messages.
8. [x] Implement the tour logs list for the selected tour, showing all required log attributes.
9. [x] Implement tour log create/edit/delete flows with validation and no-crash handling for invalid input.
10. [x] Extract at least one reusable Angular UI component used in multiple places, for example a form field wrapper, detail row, confirmation dialog, or empty-state component.
11. [x] Check MVVM-style separation: components bind to view-model state and delegate data operations to services instead of containing persistence logic directly.
12. [x] Add a thin Spring Boot integration layer for intermediate safety: REST endpoints for tours and tour logs, even if backed by in-memory data for now.
13. [x] Connect the Angular data services to the backend endpoints through environment-based API configuration.
14. [x] Verify frontend CRUD flows against the backend: create, update, delete, select, and display tours and logs.
    - Verified through the Angular UI against Docker Compose on 2026-05-31: created/updated/deleted a temporary tour, created/deleted a temporary log, and confirmed list/detail/log display with successful backend responses.
15. [x] Test responsive behavior at mobile, tablet, and desktop widths.
    - Verified with Chrome DevTools at desktop, tablet, and narrow viewport widths; no horizontal overflow was detected on the tour list or tour detail/log views.
16. [x] Add basic frontend tests or smoke checks for critical UI/service behavior if time allows.
    - Current frontend test suite passes with 14 tests covering health state, app shell, tour display helpers, tour list view model behavior, and tour form view model behavior.
17. [x] Create/update wireframes for the implemented UI flow and add them to the protocol.
    - Wireframes were created in `docs/intermediate-wireframes.md`
18. [x] Write the intermediate protocol section describing UX decisions, wireframes, and the current frontend/backend integration boundary.
19. [x] Run `npm run build` in `mytour-ui` and fix build errors.
20. [x] Run the backend locally and verify the Angular app can reach it from a clean start.
21. [x] Update README hand-in instructions: how to start backend, how to start frontend, expected environment variables.
22. [x] Create the intermediate zip/source snapshot and check that it contains the latest code and README.

## Full Hand-In TODO

Checklist requirements from `TourPlanner_Checklist_Final.xlsx`:

- [x] Must have: uses C# or Java for backend.
- [x] Must have: uses Angular as frontend framework.
- [x] Must have: uses MVVM for UI.
- [x] Must have: implements a layer-based architecture (UI/BL/DAL).
- [x] Must have: implements at least one design pattern.
- [x] Must have: uses a Postgres database for storing tour data.
- [ ] Must have: does not allow for SQL injection.
- [x] Must have: uses an OR-mapping library.
- [x] Must have: uses configuration, not code, at minimum for the DB connection string.
- [x] Must have: integrates the OpenRouteServices.org API and Leaflet.
- [x] Must have: implements at least 20 unit tests.
  - Backend test suite currently passes with 41 tests after the weather snapshot implementation.
- [x] GUI: correct data binding between UI elements and view model properties.
- [ ] GUI: UI responds to window size changes.
- [x] GUI: defines a reusable UI component.
- [ ] Tours: create, modify, and delete tours, also in DAL.
- [x] Tours: tours have required attributes, including image, and are managed in a list view.
- [x] Tours: tours have computed attributes.
  - Popularity is calculated from tour log count.
  - Child-friendliness is calculated from average difficulty, total time, and total distance.
- [x] Tours: tour details show all tour attributes of a selected tour and also the map image.
- [x] Tours: validates user input with no crash on wrong input.
- [ ] Tour Logs: create, modify, and delete tour logs, also in DAL.
- [x] Tour Logs: tour logs have required attributes.
- [x] Tour Logs: show all logs of a selected tour with all log attributes in a list view.
- [x] Tour Logs: validates user input with no crash on wrong input.
- [x] Full-Text Search: search performs full-text search in tours, tour logs, and computed attributes.
  - Active intermediate search tokenizes tour fields, log fields, weather text, and computed labels through `IntermediateTourSearchIndex`.
  - PostgreSQL schema already includes GIN `to_tsvector` indexes for tours, tour logs, and tour log weather.
- [x] Full-Text Search: list of tours according to current search.
  - Tour list ViewModel now refreshes the list from the active search query automatically with debounce.
  - Manual Apply/Refresh and transport-filter changes still trigger immediate reloads.
- [x] Import/Export: export tour data.
  - `GET /api/tours/export` returns the chosen JSON export format with schema version, export timestamp, import-compatible tours, route data, cover-image metadata, logs, and weather snapshots.
- [x] Import/Export: import tour data.
  - `POST /api/tours/import` validates schema and import payloads, preserves route/weather snapshots, and returns imported counts plus created tour IDs.
- [x] Mandatory unique feature.
  - Tour logs get an automatic weather snapshot through the backend weather snapshot service.
  - Open-Meteo archive data is used for historical hourly snapshots, with forecast-hourly fallback for recent/future log hours.
  - The tour detail UI shows provider, dataset, observed/fetched time, lookup coordinate, temperature, humidity, precipitation, wind, and a refresh action.
- [ ] Non-functional: layers only call methods of the immediate layer below or own methods.
- [ ] Non-functional: layers define their own exceptions, no implementation-specific exceptions escape.
- [x] Non-functional: uses the OpenRouteServices.org Directions API for tour retrieval.
- [x] Non-functional: uses Leaflet for the map.
- [ ] Non-functional: all tour data, maybe except image data, is stored in the database.
- [x] Non-functional: all configuration information is stored in configuration, not in code.
- [ ] Non-functional: logs exceptions, errors, and other useful technical information.
- [ ] Non-functional: quality of unit tests (usefulness, no duplicates).
- [ ] Protocol: describes app architecture, including layers, layer contents/functionality, and class diagrams.
- [ ] Protocol: describes use cases, including use-case and sequence diagrams.
- [ ] Protocol: describes UX and includes wireframes.
- [ ] Protocol: describes library decisions where applicable and lessons learned.
- [ ] Protocol: describes implemented design pattern.
- [ ] Protocol: describes unit testing decisions.
- [ ] Protocol: describes unique feature.
- [ ] Protocol: contains tracked time.
- [ ] Protocol: contains link to Git.

Implementation tasks:

1. [ ] Re-read the final checklist and map every must-have to code, tests, or protocol evidence.
2. [ ] Finalize the backend package structure for layered architecture: controller/presentation, business/service, data access/repository, domain/entity, DTO/mapper, configuration, and exception packages.
3. [ ] Replace any intermediate in-memory persistence with PostgreSQL-backed JPA/Hibernate entities and repositories.
   - Use numeric database IDs, but enforce security through authenticated user ownership checks on every tour/log query.
   - Keep the database model independent of the old draft class diagram.
4. [x] Configure PostgreSQL through external configuration only: environment variables, `.env`, or application config templates without committed secrets.
5. [x] Add Flyway migrations for database initialization.
   - Current migration: `mytour-api/src/main/resources/db/migration/V1__init_schema.sql`.
   - Hibernate is configured with `spring.jpa.hibernate.ddl-auto=validate`.
   - Verified against a fresh PostgreSQL database: Flyway applied `V1__init_schema`, created `flyway_schema_history`, and Hibernate validation passed.
   - Target tables: `app_users`, `tours`, `tour_routes`, `tour_logs`, and `tour_log_weather`.
   - Store one cover image per tour as filesystem metadata/path fields on `tours`, not as binary data in PostgreSQL.
6. [ ] Implement Tour CRUD through the full stack: Angular service, controller, business layer, DAL/repository, and database.
7. [ ] Implement TourLog CRUD through the full stack with correct one-tour-to-many-logs relationship.
   - Store difficulty and rating as numeric values from 1 to 5.
8. [ ] Ensure tours and tour logs belong to a single user and cannot leak across users.
   - Repository/service methods must filter by authenticated `user_id`, never by `tour_id` or `log_id` alone.
9. [ ] Implement self-registration and credential-based login.
   - Use username/password credentials with JWT-based authentication.
   - Do not require email addresses, email verification, or email sending.
   - Enforce case-insensitive unique usernames through `username_normalized`.
10. [x] Add backend validation for all incoming tour and tour log DTOs, matching frontend validation where possible.
11. [x] Add centralized exception handling so implementation-specific exceptions do not escape across layers.
   - Added `ApiExceptionHandler` in `mytour-api/src/main/java/org/fhtw/mytourapi/exception` to map `ResponseStatusException`, validation errors, malformed requests, and unexpected failures to the existing `ApiErrorResponse` DTO.
   - Added focused MVC tests for structured 404 and validation responses in `ApiExceptionHandlerTest`.
12. [x] Add a design pattern intentionally and document it, for example repository, strategy, factory, adapter, or mapper.
   - Implemented the Factory pattern with `ApiErrorResponseFactory`, which centralizes construction of structured API error responses.
   - Refactored `ApiExceptionHandler` to use the factory and keep exception classification separate from response construction.
   - Added `ApiErrorResponseFactoryTest` to verify the factory contract directly.
13. [x] Integrate OpenRouteService Directions API for distance, estimated time, and route data.
   - Store route geometry as GeoJSON in a PostgreSQL `jsonb` column.
   - Added configurable backend OpenRouteService client settings through `clients.openrouteservice.*` and `.env.example` values.
   - Added an OpenRouteService Directions client for `/v2/directions/{profile}/geojson`, mapping GeoJSON summary distance/duration and route geometry into `TourRouteDto`.
   - Wired tour create/update and `POST /api/tours/{tourId}/route/refresh` through route calculation.
   - Kept a local fallback route calculation when no `ORS_API_KEY` is configured so local tests and demos still start cleanly.
14. [x] Integrate Leaflet in the Angular UI for actual map display instead of the intermediate placeholder.
   - Added `leaflet` and `@types/leaflet` to the frontend dependencies.
   - Added a `TourMapComponent` that renders `TourRouteDto` route data as a real Leaflet map in the tour detail view.
   - Added `LeafletMapFacade` to keep Leaflet setup, tile layers, route rendering, endpoint markers, bounds fitting, and cleanup outside feature components.
   - Replaced the old static map placeholder with a deferred map component and lightweight loading state.
   - Added a browser-safety unit test for the map facade.
15. [x] Store the cover image externally on the filesystem and store only metadata/path references in the database.
   - Added configurable filesystem storage through `storage.images.*`.
   - Implemented upload/delete for `PUT /api/tours/{tourId}/cover-image` and `DELETE /api/tours/{tourId}/cover-image`.
   - Stored files below the configured image directory with generated safe names and kept only `CoverImageDto` metadata/path references on the tour.
   - Current intermediate service keeps that metadata in memory until the PostgreSQL-backed DAL task is completed; the existing `tours` table/entity already has the matching metadata columns.
16. [x] Implement computed tour attributes: popularity from log count and child-friendliness from difficulty, time, and distance.
   - Store numeric scores for sorting/calculation and non-overlapping text labels for search/display.
   - Avoid searchable negated labels like `not child friendly`; prefer labels such as `family friendly`, `moderate family suitability`, `challenging route`, and `adult oriented`.
   - Added `TourAttributeCalculator` for deterministic popularity and child-friendliness calculation.
   - Recompute tour attributes whenever intermediate tour logs are created, updated, or deleted.
   - Added focused calculator and service tests for the formulas and log-driven refresh behavior.
17. [x] Implement full-text search across tours, tour logs, and computed attributes.
   - Include computed labels like popularity and child-friendliness in the PostgreSQL search document.
   - Add structured filters for exact category matching where full-text search would be ambiguous.
   - Added an intermediate tokenized search index covering tour fields, computed attributes, tour log comments/metrics, and weather text.
   - Wired `q` and `ratingMin` through the backend search path.
   - Existing PostgreSQL migration already includes separate GIN full-text indexes for tours, tour logs, and tour log weather.
   - Added service tests for log-comment search, mixed tour/log query terms, computed-label search, rating filters, and dynamic log index updates.
18. [x] Ensure the tour list updates according to the active search query.
   - Added a debounced latest-request-wins search flow in `ToursListViewModel`.
   - Search input changes now trigger backend search automatically after a short debounce.
   - Transport-filter changes, Apply, Refresh, and Delete reloads still run immediately.
   - Added ViewModel tests for debounced search, immediate transport-filter refresh, and stale response handling.
19. [x] Implement export of tour data in the chosen file format.
   - Added `TourExportService` for the JSON export use case.
   - `GET /api/tours/export` now returns `TourExportDto` instead of the previous not-implemented response.
   - Export includes stable tour ordering, import-compatible tour request data, route data, cover-image metadata, logs, and weather snapshots.
   - Internal ids, user ids, and version fields are not exported in the importable tour/log payload.
   - Added service, controller, and export-to-import-shape tests for the export payload.
20. [x] Implement import of tour data with validation and useful error reporting.
   - Added `TourImportService` for the JSON import use case.
   - `POST /api/tours/import` now imports tours, route data, cover-image metadata, logs, and weather snapshots from the export format.
   - Import validates schema version, route/tour coordinate consistency, safe cover-image paths, and import payload completeness before creating data.
   - Added structured import validation errors through `ImportValidationException`.
   - Added service and controller tests for successful roundtrip import and useful validation errors.
21. [x] Implement the mandatory unique feature and make it visible in the UI.
   - Unique feature: automatic weather snapshot based on the location and time of each tour log.
   - Persist weather data in a one-to-one `tour_log_weather` table linked to `tour_logs`.
   - Use the midpoint between tour start/end coordinates for the weather lookup.
   - Use Open-Meteo as the weather provider: historical hourly weather for older logs, and forecast/current endpoints as fallback for very recent logs if historical data is not available yet.
   - Store only the selected weather snapshot values needed by the application, not the full external API response.
   - Treat weather snapshots as generated immutable data; refetch and replace them when a log's performed time or route coordinates change.
   - Added configurable Open-Meteo REST clients, a weather snapshot client, and a service-level fallback so local demos/tests do not depend on the network.
   - Tour log create/update/refresh now replaces the generated weather snapshot through the weather snapshot service.
   - Tour detail log rows now display the full weather snapshot and can call `POST /api/tours/{tourId}/logs/{logId}/weather/refresh`.
   - The PostgreSQL schema/entity/repository for `tour_log_weather` already exists; full persistent TourLog CRUD remains in the later DAL tasks.
22. [ ] Add logging for exceptions, errors, and useful technical events with the chosen Java logging setup.
23. [x] Add at least 20 useful unit tests covering critical business logic, controllers/services, validation, search, computed attributes, weather snapshots, import/export, and error handling.
   - Backend suite now covers validation/errors, route calculation, computed attributes, search, import/export, cover images, and weather snapshots with 41 passing tests.
24. [ ] Add frontend tests for high-risk UI flows if time allows.
25. [ ] Check SQL injection resistance by relying on JPA/repository parameter binding instead of string-built SQL.
26. [ ] Verify layer rules: each layer only calls its own layer or the immediate layer below.
27. [ ] Complete protocol architecture documentation: class diagram, use-case diagram, sequence diagram for full-text search, and layer description.
   - Database/class diagram draft exists, but full protocol documentation is not complete yet.
28. [ ] Complete protocol sections for library decisions, lessons learned, design pattern, unit test decisions, unique feature, tracked time, and Git link.
29. [ ] Run backend unit tests and fix failures.
   - Backend tests passed for Task 21 on 2026-06-21 with 41 tests; final full-stack verification still belongs to the final packaging pass.
30. [ ] Run frontend build/tests and fix failures.
   - Frontend build and tests passed for Task 21 on 2026-06-21 with 20 tests; `npm run build` still reports the existing initial bundle budget warning.
31. [ ] Run a clean end-to-end manual test from empty database: register, login, create tour, fetch route/map, add logs, fetch weather snapshot, search, filter, import, export, edit, delete.
32. [ ] Confirm final must-haves one by one against the checklist before packaging.
33. [ ] Update README with final setup: database, environment variables, external image directory, backend start, frontend start, tests, and known assumptions.
   - Frontend README has been updated for current setup and API sync; final full-stack README still needs the later persistence/image/auth details.
34. [ ] Prepare final presentation flow with the working solution already started locally.
35. [ ] Create the final zip/source snapshot and verify it contains the final code, README, and protocol PDF.
