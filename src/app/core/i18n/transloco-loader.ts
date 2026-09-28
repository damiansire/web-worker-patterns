import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Carga las traducciones (chrome del theme y contenido educativo de cada ejemplo)
 * desde `i18n/<lang>.json`, servidas desde `public/i18n/`.
 *
 * La ruta es RELATIVA a propósito: se resuelve contra `<base href>`, así funciona
 * tanto en `/` (local) como en `/web-worker-patterns/` (GitHub Pages). Con la barra
 * inicial el pedido iba a la raíz del dominio, daba 404 en Pages y los 16 ejemplos
 * se quedaban sin título ni explicación. Lo vigila `scripts/test/e2e-smoke.mjs`.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`i18n/${lang}.json`);
  }
}
