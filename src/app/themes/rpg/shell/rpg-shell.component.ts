import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../theming/theme.service';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';

/**
 * Shell del theme `rpg`: una franja angosta con el nombre y el selector de theme, y
 * el juego debajo. La navegación ocupa lo mínimo: el peso de la pantalla es del
 * mundo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rpg-shell',
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent],
  template: `
    <div class="r-shell">
      <header class="r-bar">
        <a class="r-logo" [routerLink]="['/t', activeId()]">Web Worker Patterns</a>
        <theme-selector />
      </header>
      <main class="r-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .r-shell {
      min-height: 100vh;
      background: var(--surface);
      color: var(--ink);
      font-family: var(--font-body);
    }
    .r-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 16px;
    }
    .r-logo {
      font-family: var(--font-display);
      font-size: 17px;
      color: var(--ink-muted);
      text-decoration: none;
    }
    .r-logo:hover {
      color: var(--ink);
    }
    .r-main {
      padding: 4px 16px 24px;
    }
  `,
})
export class RpgShellComponent {
  protected readonly activeId = inject(ThemeService).activeId;
}
