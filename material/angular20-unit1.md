

## Angular 20
## Modern Architecture & Core Concepts
## SWEN2 | BIF4

Table of Contents
What is Angular 20?
Single-Page Applications (SPA)
Creating a Project (CLI & IDE)
## Project Structure & Entry Points
## Standalone Components
## Routing
MVVM in Angular
## Signals
Dependency Injection (DI)
SSR (Server-Side Rendering) – Concept
## Further Reading
Angular 20 - Unit1 | SWEN2 | BIF4
## 1

What is Angular 20?

Angular 20 is a frontend framework for building web
applications:
Written in TypeScript, compiled to JavaScript
Runs mainly in the browser as a Single-Page
Application (SPA)
Uses standalone components
Uses Signals for reactive UI state
Includes a router for client-side navigation
Has a built-in Dependency Injection (DI) system
Can optionally use Server-Side Rendering (SSR) with
## Node.js
Angular 20 - Unit1 | SWEN2 | BIF4
## 2

Where Angular code runs
## Browser
Renders HTML + CSS
Executes the compiled Angular + app code
Handles routing, signals, user events
Server (optional, SSR)
Renders the first HTML response
Uses Node.js + Express + Angular SSR runtime
Sends HTML to the browser, then the SPA continues there
Angular 20 is SPA-first. SSR is an add-on, not a replacement.
Angular 20 - Unit1 | SWEN2 | BIF4
## 3

Single-Page Applications (SPA)

SPA – core idea
A Single-Page Application (SPA):
Loads one HTML document (index.html) once
Downloads JavaScript bundles (Angular + app code)
Uses JavaScript to update the visible content
Changes the URL via the History API (no full reloads)
The user feels like visiting multiple pages, but technically one Angular app is running the whole time.
Angular 20 - Unit1 | SWEN2 | BIF4
## 4

SPA lifecycle
- Browser requests index.html
- index.html loads Angular bundles (JS/CSS)
- Angular bootstraps the root component (App)
- Router watches the address bar
- Router chooses the matching route
- Angular renders the routed component inside <router-outlet>
Angular 20 - Unit1 | SWEN2 | BIF4
## 5

Consequences of SPA architecture
Fast navigation (no full page reloads)
UI state can stay in memory across route changes
Backend usually provides JSON APIs, not HTML pages
Great for tools, admin UIs, dashboards, complex forms
Requires client-side routing and a clear UI architecture
Angular 20 - Unit1 | SWEN2 | BIF4
## 6

Creating a Project (CLI & IDE)

Angular CLI – new project
# Create a new Angular 20 project (no test files)
ng new angular-unit1-demo   --standalone   --routing   --style=css   --skip-tests
cd angular-unit1-demo
# Start dev server
ng serve
Options used here:
--standalone → modern standalone architecture
--routing → adds router setup and app.routes.ts
--style=css → use plain CSS files
--skip-tests → do not generate .spec.ts test files (not updated to Angular20 yet)
Angular 20 - Unit1 | SWEN2 | BIF4
## 7

Angular CLI – generate components
Components can be generated via CLI:
ng generate component home --standalone --skip-tests
Each command creates a folder with:
*.ts → component class
*.html → template
*.css → styles
Angular 20 - Unit1 | SWEN2 | BIF4
## 8

IDE options
Angular projects can also be created from IDE templates:
VS Code
Use the integrated terminal with Angular CLI
IntelliJ / WebStorm / Rider
“New Angular Project” → internally calls Angular CLI
## Visual Studio
Angular + .NET templates (for mixed frontend/backend projects)
Angular 20 - Unit1 | SWEN2 | BIF4
## 9

## Project Structure & Entry Points

High-level project structure (Angular 20)
angular-project/
angular.json
package.json
tsconfig.json
src/
index.html
main.ts
main.server.ts      (SSR)
server.ts           (SSR, Express)
styles.css
app/
app.ts
app.html
app.css
app.config.ts
app.routes.ts
home/
home.css
home.html
home.ts
Angular 20 - Unit1 | SWEN2 | BIF4
## 10

index.html – only HTML file from the server
src/index.html:
## <body>
## <app-root></app-root>
## </body>
The server delivers this file once
<app-root> is a placeholder element
Angular replaces <app-root> with the root component (App) at runtime
All dynamic content comes from Angular, not directly from index.html.
Angular 20 - Unit1 | SWEN2 | BIF4
## 11

