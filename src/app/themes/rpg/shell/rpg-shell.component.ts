import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../theming/theme.service';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';

/**
 * Shell del theme `rpg`: una franja angosta con el nombre y el selector de theme, y
 * el juego debajo. La navegación ocupa lo mínimo: el peso de la pantalla es del
 * mundo.
 *
 * La franja tiene alto fijo y el shell lo publica en `--rpg-shell` (franja más
 * márgenes): el juego lo usa para quedarse con todo el alto que sobra, ni un
 * píxel más.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rpg-shell',
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent],
  template: `
    <div class="r-shell">
      <header class="r-bar">
        <a class="r-logo" [routerLink]="['/t', activeId()]" aria-label="Web Worker Patterns">
          <span class="r-full">Web Worker Patterns</span>
          <span class="r-short">WWP</span>
        </a>
        <theme-selector />
      </header>
      <main class="r-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .r-shell {
      --r-bar: 56px;
      --r-bottom: 24px;
      --rpg-shell: calc(var(--r-bar) + 4px + var(--r-bottom));
      min-height: 100dvh;
      background: var(--surface);
      color: var(--ink);
      font-family: var(--font-body);
    }
    .r-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      height: var(--r-bar);
      padding: 0 16px;
    }
    .r-logo {
      font-family: var(--font-display);
      font-size: 17px;
      color: var(--ink-muted);
      text-decoration: none;
      white-space: nowrap;
    }
    .r-logo:hover {
      color: var(--ink);
    }
    .r-short {
      display: none;
    }
    .r-main {
      padding: 4px 16px var(--r-bottom);
    }
    /* En el teléfono cada píxel de alto es del juego: una sola fila y el nombre corto. */
    @media (max-width: 560px) {
      .r-shell {
        --r-bar: 52px;
        --r-bottom: 12px;
      }
      .r-full {
        display: none;
      }
      .r-short {
        display: inline;
      }
    }
  `,
})
export class RpgShellComponent {
  protected readonly activeId = inject(ThemeService).activeId;
}
