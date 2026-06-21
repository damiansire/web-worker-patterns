import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';
import { LanguageSwitcherComponent } from '../../../ui-primitives/language-switcher.component';

/** Shell narrative: cabecera de revista, mucho aire, serif. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'narrative-shell',
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent, LanguageSwitcherComponent],
  template: `
    <div class="n-shell">
      <header class="n-head">
        <a class="n-title" routerLink="/t/narrative">Web&nbsp;Worker&nbsp;Patterns</a>
        <span class="n-strap">una lectura sobre concurrencia en el navegador</span>
        <div class="n-switch"><wwp-language-switcher /><theme-selector /></div>
      </header>
      <main class="n-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .n-shell {
        min-height: 100vh;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font-body);
      }
      .n-head {
        text-align: center;
        padding: 56px 24px 40px;
        border-bottom: var(--border-width) solid var(--border);
      }
      .n-title {
        display: block;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: clamp(30px, 6vw, 56px);
        color: var(--ink);
        text-decoration: none;
        letter-spacing: -0.01em;
      }
      .n-strap {
        display: block;
        margin-top: 12px;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 16px;
        color: var(--ink-muted);
      }
      .n-switch {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .n-main {
        padding: 48px 24px;
      }
    `,
  ],
})
export class NarrativeShellComponent {}
