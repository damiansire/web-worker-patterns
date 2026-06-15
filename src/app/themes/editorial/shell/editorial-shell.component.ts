import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';

/** Shell editorial: cabecera tipo portada de revista de arte. */
@Component({
  selector: 'editorial-shell',
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent],
  template: `
    <div class="e-shell">
      <header class="e-masthead">
        <a class="e-logo" routerLink="/t/editorial">Web Worker Patterns</a>
        <div class="e-mast-right">
          <span class="e-issue">an essay on concurrency · nº 01</span>
          <theme-selector />
        </div>
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
      .e-mast-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .e-issue {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--ink-muted);
      }
      .e-main {
        padding: 40px;
      }
    `,
  ],
})
export class EditorialShellComponent {}
