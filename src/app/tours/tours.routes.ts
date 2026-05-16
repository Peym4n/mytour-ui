import { Routes } from '@angular/router';

export const toursRoutes: Routes = [
  {
    path: ':tourId',
    loadComponent: () =>
      import('./tour-detail/tour-detail').then((m) => m.TourDetailComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./tours-list/tours-list').then((m) => m.ToursListComponent)
  }
];
