import { inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExampleContent } from '../domain/examples/example-content.model';

/**
 * Expone el contenido educativo neutral de un ejemplo desde Transloco (i18n),
 * reactivo al id del ejemplo y al idioma activo. Cada theme lo consume y lo
 * dibuja a su manera. Los ejemplos sin contenido migrado devuelven `null`.
 */
@Injectable({ providedIn: 'root' })
export class ExampleContentService {
  private readonly transloco = inject(TranslocoService);

  /** Signal del contenido del ejemplo `id` (debe llamarse en injection context). */
  contentFor(id: Signal<string>): Signal<ExampleContent | null> {
    const content$ = toObservable(id).pipe(
      switchMap((exId) =>
        exId ? this.transloco.selectTranslateObject<ExampleContent>(`examples.${exId}`) : of(null),
      ),
      map((value) =>
        value && typeof value === 'object' && 'summary' in value ? (value as ExampleContent) : null,
      ),
    );
    return toSignal(content$, { initialValue: null });
  }
}
