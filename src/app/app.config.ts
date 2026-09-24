import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { provideThemeRegistry } from './theming/theme.registry';
import { provideWorkerPatternTools } from './agent-tools/worker-patterns.web-mcp';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideThemeRegistry(),
    provideHttpClient(withFetch()),
    provideTransloco({
      config: {
        // Un solo idioma por ahora (es). El motor de i18n queda intacto: sumar
        // idiomas es agregarlos acá + su JSON en public/i18n/ + al LanguageService.
        availableLangs: ['es'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // WebMCP (experimental): tools para agentes de IA; no-op si el navegador no lo soporta.
    provideWorkerPatternTools(),
  ],
};
