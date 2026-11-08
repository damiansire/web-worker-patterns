import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from '../../../theming/theme.service';

/**
 * Shell: cabecera con el título + outlet. Hay un solo theme, así que no hay
 * selector; el selector de idioma sigue omitido mientras haya un solo idioma.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="e-shell">
      <header class="e-masthead">
        <a class="e-logo" [routerLink]="['/t', activeId()]">Web Worker Patterns</a>
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
export class DefaultShellComponent {
  /** El logo vuelve al home del theme activo. */
  protected readonly activeId = inject(ThemeService).activeId;
}
