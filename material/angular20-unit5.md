

## Angular 20
Observables & Signals Interop (RxJS)
## SWEN2 | BIF4

Table of Contents
## Observer Pattern
From Observer Pattern to Reactive Streams
Observable Basics (RxJS)
Cold vs Hot Observables
Operators & Pipelines (pipe, map, filter, ...)
## Subscription Lifecycle & Cleanup
Concurrency Operators (switchMap, mergeMap, ...)
Caching & Sharing (shareReplay)
## Error & Completion Handling
## Observables  Signals Interop
async Pipe vs toSignal
Signals vs Observables (Guidelines)
## Further Reading
Angular 20 – Unit 5 | SWEN2 | BIF4
## 1

## Observer Pattern

Angular 20 – Unit 5 | SWEN2 | BIF4
## 2

## Core Idea
The Observer Pattern is a behavioral design pattern.
It enables a subscriber to register with and receive notifications from a provider.
It's useful for many scenarios that require push-based notification.
A Subject (Provider, Publisher) emits events.
Zero, one or multiple Observers subscribe and are notified when changes occur.
Push-based communication
Loose coupling
Widely used in GUIs, event systems, reactive programming
Mental model: “Tell me when something happens.”
Angular 20 – Unit 5 | SWEN2 | BIF4
## 3

Angular 20 – Unit 5 | SWEN2 | BIF4
## 4

Push vs Pull
Push model (Observer Pattern):
Subject actively notifies observers
Observers react immediately
Efficient for dynamic systems
Pull model:
Consumers repeatedly request data
Tight coupling
Inefficient for UI and async systems
Modern frontend architectures rely on push, not pull.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 5

From Observer Pattern to Reactive Streams

Reactive streams extend the observer idea with:
Streams of values over time
Error and completion channels
Composable operators
Explicit lifecycle semantics
RxJS is a standard implementation of this model.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 6

Observable Basics (RxJS)

RxJS (Reactive Extensions for JavaScript) is a library for building asynchronous and event-based
applications using Observables, which treat data and events as streams, making it easier to manage
complex data flows.
With Angular 20, Signals have become the new primary tool for state management and fine-grained
reactivity. Still, Observables remain a backbone of the ecosystem — especially for asynchronous
operations such as HTTP requests, websockets, and event streams.
It’s not “Signals versus Observables,” but rather Signals and Observables working together, each
solving different problems.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 7

RxJS uses Observable as the stream abstraction; it follows the observer idea but adds operators and
lifecycle semantics.
An Observable<T> represents a stream of values over time.
It can emit:
next(value) → data
error(err) → failure (terminates stream)
complete() → successful end
## Creating Observables
import { of, interval, fromEvent } from 'rxjs';
of(1, 2, 3).subscribe(console.log);
interval(1000).subscribe(n => console.log(n));
fromEvent(document, 'click').subscribe(() => console.log('click'));
Observables are lazy: nothing happens until you subscribe.
In Angular, long-lived streams (events/interval) must be lifecycle-bound (see Cleanup).
Angular 20 – Unit 5 | SWEN2 | BIF4
## 8

Cold vs Hot Observables

## Cold Observables
Each subscription triggers a new execution
Typical example: HTTP requests
## Hot Observables
Producer exists independently of subscribers
Examples: DOM events, subjects, websockets
Angular 20 – Unit 5 | SWEN2 | BIF4
## 9

## Operators & Pipelines

Operators are pure functions provided by RxJS.
They take:
one observable as input
and return a new observable as output
They do not:
execute work
change the original stream
Some operators are internally stateful (e.g. scan), but the source observable is never mutated.
They describe how values will flow once a subscription happens.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 10

Think of an observable pipeline like a conveyor belt:
the source emits values
operators sit in between
each operator transforms, filters, or redirects values
subscribe() turns the machine on
Without subscribe(), nothing moves.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 11

