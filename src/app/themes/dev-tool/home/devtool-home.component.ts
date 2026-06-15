import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/** Home dev-tool: explorador denso tipo IDE (toolbar + árbol de archivos). */
@Component({
  selector: 'devtool-home',
  imports: [RouterLink],
  template: `
    <section class="dt-home">
      <h1 class="dt-sr-only">Web Worker Patterns — índice de ejemplos</h1>
      <div class="dt-toolbar">
        <span class="dt-path"><span class="dt-prompt">▍</span> src/examples</span>
        <span class="dt-meta">{{ examples.length }} files · ⌘K to search</span>
      </div>
      <ul class="dt-tree">
        @for (ex of examples; track ex.id) {
          <li>
            <a [routerLink]="['example', ex.id]">
              <span class="dt-order">{{ ex.order.toString().padStart(2, '0') }}</span>
              <span class="dt-file">{{ ex.id }}<span class="dt-ext">.worker.ts</span></span>
              <span class="dt-cat">{{ ex.category }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .dt-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .dt-home {
        max-width: 820px;
        margin: 0 auto;
        font-family: var(--font-mono);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .dt-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        background: var(--surface-raised);
        border-bottom: var(--border-width) solid var(--border);
        font-size: 12px;
      }
      .dt-path {
        color: var(--ink);
      }
      .dt-prompt {
        color: var(--accent);
      }
      .dt-meta {
        color: var(--ink-muted);
      }
      .dt-tree {
        list-style: none;
        margin: 0;
        padding: 6px 0;
      }
      .dt-tree a {
        display: grid;
        grid-template-columns: 34px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 5px 14px;
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
        text-align: right;
      }
      .dt-ext {
        color: var(--ink-muted);
      }
      .dt-cat {
        color: var(--accent);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class DevToolHomeComponent {
  protected readonly examples = EXAMPLES;
}