main.ts – browser entry point
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
bootstrapApplication(App, appConfig)
.catch(err => console.error(err));
## Responsibilities:
Bootstraps the root component App in the browser
Applies appConfig for global providers (router, hydration, etc.)
No NgModule – Angular 20 uses standalone components
Angular 20 - Unit1 | SWEN2 | BIF4
## 12

main.server.ts & server.ts – SSR entry points (concept)
If SSR was enabled in ng new, Angular adds:
// src/main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
export default function bootstrap() {
return bootstrapApplication(App, appConfig);
## }
Angular 20 - Unit1 | SWEN2 | BIF4
## 13

and a Node/Express server:
// src/server.ts
import { AngularNodeAppEngine } from '@angular/ssr/node';
import express from 'express';
const app = express();
const angularApp = new AngularNodeAppEngine();
app.use((req, res, next) => {
angularApp
## .handle(req)
.then(response => { /* render HTML */ })
## .catch(next);
## });
Concept: the server can render the first view before the SPA takes over in the browser.
Angular 20 - Unit1 | SWEN2 | BIF4
## 14

## Standalone Components

Root component: App
// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header';
@Component({
selector: 'app-root',
standalone: true,
imports: [RouterOutlet, HeaderComponent],
templateUrl: './app.html',
styleUrls: ['./app.css'],
## })
export class App {
// Root shell component: hosts the header and the router outlet.
## }
selector: 'app-root' → matches <app-root> in index.html
standalone: true → no NgModule, modern Angular style
imports → other standalone components/directives used in the template
Angular 20 - Unit1 | SWEN2 | BIF4
## 15

Root template: app.html
<!-- src/app/app.html -->
## <app-header></app-header>
<main class="app-content">
## <router-outlet></router-outlet>
## </main>
<app-header> → header component
<router-outlet> → placeholder where routed components (Home, About, ...) appear
Angular 20 - Unit1 | SWEN2 | BIF4
## 16

Feature components
// src/app/home/home.ts
@Component({
selector: 'app-home',
standalone: true,
templateUrl: './home.html',
styleUrls: ['./home.css'],
## })
export class HomeComponent {}
HeaderComponent is part of the shell, not routed
e.g. HomeComponent, HeaderComponent are pages, used via routing
Angular 20 - Unit1 | SWEN2 | BIF4
## 17

## Routing

Routing configuration
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { AboutComponent } from './about/about';
export const routes: Routes = [
{ path: '', component: HomeComponent },
{ path: 'about', component: AboutComponent },
{ path: '**', redirectTo: '' },
## ];
'' → start page (Home)
'about' → About page
'**' → wildcard / fallback for unknown paths
Angular 20 - Unit1 | SWEN2 | BIF4
## 18

Router provider in app.config.ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
export const appConfig: ApplicationConfig = {
providers: [
provideRouter(routes),
provideClientHydration(),
## ],
## };
provideRouter(routes) makes the router available via DI
provideClientHydration() connects SSR-rendered HTML with the SPA (if SSR is used)
Both are infrastructure providers for the whole app
Angular 20 - Unit1 | SWEN2 | BIF4
## 19

Router in templates
In app.html:
## <router-outlet></router-outlet>
In header.html:
<nav class="nav">
<a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
## Home
## </a>
<a routerLink="/about" routerLinkActive="active">
## About
## </a>
## </nav>
<router-outlet> → Angular renders the active route component here
routerLink → declarative navigation
routerLinkActive → adds CSS class when the link is active
Angular 20 - Unit1 | SWEN2 | BIF4
## 20

MVVM in Angular

MVVM – basic idea
Model–View–ViewModel (MVVM) separates:
## Model
Data and business logic (domain state, services, DTOs, signals)
ViewModel
UI logic, state and actions used by the view (component class)
## View
Pure presentation (HTML + CSS), uses bindings and events
## Goal:
Better testability
Clear separation of concerns
Reusable, maintainable components
Angular 20 - Unit1 | SWEN2 | BIF4
## 21

MVVM mapping in Angular
## In Angular:
## Model
Signals, services, DTO classes, values from APIs
ViewModel
Component class (*.ts) with properties and
methods
## View
Template (*.html) with bindings and event handlers
Angular 20 - Unit1 | SWEN2 | BIF4
## 22

MVVM example: Home component
// ViewModel
@Component({
selector: 'app-home',
standalone: true,
templateUrl: './home.html',
styleUrls: ['./home.css'],
## })
export class HomeComponent {
title = 'Home – Signals and MVVM';
// Model state as signals
count = signal(0);
doubled = computed(() => this.count() * 2);
// ViewModel behavior
increment(): void {
this.count.update(v => v + 1);
## }
reset(): void {
this.count.set(0);
## }
## }
Angular 20 - Unit1 | SWEN2 | BIF4
## 23

## <!-- View -->
<section class="home">
<h2>{{ title }}</h2>
<p>Count: {{ count() }}</p>
<p>Double: {{ doubled() }}</p>
<button type="button" (click)="increment()">Increment</button>
<button type="button" (click)="reset()">Reset</button>
## </section>
Angular 20 - Unit1 | SWEN2 | BIF4
## 24

## Signals

Signals are Angular’s reactive state primitives:
Hold a current value
Keep track of which computed values and templates depend on them
Trigger updates when the value changes
Replace many RxJS patterns in the UI layer
They are synchronous: reading a signal returns the value immediately.
Angular 20 - Unit1 | SWEN2 | BIF4
## 25

Basic signal usage
import { signal, computed } from '@angular/core';
const count = signal(0);
const doubled = computed(() => count() * 2);
// read
console.log(count());
// absolute write
count.set(5);
// update based on previous value
count.update(v => v + 1);
## Properties:
Read: signal()
Write: set(...) or update(...)
computed() is read-only and recomputes automatically
Angular 20 - Unit1 | SWEN2 | BIF4
## 26

Signals in templates
In Angular templates:
<p>Count: {{ count() }}</p>
<p>Double: {{ doubled() }}</p>
<button (click)="increment()">Increment</button>
<button (click)="reset()">Reset</button>
When increment() is called:
- count.update(...) changes the signal value
- doubled is recomputed
- Angular updates only the affected bindings
Angular 20 - Unit1 | SWEN2 | BIF4
## 27

Typical signal pitfalls
Mutating arrays/objects without calling set() afterwards
Using signals for values that never change (overkill)
Angular 20 - Unit1 | SWEN2 | BIF4
## 28

Dependency Injection (DI)

Why DI in Angular?
Dependency Injection provides:
Shared services (router, HTTP, state, logging, facades)
Central control over object creation and lifetime
Loose coupling between components and infrastructure
Angular has a hierarchical DI container and a modern inject() API.
Angular 20 - Unit1 | SWEN2 | BIF4
## 29

DI in app.config.ts (global providers)
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
export const appConfig: ApplicationConfig = {
providers: [
provideRouter(routes),
provideClientHydration(),
// later: HttpClient, custom services, etc.
## ],
## };
provideRouter(routes) → router is available everywhere
provideClientHydration() → needed if SSR is used
Both entries live in the global DI configuration
Angular 20 - Unit1 | SWEN2 | BIF4
## 30

DI with inject() in a component
// src/app/header/header.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
@Component({
selector: 'app-header',
standalone: true,
imports: [RouterLink, RouterLinkActive],
templateUrl: './header.html',
styleUrls: ['./header.css'],
## })
export class HeaderComponent {
// Get Router instance from Angular's DI container
private readonly router = inject(Router);
goHome(): void {
this.router.navigate(['/']);
## }
## }
inject(Router) asks the DI container for a Router instance
goHome() performs a programmatic navigation to the Home route
Angular 20 - Unit1 | SWEN2 | BIF4
## 31

SSR (Server-Side Rendering) – Concept

What SSR does
Server-Side Rendering (SSR) in Angular:
Renders the initial view on the server
Sends ready-to-display HTML to the browser
Improves perceived performance on slow devices
Can help search engines (SEO) for public pages
After the first render, the SPA takes over in the browser (hydration)
Important: SSR does not replace SPA. It improves the first load.
Angular 20 - Unit1 | SWEN2 | BIF4
## 32

Server side
server.ts uses AngularNodeAppEngine and Express
Handles incoming HTTP requests and renders Angular views
Client side
provideClientHydration() in app.config.ts
Connects the SSR-rendered HTML with the running Angular app
Events and signals work like in a normal SPA after hydration
Angular 20 - Unit1 | SWEN2 | BIF4
## 33

## Further Reading

Official documentation
Angular main documentation (modern, signals-first)
https://angular.dev
Angular CLI reference
https://angular.dev/tools/cli
Angular routing guide
https://angular.dev/guide/routing
Standalone components guide
https://angular.dev/guide/components
Dev-Tutorials
https://angular.dev/tutorials
Angular 20 - Unit1 | SWEN2 | BIF4
## 34

Signals guide
https://angular.dev/guide/signals
Dependency Injection overview
https://angular.dev/guide/di
Server-Side Rendering (SSR)
https://angular.dev/guide/ssr
Angular 20 - Unit1 | SWEN2 | BIF4
## 35