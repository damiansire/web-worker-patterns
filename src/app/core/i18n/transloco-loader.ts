import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Carga las traducciones del *chrome* de cada theme desde `/i18n/<lang>.json`
 * (servidas desde `public/i18n/`). El contenido educativo neutral seguirá su
 * propia ruta de migración (ver ARQUITECTURA §3.3); por ahora Transloco queda
 * cableado y listo para que los themes cuelguen sus strings.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/i18n/${lang}.json`);
  }
}
