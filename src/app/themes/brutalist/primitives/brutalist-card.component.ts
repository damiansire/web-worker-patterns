import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardContract } from '../../../ui-contracts/card.contract';

/** Card brutalista: caja de borde negro grueso con sombra dura y título opcional. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'brutalist-card',
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
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        box-shadow: 6px 6px 0 var(--border);
        margin-bottom: 24px;
      }
      .b-card-head {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 8px 14px;
        background: var(--ink);
        color: var(--surface);
      }
      .b-card-body {
        padding: 18px;
      }
    `,
  ],
})
export class BrutalistCard implements CardContract {
  readonly title = input<string | null>(null);
}
