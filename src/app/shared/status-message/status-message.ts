import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusMessageVariant = 'notice' | 'error' | 'loading';

@Component({
  selector: 'app-status-message',
  templateUrl: './status-message.html',
  styleUrl: './status-message.scss',
  host: {
    '[class.status-message-host--spaced]': 'spaced()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusMessageComponent {
  readonly variant = input<StatusMessageVariant>('notice');
  readonly spaced = input(false);

  protected readonly role = computed(() => {
    if (this.variant() === 'error') {
      return 'alert';
    }

    return this.variant() === 'notice' ? 'status' : null;
  });

  protected readonly ariaLive = computed(() => this.variant() === 'loading' ? 'polite' : null);
}
