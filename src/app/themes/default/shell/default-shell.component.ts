import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../../theming/theme.service';
import { findLevel } from '../story/story.levels';

/**
 * Shell: cabecera con el título + outlet. Hay un solo theme, así que no hay
 * selector; el selector de idioma sigue omitido mientras haya un solo idioma.
 * En el mapa (la portada) y en los niveles con escena no hay cabecera: el
 * título vive dentro del mundo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="e-shell" [class.e-shell--bare]="bare()">
      @if (!bare()) {
        <header class="e-masthead">
          <a class="e-logo" [routerLink]="['/t', activeId()]">Web Worker Patterns</a>
        </header>
      }
      <main class="e-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .e-shell {
        /* La pantalla de nivel ocupa la ventana menos esta cabecera. */
        --masthead-h: 52px;
        min-height: 100vh;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font-body);
      }
      .e-shell--bare {
        --masthead-h: 0px;
      }
      .e-masthead {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        height: var(--masthead-h);
        box-sizing: border-box;
        padding: 0 24px;
        border-bottom: var(--border-width) solid var(--border);
      }
      .e-logo {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 18px;
        letter-spacing: -0.01em;
        color: var(--ink);
        text-decoration: none;
      }
    `,
  ],
})
export class DefaultShellComponent {
  /** El logo vuelve al home del theme activo. */
  protected readonly activeId = inject(ThemeService).activeId;

  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** La portada del theme: `/t/<theme>`, sin ejemplo. */
  protected readonly onMap = computed(() => /^\/t\/[^/?#]+\/?([?#].*)?$/.test(this.url()));
  /** Un nivel que se juega en su escena (los "en obra" siguen con cabecera). */
  private readonly onScene = computed(() => {
    const id = /^\/t\/[^/?#]+\/example\/([^/?#]+)/.exec(this.url())?.[1];
    return !!(id && findLevel(id)?.scene);
  });
  protected readonly bare = computed(() => this.onMap() || this.onScene());
}
