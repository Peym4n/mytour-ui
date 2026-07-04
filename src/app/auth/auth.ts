import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { StatusMessageComponent } from '../shared/status-message/status-message';
import { AuthViewModel } from './auth-view-model.service';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, StatusMessageComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent implements OnInit {
  protected readonly authVm = inject(AuthViewModel);

  ngOnInit(): void {
    this.authVm.initialize();
  }
}