## Example:
import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';
of(1, 2, 3).pipe(
map(x => x * 10),
filter(x => x > 10),
## ).subscribe(console.log); // 20, 30
pipe(...) builds a pipeline; operators transform/filter values before they reach the subscriber.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 12

import { Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
private readonly destroyRef = inject(DestroyRef);
private readonly platformId = inject(PLATFORM_ID);
constructor() {
if (isPlatformBrowser(this.platformId)) {
fromEvent(document, 'click')
.pipe(takeUntilDestroyed(this.destroyRef))
.subscribe(() => console.log('click'));
## }
## }
## }
Long-lived streams (events, intervals, sockets) must be cleaned up.
takeUntilDestroyed(...) binds the subscription to the component lifecycle.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 13

Operators are composable
Because operators:
are composable
always return a new observable
they can be:
reused
reordered
tested in isolation
Angular 20 – Unit 5 | SWEN2 | BIF4
## 14

## Subscription Lifecycle & Cleanup

Some observables never complete on their own:
DOM events
interval
websockets
If not cleaned up:
memory leaks occur
background work continues
Angular 20 – Unit 5 | SWEN2 | BIF4
## 15

import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
private readonly destroyRef = inject(DestroyRef);
bind(stream$: any): void {
stream$
.pipe(takeUntilDestroyed(this.destroyRef))
## .subscribe();
## }
## }
Cleanup happens automatically when the component is destroyed.
The pipeline is tied to the component lifecycle.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 16

## Concurrency Operators

Events may occur faster than async work completes.
"What should happen if a new value arrives while work is running?"
Core concurrency operators
switchMap
cancels previous work
keeps only the latest
mergeMap
runs everything in parallel
concatMap
queues values
preserves order
exhaustMap
ignores new values while busy
Angular 20 – Unit 5 | SWEN2 | BIF4
## 17

Example: cancel previous work
search$.pipe(
switchMap(term => http.get(`/api/search?q=${term}`))
## );
Only the latest request matters.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 18

## Caching & Sharing

Cold observables restart for each subscription.
HTTP requests are cold by default.
Sharing results
http.get('/api/items').pipe(
shareReplay({ bufferSize: 1, refCount: true })
## );
Prevents duplicate HTTP calls
Shares latest value across subscribers
one execution, many consumers
cached latest value
Angular 20 – Unit 5 | SWEN2 | BIF4
## 19

## Error & Completion Handling

Errors belong inside the pipeline
source$.pipe(
map(data => ({ state: 'success', data })),
catchError(err => of({ state: 'error', err })),
startWith({ state: 'loading' })
## );
Errors become data, not control flow.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 20

## Observables  Signals Interop

Angular 20 – Unit 5 | SWEN2 | BIF4
## 21

Angular 20 uses:
## Signals
synchronous state
UI reactivity
## Observables
async workflows
external data
concurrency control
Pipelines stay in RxJS.
State lives in signals.
Interop connects both worlds.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 22

## Observable → Signal
const users = toSignal(users$, { initialValue: [] });
The pipeline remains unchanged.
The UI consumes a signal.
## Signal → Observable
toObservable(searchSignal).pipe(
debounceTime(300),
switchMap(q => http.get(...))
## );
Signals feed pipelines.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 23

A pipeline is:
a declarative async flow
built from pure operators
executed by subscription
managed by lifecycle-aware cleanup
bridged to UI state via signals
Angular 20 – Unit 5 | SWEN2 | BIF4
## 24

async Pipe vs toSignal

Both async and toSignal() connect Observables to the UI.
The difference is not syntax
The difference is where the value lives.
async pipe — template consumption
The async pipe is used when:
an Observable is only needed in the template
the component class does not depend on the value
no derived state is built on top of it
The Observable stays an Observable.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 25

@if (users$ | async; as users) {
## <ul>
@for (user of users; track user.id) {
<li>{{ user.name }}</li>
## }
## </ul>
## } @else {
<p>Loading...</p>
## }
Angular 20 – Unit 5 | SWEN2 | BIF4
## 26

What async does NOT do
The async pipe:
does not integrate the value into component state
cannot be used inside computed() or effects
cannot be synchronously read in TypeScript
cannot easily coordinate multiple streams
It is a view-only adapter, not a state tool.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 27

toSignal() — state integration
toSignal() converts an Observable into a Signal.
Use it when:
the value is part of application or component state
other signals depend on it
you want synchronous access in TypeScript
you want one unified reactive graph
readonly users = toSignal(users$, { initialValue: [] });
Now users() behaves like any other signal.
Angular 20 – Unit 5 | SWEN2 | BIF4
## 28

What changes with toSignal()
After conversion:
the Observable lifecycle still exists
but the UI reads synchronously via signals
computed() and effects can depend on the value
templates no longer need async
readonly activeUsers = computed(() =>
this.users().filter(u => u.active)
## );
Angular 20 – Unit 5 | SWEN2 | BIF4
## 29

Same data — different architecture
Aspectasync pipetoSignal()
Where value livesTemplate onlyComponent / app state
Sync access in TS No Yes
Used in computed() No Yes
State composition Limited Natural
Best forSimple bindingsState-driven UI
Angular 20 – Unit 5 | SWEN2 | BIF4
## 30

Signals vs Observables

Observables handle asynchronous workflows
(HTTP, timers, events, streams)
## Signals
UI and application state
## Synchronous
Fine-grained reactivity
Use async when you just want to display a stream
Use toSignal() when the stream becomes state
Rule of thumb:
## State = Signals, Async = Observables
## “
## “
Angular 20 – Unit 5 | SWEN2 | BIF4
## 31

## Further Reading

Observables in Angular 20
https://medium.com/@dowglasmaia/observables-in-angular-20-practical-patterns-for-modern-
frontend-execution-499f556bc3f8
RxJS Interop with Angular Signals
https://angular.dev/ecosystem/rxjs-interop
## Observer Design Pattern
https://learn.microsoft.com/en-us/dotnet/standard/events/observer-design-pattern
Angular 20 – Unit 5 | SWEN2 | BIF4
## 32