import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

/**
 * Shell del theme `default`: cabecera neutra (título + outlet). El selector de
 * theme y el de idioma se omiten mientras haya uno solo de cada; sus componentes
 * (`ThemeSelectorComponent`, `LanguageSwitcherComponent`) siguen en el árbol,
 * listos para volver a montarse cuando haya más de un theme/idioma.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="e-shell">
      <header class="e-masthead">
        <a class="e-logo" routerLink="/t/default">Web Worker Patterns</a>
      </header>
      <main class="e-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .e-shell {
        min-height: 100vh;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font-body);
      }
      .e-masthead {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 28px 40px;
        border-bottom: var(--border-width) solid var(--ink);
      }
      .e-logo {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 24px;
        letter-spacing: -0.01em;
        color: var(--ink);
        text-decoration: none;
      }
      .e-main {
        padding: 40px;
      }
    `,
  ],
})
export class DefaultShellComponent {}
