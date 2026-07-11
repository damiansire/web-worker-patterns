import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  PendingTasks,
  signal,
  Type,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
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
  private readonly pendingTasks = inject(PendingTasks);
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
      // pendingTasks.run marca esta carga async como pendiente ante el scheduler
      // zoneless: sin esto, whenStable()/ApplicationRef no esperan la resolucion
      // de pack.shell() (una Promise cruda, invisible para el tracking de
      // estabilidad), lo que hacia flaky el test de montaje segun la velocidad
      // del entorno (paso local, fallaba en CI).
      this.pendingTasks.run(async () => {
        const cmp = await pack.shell();
        // Evita la race en deep-link: el shell de un theme se carga async, así
        // que solo aplicamos la resolución si sigue siendo el theme activo
        // (si no, una carga vieja pisaría a la nueva al cambiar rápido de theme).
        if (this.theme.activeId() === id) {
          this.shell.set(cmp);
          // Un tick extra de microtarea: la escritura de la signal programa la
          // deteccion de cambios en un microtask propio del scheduler zoneless,
          // que puede quedar encolado DESPUES de que esta tarea pendiente se
          // resuelva (carrera de 1 tick, mas visible en el runner mas lento/
          // cargado de CI que en un entorno local rapido). Este await mantiene
          // la tarea "pendiente" un turno mas, dandole tiempo a esa CD de
          // aplicarse antes de reportar la app como estable.
          await Promise.resolve();
        }
      });
    });
  }
}
