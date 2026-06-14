import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/** Home editorial: índice tipo sumario de revista, números grandes serif. */
@Component({
  selector: 'editorial-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="e-home">
      <h1 class="e-lede">Diez maneras de no bloquear el hilo principal.</h1>
      <ol class="e-index">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="e-num">{{ ex.order.toString().padStart(2, '0') }}</span>
              <span class="e-name">{{ ex.id }}</span>
              <span class="e-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ol>
    </section>
  `,
  styles: [
    `
      .e-home {
        max-width: 820px;
        margin: 0 auto;
      }
      .e-lede {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(30px, 5vw, 52px);
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin: 0 0 36px;
        max-width: 14ch;
      }
      .e-index {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .e-index a {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        align-items: baseline;
        gap: 18px;
        padding: 18px 0;
        border-top: var(--border-width) solid var(--border);
        color: var(--ink);
        text-decoration: none;
      }
      .e-index li:last-child a {
        border-bottom: var(--border-width) solid var(--border);
      }
      .e-num {
        font-family: var(--font-display);
        font-size: 28px;
        color: var(--accent);
      }
      .e-name {
        font-family: var(--font-mono);
        font-size: 15px;
      }
      .e-index a:hover .e-name {
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      .e-cat {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class EditorialHomeComponent {
  protected readonly examples = EXAMPLES;
}
