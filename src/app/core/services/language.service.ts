import { Injectable, computed, effect, signal } from '@angular/core';

export type LanguageCode = 'es' | 'en' | 'pt';

const LANGUAGE_STORAGE_KEY = 'wwp-language';

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
  readonly currentLanguage = computed<LanguageCode>(() => this.language() ?? 'es');

  constructor() {
    this.loadTranslations();

    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (stored && this.isSupported(stored)) {
      this.language.set(stored);
    }

    effect(() => {
      const lang = this.language();
      if (lang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }
    });
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

