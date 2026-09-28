import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs/operators';
import { LearningContent } from '../domain/learning/content.model';

/**
 * Contenido del recorrido como juego (clave `learning` de i18n), reactivo al idioma
 * activo. `null` hasta que cargó la traducción: quien lo consume no dibuja texto a
 * medias ni claves crudas.
 */
@Injectable({ providedIn: 'root' })
export class LearningContentService {
  private readonly transloco = inject(TranslocoService);

  readonly content: Signal<LearningContent | null> = toSignal(
    this.transloco
      .selectTranslateObject<LearningContent>('learning')
      .pipe(map((value) => (isLearningContent(value) ? value : null))),
    { initialValue: null },
  );
}

function isLearningContent(value: unknown): value is LearningContent {
  return typeof value === 'object' && value !== null && 'missions' in value && 'vocab' in value;
}
