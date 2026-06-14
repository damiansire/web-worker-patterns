import { Component, effect, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { ThemeService } from './theming/theme.service';
import { LanguageService } from './core/services/language.service';

/**
 * Host de la app (ARQUITECTURA §4.3): monta el shell del theme activo vía
 * `ngComponentOutlet`. Al cambiar de theme, el effect re-monta el shell; el
 * estado de dominio (workers, monitor) vive en signals root y no se reinicia.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (shell(); as shellCmp) {
      <ng-container *ngComponentOutlet="shellCmp" />
    }
  `,
})
export class App {
  private readonly theme = inject(ThemeService);
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly shell = signal<Type<unknown> | null>(null);

  constructor() {
    // Setea data-theme inicial (y, en el futuro, inyecta el CSS del theme).
    this.theme.setTheme(this.theme.activeId());

    // El idioma activo de Transloco sigue al LanguageService (geo + persistencia),
    // que es la fuente de verdad del idioma. Así el contenido educativo neutral
    // (i18n) se renderiza en el idioma del usuario.
    effect(() => this.transloco.setActiveLang(this.language.currentLanguage()));

    effect(() => {
      const pack = this.theme.active();
      const id = pack.id;
      pack.shell().then((cmp) => {
        // Evita la race en deep-link: el shell de un theme se carga async, así
        // que solo aplicamos la resolución si sigue siendo el theme activo
        // (si no, una carga vieja —p.ej. skeleton— pisaría a la nueva).
        if (this.theme.activeId() === id) {
          this.shell.set(cmp);
        }
      });
    });
  }
}
