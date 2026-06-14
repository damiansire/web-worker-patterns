import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/**
 * Home neutral del theme skeleton: lista los ejemplos desde el registry de
 * dominio y se dibuja SOLO con tokens semánticos. Demuestra el puente
 * dominio -> theme -> tokens sin librería UI.
 */
@Component({
  selector: 'skeleton-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sk-home">
      <h1>Web Worker Patterns <small>· skeleton</small></h1>
      <p class="sk-sub">Skin gris neutro. Valida el puente dominio → theme → tokens.</p>
      <ul class="sk-list">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="sk-num">{{ ex.order }}</span>
              <span class="sk-id">{{ ex.id }}</span>
              <span class="sk-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .sk-home {
        max-width: 760px;
        margin: 0 auto;
        padding: 32px 20px;
        color: var(--ink);
        font-family: var(--font-body);
      }
      h1 {
        font-family: var(--font-display);
        font-size: 28px;
        margin-bottom: 4px;
      }
      h1 small {
        color: var(--ink-muted);
        font-weight: 400;
      }
      .sk-sub {
        color: var(--ink-muted);
        margin: 0 0 24px;
      }
      .sk-list {
        list-style: none;
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
      }
      .sk-list a {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        color: var(--ink);
        text-decoration: none;
      }
      .sk-list a:hover {
        border-color: var(--accent);
      }
      .sk-num {
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: var(--radius);
        background: var(--accent);
        color: var(--surface-raised);
        font-family: var(--font-mono);
        font-size: 13px;
      }
      .sk-id {
        font-family: var(--font-mono);
      }
      .sk-cat {
        color: var(--ink-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    `,
  ],
})
export class SkeletonHomeComponent {
  protected readonly examples = EXAMPLES;
}
