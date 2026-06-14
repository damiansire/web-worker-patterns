import { Component, input } from '@angular/core';
import { CardContract } from '../../../ui-contracts/card.contract';

/**
 * Card brutalista (oscura): superficie casi negra, título de sección como bloque
 * sólido de acento (texto invertido). Sin sombra ni margen: encaja en la grilla
 * expuesta del layout, que aporta las líneas duras entre secciones.
 */
@Component({
  selector: 'brutalist-card',
  standalone: true,
  template: `
    <section class="b-card">
      @if (title(); as t) {
        <header class="b-card-head">{{ t }}</header>
      }
      <div class="b-card-body">
        <ng-content />
      </div>
    </section>
  `,
  styles: [
    `
      .b-card {
        background: var(--surface-raised);
        height: 100%;
      }
      .b-card-head {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 8px 16px;
        background: var(--accent);
        color: var(--surface);
        border-bottom: var(--border-width) solid var(--border);
      }
      .b-card-body {
        padding: 20px 16px;
      }
    `,
  ],
})
export class BrutalistCard implements CardContract {
  readonly title = input<string | null>(null);
}
