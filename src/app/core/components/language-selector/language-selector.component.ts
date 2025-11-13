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

  constructor() {
    effect(() => {
      if (!this.language.isLanguageSelected()) {
        this.selectorOpen.set(true);
      }
    });
  }

  openSelector() {
    this.selectorOpen.set(true);
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
}

