

## Angular 20
## Component Composition & Communication
## SWEN2 | BIF4

Table of Contents
Many Components, One UI
Communication Styles in Angular
Parent → Child: @Input()
Child → Parent: @Output()
## Why Direct Wiring Breaks Down
## Mediator Pattern
Mediator in Angular: A Service as App State
Shared State with Signals
Dependency Injection with inject()
## Recommended Component Roles
## Further Reading
Angular 20 – Unit 3 | SWEN2 | BIF4
## 1

Many Components, One UI

Component composition is the default
A typical UI is not a single component. It is a composition of many pieces:
## Header / Toolbar
## Sidebar / Filters
Main content area (lists, tables)
Detail panel / editor
Status & notifications
Key requirement:
Components must coordinate without becoming tightly coupled.
## “
## “
Angular 20 – Unit 3 | SWEN2 | BIF4
## 2

What is “communication” here?
“Communication” means:
Passing data (state)
Signaling user intent (events)
Coordinating multiple parts of the UI
## Examples:
A filter change updates a list
A selection updates a details panel
A toolbar action triggers a list refresh
The goal is clear data flow and low coupling.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 3

Communication Styles in Angular

Three building blocks
Angular offers three clean ways to connect components:
## 1. Parent → Child
Parent provides data to a child via inputs.
## 2. Child → Parent
Child emits an event via outputs.
- Shared state via a mediator service
Multiple components read/write shared state through a service.
Each solves a different type of communication problem.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 4

Parent → Child: @Input()

The idea
Inputs are used when:
A parent owns the data
A child only displays or uses the data
The data flows downward
## Template (parent):
## <app-product-card [product]="p"></app-product-card>
## Child:
@Input({ required: true }) product!: Product;
Angular 20 – Unit 3 | SWEN2 | BIF4
## 5

required: true
@Input({ required: true }) product!: Product;
This makes the component API clearer:
The parent must provide the value
Missing inputs fail early (better than silent bugs)
Angular 20 – Unit 3 | SWEN2 | BIF4
## 6

transform on inputs
transform lets you normalize input values at the boundary.
@Input({
required: true,
transform: (v: string) => v.trim()
## })
title!: string;
Typical uses:
Trim text
Convert types
Enforce defaults
Defensive normalization
Important: this is not “business logic” — it is API hygiene of the component.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 7

Child → Parent: @Output()

The idea
Outputs are used when:
The parent owns the state
The child triggers an action or intent
The data flow is upward (event-based)
## Child:
@Output() remove = new EventEmitter<string>();
onRemoveClicked(id: string) {
this.remove.emit(id);
## }
Parent template:
<app-item (remove)="removeItem($event)"></app-item>
Angular 20 – Unit 3 | SWEN2 | BIF4
## 8

Good mental model
@Input() = data down
@Output() = events up
This keeps ownership clear:
State stays where it belongs
Child components remain reusable
Angular 20 – Unit 3 | SWEN2 | BIF4
## 9

## Why Direct Wiring Breaks Down

The scaling problem
Direct wiring becomes messy when:
Many siblings need to coordinate
You get event chains like: Toolbar → Parent → List → Detail
Components start “knowing too much” about each other
## Symptoms:
Long templates full of bindings
Hidden dependencies (hard to see what triggers what)
Refactoring a layout breaks behavior
This is where the Mediator Pattern helps.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 10

## Mediator Pattern

## Definition
A mediator is an object that:
Centralizes coordination logic
Decouples participants
Reduces “many-to-many” dependencies
Instead of components talking to each other:
Components talk to the mediator
The mediator coordinates state and actions
Angular 20 – Unit 3 | SWEN2 | BIF4
## 11

Angular 20 – Unit 3 | SWEN2 | BIF4
## 12

## Benefits
Components stay independent
Changes in one component do not force changes in others
Data flow becomes explicit
Testing becomes easier (service can be tested in isolation)
Angular 20 – Unit 3 | SWEN2 | BIF4
## 13

Mediator in Angular: A Service as App State

Why a service works as mediator
Angular already provides:
## Dependency Injection
Service lifecycles (providedIn: 'root')
A natural place to store state and expose intent methods
A mediator service should:
Hold shared state
Expose operations (“intent”)
Avoid UI concerns (no DOM, no HTML assumptions)
Angular 20 – Unit 3 | SWEN2 | BIF4
## 14

Example: Shared UI state
@Injectable({ providedIn: 'root' })
export class AppStateService {
// Shared state as signals
readonly selectedCategory = signal<Category>('all');
readonly searchText = signal<string>('');
// Intent methods (write operations)
setCategory(cat: Category): void {
this.selectedCategory.set(cat);
## }
setSearch(text: string): void {
this.searchText.set(text);
## }
## }
This turns “component communication” into “shared reactive state”.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 15

Shared State with Signals

Why signals fit shared state
Signals are ideal here because they are:
Synchronous and easy to read
Reactive: all consumers update automatically
Minimal API (set/update/computed)
No RxJS required for this level of complexity
Components can subscribe simply by reading signals in templates.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 16

Derived state with computed()
A mediator service can also expose derived state:
readonly hasSearch = computed(() =>
this.searchText().trim().length > 0
## );
This keeps logic out of templates and keeps it reusable for multiple components.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 17

Dependency Injection with inject()

What inject() is
inject() asks Angular’s DI container for an instance.
private readonly state = inject(AppStateService);
This is equivalent to constructor injection, but:
Works without adding constructor parameters
Can be used in fields and functions
Aligns with Angular’s functional provider APIs
Angular 20 – Unit 3 | SWEN2 | BIF4
## 18

Constructor DI vs. inject()
Constructor DI:
constructor(private state: AppStateService) {}
Field injection:
private readonly state = inject(AppStateService);
Both are valid.
This unit shows inject() because it is the modern, concise style.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 19

inject() inside services
You can also inject dependencies inside services:
@Injectable({ providedIn: 'root' })
export class AppStateService {
private readonly router = inject(Router);
goHome(): void {
this.router.navigate(['/']);
## }
## }
Use this when a service needs infrastructure dependencies.
Angular 20 – Unit 3 | SWEN2 | BIF4
## 20

## Recommended Component Roles

A practical separation
A common, maintainable split:
Shell component
Layout + router outlet + common UI parts
Presentational components
Mostly inputs, minimal logic, reusable
Feature components
Orchestrate a feature area, interact with the mediator
Mediator service (AppState)
Shared state + intent methods, no UI assumptions
Angular 20 – Unit 3 | SWEN2 | BIF4
## 21

## Further Reading

## Dependency Injection
https://angular.dev/guide/di
## Signals
https://angular.dev/guide/signals
Mediator pattern (concept)
https://refactoring.guru/design-patterns/mediator
Angular 20 – Unit 3 | SWEN2 | BIF4
## 22