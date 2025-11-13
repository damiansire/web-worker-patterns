import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { LanguageService, LanguageCode } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  protected readonly language = inject(LanguageService);
  protected readonly selectorOpen = signal(!this.language.isLanguageSelected());
  protected readonly currentLanguage = computed(() =>
    this.language.languages.find(lang => lang.code === this.language.currentLanguage())
  );
  private readonly languageOrder: LanguageCode[] = ['es', 'pt', 'en'];
  protected readonly orderedLanguages = computed(() =>
    this.languageOrder
      .map(code => this.language.languages.find(lang => lang.code === code))
      .filter((lang): lang is (typeof this.language.languages)[number] => Boolean(lang))
  );
  protected readonly flagEmoji: Record<LanguageCode, string> = {
    es: '🇪🇸',
    en: '🇺🇸',
    pt: '🇧🇷'
  };
  private readonly codeLabels: Record<LanguageCode, string> = {
    es: 'ES',
    en: 'EN',
    pt: 'PT'
  };

  constructor() {
    effect(() => {
      if (!this.language.isLanguageSelected()) {
        this.selectorOpen.set(true);
      }
    });
  }

  closeSelector() {
    if (this.language.isLanguageSelected()) {
      this.selectorOpen.set(false);
    }
  }

  selectLanguage(code: LanguageCode) {
    this.language.setLanguage(code);
    this.selectorOpen.set(false);
  }

  protected isSelected(code: LanguageCode): boolean {
    return this.language.currentLanguage() === code;
  }

  protected codeLabel(code: LanguageCode): string {
    return this.codeLabels[code];
  }
}

