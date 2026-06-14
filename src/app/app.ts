import { Component, effect, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ThemeService } from './theming/theme.service';

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
  protected readonly shell = signal<Type<unknown> | null>(null);

  constructor() {
    // Setea data-theme inicial (y, en el futuro, inyecta el CSS del theme).
    this.theme.setTheme(this.theme.activeId());

    effect(() => {
      const pack = this.theme.active();
      pack.shell().then((cmp) => this.shell.set(cmp));
    });
  }
}
