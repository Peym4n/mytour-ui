# Tour Planner Implementation TODO

This order is optimized for passing the intermediate hand-in first, then extending the same work into the final hand-in without throwing away the UI foundation.

## Intermediate Hand-In TODO

1. [ ] Re-read the intermediate checklist and mark the exact must-haves: Angular frontend, MVVM-style UI structure, reusable component, responsive UI, CRUD screens, validation, and wireframes.
2. [ ] Define the frontend domain models for `Tour` and `TourLog`, including all required attributes from the spec.
3. [ ] Decide the intermediate data strategy: use Angular services with mock/in-memory data first, then connect the same service API to the backend once endpoints exist.
4. [ ] Build the main Angular shell: routing, navigation, shared layout, empty/error/loading states, and responsive structure.
5. [ ] Implement the tours list view with selection, search/filter if cheap, and clear create/edit/delete actions.
6. [ ] Implement the tour detail view showing all required tour attributes, including an image field and a map placeholder.
7. [ ] Implement tour create/edit forms with Angular validation and user-friendly validation messages.
8. [ ] Implement the tour logs list for the selected tour, showing all required log attributes.
9. [ ] Implement tour log create/edit/delete flows with validation and no-crash handling for invalid input.
10. [ ] Extract at least one reusable Angular UI component used in multiple places, for example a form field wrapper, detail row, confirmation dialog, or empty-state component.
11. [ ] Check MVVM-style separation: components bind to view-model state and delegate data operations to services instead of containing persistence logic directly.
12. [ ] Add a thin Spring Boot integration layer for intermediate safety: REST endpoints for tours and tour logs, even if backed by in-memory data for now.
13. [ ] Connect the Angular data services to the backend endpoints through environment-based API configuration.
14. [ ] Verify frontend CRUD flows against the backend: create, update, delete, select, and display tours and logs.
15. [ ] Test responsive behavior at mobile, tablet, and desktop widths.
16. [ ] Add basic frontend tests or smoke checks for critical UI/service behavior if time allows.
17. [ ] Create/update wireframes for the implemented UI flow and add them to the protocol.
18. [ ] Write the intermediate protocol section describing UX decisions, wireframes, and the current frontend/backend integration boundary.
19. [ ] Run `npm run build` in `mytour-ui` and fix build errors.
20. [ ] Run the backend locally and verify the Angular app can reach it from a clean start.
21. [ ] Update README hand-in instructions: how to start backend, how to start frontend, expected environment variables.
22. [ ] Create the intermediate zip/source snapshot and check that it contains the latest code and README.

## Full Hand-In TODO

1. [ ] Re-read the final checklist and map every must-have to code, tests, or protocol evidence.
2. [ ] Finalize the backend package structure for layered architecture: controller/presentation, business/service, data access/repository, domain/entity, DTO/mapper, configuration, and exception packages.
3. [ ] Replace any intermediate in-memory persistence with PostgreSQL-backed JPA/Hibernate entities and repositories.
4. [ ] Configure PostgreSQL through external configuration only: environment variables, `.env`, or application config templates without committed secrets.
5. [ ] Add migrations or clear database initialization strategy if used by the project.
6. [ ] Implement Tour CRUD through the full stack: Angular service, controller, business layer, DAL/repository, and database.
7. [ ] Implement TourLog CRUD through the full stack with correct one-tour-to-many-logs relationship.
8. [ ] Ensure tours and tour logs belong to a single user and cannot leak across users.
9. [ ] Implement self-registration and credential-based login.
10. [ ] Add backend validation for all incoming tour and tour log DTOs, matching frontend validation where possible.
11. [ ] Add centralized exception handling so implementation-specific exceptions do not escape across layers.
12. [ ] Add a design pattern intentionally and document it, for example repository, strategy, factory, adapter, or mapper.
13. [ ] Integrate OpenRouteService Directions API for distance, estimated time, and route data.
14. [ ] Integrate Leaflet in the Angular UI for actual map display instead of the intermediate placeholder.
15. [ ] Store images externally on the filesystem and store only metadata/path references in the database.
16. [ ] Implement computed tour attributes: popularity from log count and child-friendliness from difficulty, time, and distance.
17. [ ] Implement full-text search across tours, tour logs, and computed attributes.
18. [ ] Ensure the tour list updates according to the active search query.
19. [ ] Implement export of tour data in the chosen file format.
20. [ ] Implement import of tour data with validation and useful error reporting.
21. [ ] Implement the mandatory unique feature and make it visible in the UI.
22. [ ] Add logging for exceptions, errors, and useful technical events with the chosen Java logging setup.
23. [ ] Add at least 20 useful unit tests covering critical business logic, controllers/services, validation, search, computed attributes, import/export, and error handling.
24. [ ] Add frontend tests for high-risk UI flows if time allows.
25. [ ] Check SQL injection resistance by relying on JPA/repository parameter binding instead of string-built SQL.
26. [ ] Verify layer rules: each layer only calls its own layer or the immediate layer below.
27. [ ] Complete protocol architecture documentation: class diagram, use-case diagram, sequence diagram for full-text search, and layer description.
28. [ ] Complete protocol sections for library decisions, lessons learned, design pattern, unit test decisions, unique feature, tracked time, and Git link.
29. [ ] Run backend unit tests and fix failures.
30. [ ] Run frontend build/tests and fix failures.
31. [ ] Run a clean end-to-end manual test from empty database: register, login, create tour, fetch route/map, add logs, search, import, export, edit, delete.
32. [ ] Confirm final must-haves one by one against the checklist before packaging.
33. [ ] Update README with final setup: database, environment variables, backend start, frontend start, tests, and known assumptions.
34. [ ] Prepare final presentation flow with the working solution already started locally.
35. [ ] Create the final zip/source snapshot and verify it contains the final code, README, and protocol PDF.
