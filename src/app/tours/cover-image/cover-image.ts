import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, signal } from '@angular/core';

import { ApiConfiguration } from '../../api/generated/api-configuration';
import { CoverImageDto } from '../../api/generated/models/cover-image-dto';

@Component({
  selector: 'app-cover-image',
  templateUrl: './cover-image.html',
  styleUrl: './cover-image.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoverImageComponent implements OnDestroy {
  readonly tourId = input<number | null | undefined>(null);
  readonly coverImage = input<CoverImageDto | null | undefined>(null);
  readonly fallbackText = input('IMG');
  readonly altText = input('Tour cover image');

  private readonly http = inject(HttpClient);
  private readonly apiConfiguration = inject(ApiConfiguration);
  private objectUrl: string | null = null;

  readonly imageUrl = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const tourId = this.tourId();
      const coverImage = this.coverImage();
      this.clearObjectUrl();

      if (typeof tourId !== 'number' || coverImage === null || coverImage === undefined) {
        return;
      }

      const subscription = this.http.get(this.coverImageUrl(tourId), { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.clearObjectUrl();
          if (blob.size === 0) {
            return;
          }

          this.objectUrl = URL.createObjectURL(blob);
          this.imageUrl.set(this.objectUrl);
        },
        error: () => {
          this.clearObjectUrl();
        }
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  ngOnDestroy(): void {
    this.clearObjectUrl();
  }

  private coverImageUrl(tourId: number): string {
    const rootUrl = this.apiConfiguration.rootUrl.replace(/\/$/, '');
    return `${rootUrl}/api/tours/${encodeURIComponent(String(tourId))}/cover-image`;
  }

  private clearObjectUrl(): void {
    if (this.objectUrl !== null) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    this.imageUrl.set(null);
  }
}
