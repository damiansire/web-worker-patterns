import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';

/**
 * Shell brutalista: header stark de borde negro grueso sobre fondo amarillo, con
 * el outlet del contenido debajo. Sin librería UI.
 */
@Component({
  selector: 'fb-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent],
  template: `
    <div class="b-shell">
      <header class="b-header">
        <a class="b-brand" routerLink="/t/full-brutalist">WEB·WORKER<br />PATTERNS</a>
        <theme-selector />
      </header>
      <main class="b-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .b-shell {
        min-height: 100vh;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font-body);
      }
      .b-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: var(--border-width) solid var(--border);
      }
      .b-brand {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 20px;
        line-height: 0.95;
        letter-spacing: -0.02em;
        color: var(--ink);
        text-decoration: none;
      }
      .b-tag {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 10px;
        background: var(--accent);
        color: var(--surface-raised);
        border: var(--border-width) solid var(--border);
      }
      .b-main {
        padding: 28px 24px;
      }
    `,
  ],
})
export class FullBrutalistShellComponent {}
