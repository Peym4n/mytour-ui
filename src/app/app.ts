import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

import { AuthSessionService } from './auth/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.authSession.initialize();
  }

  protected signOut(): void {
    this.authSession.clear();
    void this.router.navigateByUrl('/auth');
  }
}
