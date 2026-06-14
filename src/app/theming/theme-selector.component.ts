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
  standalone: true,
  template: `
    <nav class="ts" aria-label="Theme">
      @for (t of themes; track t.id) {
        <button
          type="button"
          class="ts-btn"
          [class.is-active]="t.id === activeId()"
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
        background: var(--accent);
        color: var(--surface-raised);
      }
    `,
  ],
})
export class ThemeSelectorComponent {
  private readonly registry = inject(THEME_REGISTRY);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly activeId = this.theme.activeId;
  // El skeleton es transitorio: no se ofrece en el selector.
  protected readonly themes = [...this.registry.values()].filter((t) => t.id !== 'skeleton');

  protected select(id: ThemeId): void {
    const match = this.router.url.match(/\/t\/[^/]+(\/example\/[^/?#]+)?/);
    const suffix = match?.[1] ?? '';
    this.router.navigateByUrl(`/t/${id}${suffix}`);
  }
}
