

## Angular 20
Reactive State Architecture with Signals
## SWEN2 | BIF4

Table of Contents
State in Modern Frontend Applications
Types of State (UI, Domain, Derived)
Single Source of Truth
Writable State with signal()
Derived State with computed()
Side Effects with effect()
## State Initialization & Lifecycle
Signals, SSR & Hydration
Guarding Invariants in the State Layer
## Typical Architecture Errors
Angular 20 – Unit 4 | SWEN2
## 1

State in Modern Frontend Applications

State is everything that influences what the user sees.
## Examples:
which item is selected
which filters are active
which panels are open
which data is currently visible
Whenever state changes, the UI must update deterministically.
Angular 20 – Unit 4 | SWEN2
## 2

Types of State

Frontend applications usually contain three distinct kinds of state:
## 1. Domain State
Business-relevant data.
## Examples:
items
users
selections
filters
Angular 20 – Unit 4 | SWEN2
## 3

- UI State
Purely visual or interaction-related.
## Examples:
open / closed
active tab
loading flags
Angular 20 – Unit 4 | SWEN2
## 4

## 3. Derived State
Values that can be calculated from other state.
## Examples:
“is anything selected?”
“are there results?”
“is the form valid?”
Derived state must never be stored manually.
Angular 20 – Unit 4 | SWEN2
## 5

Single Source of Truth

Shared state must exist exactly once.
If the same information exists in multiple places:
components fall out of sync
UI behavior becomes order-dependent
bugs appear that are hard to reproduce
In Angular, the single source of truth is typically:
a dedicated state service
implemented using signals
Angular 20 – Unit 4 | SWEN2
## 6

Writable State with signal()

Writable signals represent facts about the application.
readonly selectedItemId = signal<string | null>(null);
readonly activeCategory = signal<Category>('all');
## Rules:
writable signals live in the state service
they represent facts, not UI rules
they are never derived from other signals
Angular 20 – Unit 4 | SWEN2
## 7

Controlled writes (intent methods)
State changes should express intent, not mechanics.
selectItem(id: string): void {
this.selectedItemId.set(id);
## }
clearSelection(): void {
this.selectedItemId.set(null);
## }
## Benefits:
every state change is traceable
invariants are easier to enforce
components cannot corrupt shared state
Angular 20 – Unit 4 | SWEN2
## 8

Derived State with computed()

Derived state answers questions about state.
readonly hasSelection = computed(() =>
this.selectedItemId() !== null
## );
## Properties:
read-only
deterministic
automatically updated
cached until dependencies change
Angular 20 – Unit 4 | SWEN2
## 9

Why computed() is essential
Without computed signals:
logic leaks into templates
rules are duplicated across components
behavior diverges over time
Computed signals centralize UI rules.
Angular 20 – Unit 4 | SWEN2
## 10

Side Effects with effect()

Effects exist for interacting with the outside world.
Typical side effects:
persistence (LocalStorage / IndexedDB)
URL synchronization
logging
integration with browser APIs
reacting to SSR → client hydration
Effects are not state and not derivation.
Angular 20 – Unit 4 | SWEN2
## 11

Example: persistence effect
effect(() => {
const snapshot = this.items();
localStorage.setItem('items', JSON.stringify(snapshot));
## });
## Rules:
effects may read signals
effects must not compute new state
effects must not update the signals they depend on
Angular 20 – Unit 4 | SWEN2
## 12

Why effects must be rare
Overusing effects leads to:
hidden execution order
feedback loops
state changes that are hard to trace
## Rule:
If it can be expressed with computed(), do NOT use effect().
## “
## “
Angular 20 – Unit 4 | SWEN2
## 13

## State Initialization & Lifecycle

State has a lifecycle:
creation
initialization
updates
optional reset
Typical initialization patterns:
default values
hydration from storage
hydration from SSR
Initialization must be:
deterministic
side-effect free
Angular 20 – Unit 4 | SWEN2
## 14

Signals, SSR & Hydration

With SSR enabled:
state may be created on the server
HTML is rendered using that state
the client hydrates and continues
Important rules:
do NOT access browser APIs during construction
browser-only logic belongs in effects
hydration must not change visible state
provideClientHydration() enables this handover.
Angular 20 – Unit 4 | SWEN2
## 15

Guarding Invariants in the State Layer

The state service is responsible for invariants.
## Examples:
only one item can be selected
categories must be valid
derived flags must stay consistent
Invariants belong:
in the state service
not in components
not in templates
This keeps behavior predictable.
Angular 20 – Unit 4 | SWEN2
## 16

## Typical Architecture Errors

Common mistakes:
duplicating shared state in components
writing to signals from many places
using effect() for calculations
encoding logic in templates
## Symptoms:
unpredictable UI
fragile refactoring
bugs that depend on interaction order
Angular 20 – Unit 4 | SWEN2
## 17