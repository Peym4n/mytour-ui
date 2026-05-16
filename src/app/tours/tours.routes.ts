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
    path: ':tourId/logs/new',
    loadComponent: () =>
      import('./tour-log-form/tour-log-form').then((m) => m.TourLogFormComponent)
  },
  {
    path: ':tourId/logs/:logId/edit',
    loadComponent: () =>
      import('./tour-log-form/tour-log-form').then((m) => m.TourLogFormComponent)
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
