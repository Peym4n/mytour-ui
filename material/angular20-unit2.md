

## Angular 20
## Templates & Control Flow
## SWEN2 | BIF4

Table of Contents
Templates (View Layer)
## Binding Types
## Modern Angular Control Flow
## Pipes
## Further Reading
Angular 20 - Unit2 | SWEN2 | BIF4
## 1

## Templates – The Angular View Layer

What is a template?
Angular templates are HTML + Angular syntax.
They define the View in MVVM:
They show UI elements
They bind values from the component
They react to user events
They control rendering flow
Angular 20 - Unit2 | SWEN2 | BIF4
## 2

Template building blocks
Templates combine:
Standard HTML
Angular bindings ({{ }}, [ ], ( ), [( )])
Control-flow blocks
Pipes for formatting
Embedded components
Angular processes the template and produces efficient DOM updates.
Angular 20 - Unit2 | SWEN2 | BIF4
## 3

## Binding Types

Interpolation — show values
<p>Hello {{ username }}</p>
<p>Total: {{ total() }}</p>
Used for:
## Text
Reading signal values
Reading computed values
## Rules:
Must be side-effect free
Should be simple expressions
Angular 20 - Unit2 | SWEN2 | BIF4
## 4

Property Binding — update element properties
<img [src]="avatarUrl">
## <input [value]="title">
<button [disabled]="isLoading">Save</button>
## Direction: Component → View
Used whenever you need to bind real HTML properties, not attributes.
Angular 20 - Unit2 | SWEN2 | BIF4
## 5

Event Binding — react to user interaction
<button (click)="addTask()">Add</button>
<input (input)="onTitleEdit($event)">
## Direction: View → Component
Events trigger component logic.
Angular 20 - Unit2 | SWEN2 | BIF4
## 6

Two-Way Binding — sync view + model
<input [(ngModel)]="title">
Angular expands this to:
<input [ngModel]="title" (ngModelChange)="title = $event">
Useful for:
Simple forms
Quick data entry
Demo components
## Requires:
imports: [FormsModule]
Angular 20 - Unit2 | SWEN2 | BIF4
## 7

## Modern Angular Control Flow

## Why @if, @for, @switch, @defer?
Angular 20 replaces old structural directives (*ngIf, *ngFor, ...) with built-in template control
blocks:
They provide:
Better performance
Clearer syntax
More features (track, @empty, triggers...)
Simpler mental model
Angular 20 - Unit2 | SWEN2 | BIF4
## 8

@if — conditional rendering
## @if (tasks.length > 0) {
<p>You have tasks.</p>
## } @else {
<p>No tasks yet.</p>
## }
## Features:
Cleaner than *ngIf
Supports @else blocks
Works seamlessly with signals
Angular 20 - Unit2 | SWEN2 | BIF4
## 9

@for — list rendering
@for (task of tasks; track task.id) {
<li>{{ task.title }}</li>
## } @empty {
<li>No tasks available.</li>
## }
Loops over the array
Creates DOM nodes for each element
Efficiently updates items when the signal changes
Angular 20 - Unit2 | SWEN2 | BIF4
## 10

Without track:
Angular identifies list entries by index
Reordering causes DOM destruction and recreation
With track item.id:
Angular identifies each item by a stable key
DOM nodes remain intact
Performance and UI stability improve
## Example:
@for (user of users(); track user.id) {
## <user-card [user]="user"></user-card>
## }
Angular 20 - Unit2 | SWEN2 | BIF4
## 11

@empty – fallback rendering
Rendered when the list is empty:
@for (task of tasks()) {
<li>{{ task.title }}</li>
## } @empty {
<li>No tasks available.</li>
## }
Angular automatically switches to the @empty block when needed.
Angular 20 - Unit2 | SWEN2 | BIF4
## 12

@switch — multi-branch conditions
## @switch (status) {
@case ('loading') { <p>Loading...</p> }
@case ('error')   { <p>Error!</p> }
@default          { <p>Ready.</p> }
## }
Use when a value can have multiple states.
Angular 20 - Unit2 | SWEN2 | BIF4
## 13

@defer — delayed rendering for performance
@defer (on viewport) {
## <task-stats></task-stats>
## } @placeholder {
<p>Loading stats...</p>
## } @loading {
<p>Preparing...</p>
## }
@defer tells Angular:
This improves performance for:
Heavy components
## Charts
Non-critical UI sections
“Render this block later, not during initial load.”
## “
## “
Angular 20 - Unit2 | SWEN2 | BIF4
## 14

## Triggers
on viewport
Render when the block enters the viewport:
@defer (on viewport) {
## <chart></chart>
## }
on idle
Render when the browser is idle:
@defer (on idle) {
## <stats-panel></stats-panel>
## }
Angular 20 - Unit2 | SWEN2 | BIF4
## 15

on interaction(target)
Render after a specific element receives interaction:
<button #btn>Show Stats</button>
@defer (on interaction(btn)) {
## <stats-panel></stats-panel>
## }
on timer(ms)
Render after a pause:
@defer (on timer(2000)) {
## <promo-banner></promo-banner>
## }
Angular 20 - Unit2 | SWEN2 | BIF4
## 16

## Placeholder & Loading
@defer (on idle) {
## <chart></chart>
## } @placeholder {
<p>Preparing...</p>
## } @loading {
<p>Loading chart...</p>
## }
## Meaning:
@placeholder – shown before loading starts
@loading – shown while the deferred content initializes
Angular 20 - Unit2 | SWEN2 | BIF4
## 17

## Pipes

What pipes are
Pipes format values directly in templates, without changing the underlying data.
## Syntax:
{{ value | pipeName }}
Pipes help with:
## Dates
## Currency
Text formatting
List formatting
Display conversions
Angular 20 - Unit2 | SWEN2 | BIF4
## 18

Built-in pipes
<p>{{ today | date:'dd.MM.yyyy' }}</p>
<p>{{ price | currency:'EUR' }}</p>
<p>{{ name | uppercase }}</p>
Common use cases:
date → formats JavaScript dates
currency → formats numbers as localised currency
uppercase / lowercase → text transformations
Angular 20 - Unit2 | SWEN2 | BIF4
## 19

Custom pipes
@Pipe({ name: 'upper', standalone: true })
export class UpperPipe {
transform(v: string): string {
return v.toUpperCase();
## }
## }
## Usage:
<p>{{ username | upper }}</p>
## Rules:
Pipes should be pure (same input → same output)
Should not contain heavy logic
Angular 20 - Unit2 | SWEN2 | BIF4
## 20

## Further Reading

## Templates
https://angular.dev/guide/templates
## Control Flow Blocks
https://angular.dev/guide/templates/control-flow
Forms & ngModel
https://angular.dev/guide/forms
## Pipes
https://angular.dev/guide/pipes
Angular 20 - Unit2 | SWEN2 | BIF4
## 21