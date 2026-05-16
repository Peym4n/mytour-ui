import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { TourTransportFilter, ToursListViewModel } from './tours-list-view-model.service';

@Component({
  selector: 'app-tours-list',
  imports: [RouterLink, ButtonModule, InputTextModule, TagModule],
  templateUrl: './tours-list.html',
  styleUrl: './tours-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToursListComponent implements OnInit {
  protected readonly tourVm = inject(ToursListViewModel);

  ngOnInit(): void {
    this.tourVm.loadTours();
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.tourVm.setSearchQuery(input?.value ?? '');
  }

  protected onTransportChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.tourVm.setTransportFilter((select?.value ?? '') as TourTransportFilter);
  }
}
