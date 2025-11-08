import { Component, inject } from '@angular/core';
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

  selectLanguage(code: LanguageCode) {
    this.language.setLanguage(code);
  }
}

