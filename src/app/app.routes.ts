import { Routes } from '@angular/router';
import { HealthComponent } from './health';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tours' },
  {
    path: 'tours',
    loadChildren: () => import('./tours/tours.routes').then((m) => m.toursRoutes)
  },
  { path: 'health', component: HealthComponent },
  { path: '**', redirectTo: 'tours' }
];
