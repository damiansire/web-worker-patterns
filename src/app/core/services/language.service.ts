import { Injectable, computed, effect, signal } from '@angular/core';

/**
 * Idiomas soportados. Un solo idioma por ahora (es). Para sumar otro: agregar
 * su código acá, su JSON en `public/i18n/<code>.json` y el par en `LANGUAGES`,
 * más el `availableLangs` de Transloco (ver `app.config.ts`).
 */
export type LanguageCode = 'es';

const DEFAULT_LANGUAGE: LanguageCode = 'es';
const LANGUAGE_STORAGE_KEY = 'wwp-language';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly languages: { code: LanguageCode; label: string; nativeLabel: string }[] = [
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  ];

  private readonly language = signal<LanguageCode>(DEFAULT_LANGUAGE);
  readonly currentLanguage = computed<LanguageCode>(() => this.language());

  constructor() {
    const stored = this.storage?.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && this.isSupported(stored)) {
      this.language.set(stored);
    }

    effect(() => {
      this.storage?.setItem(LANGUAGE_STORAGE_KEY, this.language());
    });

    // Mantiene `<html lang>` en sincronía con el idioma activo (mismo patrón que
    // ThemeService con dataset.theme). Sin esto, `lang` quedaba clavado en el HTML
    // y al sumar idiomas los lectores de pantalla lo pronunciarían con la fonética
    // equivocada (WCAG 3.1.1). Hoy sólo hay 'es', pero el gancho ya queda cableado.
    effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = this.language();
      }
    });
  }

  /** localStorage puede no existir en test/SSR; lo accedemos de forma defensiva. */
  private get storage(): Storage | null {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  setLanguage(code: LanguageCode): void {
    if (this.isSupported(code)) {
      this.language.set(code);
    }
  }

  private isSupported(code: string): code is LanguageCode {
    return this.languages.some((lang) => lang.code === code);
  }
}
