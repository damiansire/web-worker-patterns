import { Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone: true
})
export class FooterComponent {
  protected readonly language = inject(LanguageService);
  private readonly mdnPaths: Record<string, string> = { es: 'es', en: 'en-US', pt: 'pt-BR' };
  readonly mdnHref = computed(() => {
    const lang = this.language.currentLanguage();
    const segment = this.mdnPaths[lang] ?? 'en-US';
    return `https://developer.mozilla.org/${segment}/docs/Web/API/Web_Workers_API`;
  });
}

