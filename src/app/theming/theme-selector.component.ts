import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId } from './theme.types';

/**
 * Selector de theme neutral (ARQUITECTURA §10.8). Lee el registry, resalta el
 * activo y navega a `/t/:id` preservando el ejemplo actual. Vive en el chrome de
 * cada theme; se dibuja solo con tokens semánticos. Cambiar de theme reescribe el
 * segmento `:theme` de la URL y reusa el mismo estado de dominio (§9).
 */
@Component({
  selector: 'theme-selector',
  template: `
    <nav class="ts" aria-label="Theme">
      @for (t of themes; track t.id) {
        <button
          type="button"
          class="ts-btn"
          [class.is-active]="t.id === activeId()"
          [attr.aria-current]="t.id === activeId() ? 'true' : null"
          (click)="select(t.id)"
        >
          {{ t.label }}
        </button>
      }
    </nav>
  `,
  styles: [
    `
      .ts {
        display: inline-flex;
        gap: 4px;
        padding: 3px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
      }
      .ts-btn {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.02em;
        padding: 5px 10px;
        border: none;
        border-radius: calc(var(--radius) - 2px);
        background: transparent;
        color: var(--ink-muted);
        cursor: pointer;
      }
      .ts-btn:hover {
        color: var(--ink);
      }
      .ts-btn.is-active {
        /* Tinta sobre la superficie (alto contraste en los 5 themes) + subrayado
           de acento como indicador. Evita el texto claro-sobre-accent, que en los
           acentos rojos no llega a WCAG AA. El aria-current refuerza el estado. */
        color: var(--ink);
        font-weight: 700;
        box-shadow: inset 0 -2px 0 var(--accent);
      }
      .ts-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    `,
  ],
})
export class ThemeSelectorComponent {
  private readonly registry = inject(THEME_REGISTRY);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly activeId = this.theme.activeId;
  protected readonly themes = [...this.registry.values()];

  protected select(id: ThemeId): void {
    const match = this.router.url.match(/\/t\/[^/]+(\/example\/[^/?#]+)?/);
    const suffix = match?.[1] ?? '';
    this.router.navigateByUrl(`/t/${id}${suffix}`);
  }
}
