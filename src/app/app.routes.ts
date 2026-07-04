import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { HealthComponent } from './health';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tours' },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth').then((m) => m.AuthComponent)
  },
  {
    path: 'tours',
    canActivate: [authGuard],
    loadChildren: () => import('./tours/tours.routes').then((m) => m.toursRoutes)
  },
  { path: 'health', component: HealthComponent },
  { path: '**', redirectTo: 'tours' }
];
