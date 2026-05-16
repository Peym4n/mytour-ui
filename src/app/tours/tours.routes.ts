import { Routes } from '@angular/router';

export const toursRoutes: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./tour-form/tour-form').then((m) => m.TourFormComponent)
  },
  {
    path: ':tourId/edit',
    loadComponent: () =>
      import('./tour-form/tour-form').then((m) => m.TourFormComponent)
  },
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
