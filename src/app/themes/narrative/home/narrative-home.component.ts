import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/** Home narrative: sumario centrado tipo revista, en columna estrecha. */
@Component({
  selector: 'narrative-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="n-home">
      <p class="n-dek">
        Cada patrón es un capítulo: por qué el hilo principal se bloquea y cómo un worker lo
        rescata.
      </p>
      <ul class="n-toc">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="n-chap">Capítulo {{ ex.order }}</span>
              <span class="n-name">{{ ex.id }}</span>
              <span class="n-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .n-home {
        max-width: 640px;
        margin: 0 auto;
        text-align: center;
      }
      .n-dek {
        font-family: var(--font-display);
        font-size: clamp(20px, 3.5vw, 28px);
        line-height: 1.4;
        color: var(--ink);
        margin: 0 0 44px;
      }
      .n-toc {
        list-style: none;
        margin: 0;
        padding: 0;
        text-align: left;
      }
      .n-toc a {
        display: block;
        padding: 20px 0;
        border-top: var(--border-width) solid var(--border);
        color: var(--ink);
        text-decoration: none;
      }
      .n-toc li:last-child a {
        border-bottom: var(--border-width) solid var(--border);
      }
      .n-chap {
        display: block;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--accent);
      }
      .n-name {
        display: block;
        font-family: var(--font-mono);
        font-size: 17px;
        margin: 4px 0;
      }
      .n-cat {
        font-family: var(--font-body);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class NarrativeHomeComponent {
  protected readonly examples = EXAMPLES;
}
