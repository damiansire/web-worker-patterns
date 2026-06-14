import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/** Home dev-tool: lista tipo árbol de archivos / output de terminal. */
@Component({
  selector: 'devtool-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="dt-home">
      <p class="dt-comment">// {{ examples.length }} patrones · ⌘K para buscar</p>
      <ul class="dt-tree">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="dt-order">{{ ex.order.toString().padStart(2, '0') }}</span>
              <span class="dt-id">{{ ex.id }}</span>
              <span class="dt-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .dt-home {
        max-width: 760px;
        margin: 0 auto;
        font-family: var(--font-mono);
      }
      .dt-comment {
        color: var(--ink-muted);
        margin: 0 0 16px;
        font-size: 13px;
      }
      .dt-tree {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .dt-tree a {
        display: grid;
        grid-template-columns: 32px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 7px 10px;
        color: var(--ink);
        text-decoration: none;
        border-left: 2px solid transparent;
        font-size: 13px;
      }
      .dt-tree a:hover {
        background: var(--surface-raised);
        border-left-color: var(--accent);
      }
      .dt-order {
        color: var(--ink-muted);
      }
      .dt-cat {
        color: var(--accent);
        font-size: 11px;
      }
    `,
  ],
})
export class DevToolHomeComponent {
  protected readonly examples = EXAMPLES;
}
