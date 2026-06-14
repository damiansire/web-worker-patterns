import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/** Home brutalista: grilla de celdas duras, números mono, hover invertido. */
@Component({
  selector: 'brutalist-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="b-home">
      <h1 class="b-title">10+ PATRONES<br />DE WEB WORKERS</h1>
      <ul class="b-grid">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="b-num">{{ ex.order }}</span>
              <span class="b-name">{{ ex.id }}</span>
              <span class="b-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .b-home {
        max-width: 1000px;
        margin: 0 auto;
      }
      .b-title {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(34px, 7vw, 68px);
        line-height: 0.9;
        letter-spacing: -0.03em;
        margin: 0 0 28px;
      }
      .b-grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0;
        border-top: var(--border-width) solid var(--border);
        border-left: var(--border-width) solid var(--border);
      }
      .b-grid a {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        column-gap: 12px;
        padding: 16px;
        border-right: var(--border-width) solid var(--border);
        border-bottom: var(--border-width) solid var(--border);
        background: var(--surface);
        color: var(--ink);
        text-decoration: none;
        min-height: 92px;
      }
      .b-grid a:hover {
        background: var(--ink);
        color: var(--surface);
      }
      .b-num {
        grid-row: 1 / 3;
        align-self: start;
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 32px;
        line-height: 1;
      }
      .b-name {
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 700;
        word-break: break-all;
      }
      .b-cat {
        font-family: var(--font-mono);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.7;
      }
    `,
  ],
})
export class BrutalistHomeComponent {
  protected readonly examples = EXAMPLES;
}
