import { Injectable, computed, effect, signal } from '@angular/core';

export type LanguageCode = 'es' | 'en' | 'pt';

const LANGUAGE_STORAGE_KEY = 'wwp-language';
const GEO_API_URL = 'https://ipapi.co/json/?fields=country_code,country_name';

export interface GeoNotification {
  countryName: string;
  languageCode: LanguageCode;
  /** When true, we could not detect country; show "browser doesn't tell us where you are" + language links */
  unknownCountry?: boolean;
}

/** Country codes where we default to Spanish (Spain + Latin America except Brazil). */
const SPANISH_COUNTRY_CODES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN',
  'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ'
]);

type TranslationTree = Record<string, any>;

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly languages: { code: LanguageCode; label: string; nativeLabel: string }[] = [
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' }
  ];

  private readonly translations = signal<TranslationTree>({});
  private readonly language = signal<LanguageCode | null>(null);
  readonly currentLanguage = computed<LanguageCode>(() => this.language() ?? 'en');

  /** Set when language was chosen by geolocation; show once then dismiss. */
  readonly geoNotification = signal<GeoNotification | null>(null);

  constructor() {
    this.loadTranslations();

    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (stored && this.isSupported(stored)) {
      this.language.set(stored);
    } else {
      this.detectLanguageByGeo();
    }

    effect(() => {
      const lang = this.language();
      if (lang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }
    });
  }

  /**
   * Detects language from geolocation (country via IP).
   * Brazil → Portuguese; Spain / Latin America → Spanish; rest → English.
   */
  private detectLanguageByGeo(): void {
    fetch(GEO_API_URL, { mode: 'cors' })
      .then(res => res.json())
      .then((data: { country_code?: string; country_name?: string }) => {
        const code = (data?.country_code ?? '').toUpperCase();
        const countryName = (data?.country_name ?? code).trim() || null;
        let lang: LanguageCode = 'en';
        if (code === 'BR') {
          lang = 'pt';
        } else if (SPANISH_COUNTRY_CODES.has(code)) {
          lang = 'es';
        }
        this.language.set(lang);
        if (countryName) {
          this.geoNotification.set({ countryName, languageCode: lang });
        } else {
          this.language.set('en');
          this.geoNotification.set({ countryName: '', languageCode: 'en', unknownCountry: true });
        }
      })
      .catch(() => {
        this.language.set('en');
        this.geoNotification.set({ countryName: '', languageCode: 'en', unknownCountry: true });
      });
  }

  dismissGeoNotification(): void {
    this.geoNotification.set(null);
  }

  setLanguage(code: LanguageCode) {
    if (this.isSupported(code)) {
      this.language.set(code);
    }
  }

  isLanguageSelected(): boolean {
    return this.language() !== null;
  }

  t<T = string>(path: string, fallback?: T): T {
    const value = this.resolvePath(this.translations(), `${this.currentLanguage()}.${path}`);
    if (value === undefined) {
      return (fallback ?? path) as unknown as T;
    }
    return value as T;
  }

  private loadTranslations() {
    import('../translations/translations').then(module => {
      this.translations.set(module.translations);
    });
  }

  private resolvePath(obj: TranslationTree, path: string): any {
    return path.split('.').reduce((acc: any, key: string) => (acc !== undefined && acc !== null ? acc[key] : undefined), obj);
  }

  private isSupported(code: string): code is LanguageCode {
    return this.languages.some(lang => lang.code === code);
  }
}

