import { Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeBlockContract } from '../../../ui-contracts/code-block.contract';

hljs.registerLanguage('typescript', typescript);

/** Bloque de código brutalista: marco negro grueso, fuente mono, sin radius. */
@Component({
  selector: 'brutalist-code-block',
  template: `
    <figure class="b-code">
      @if (label(); as l) {
        <figcaption>{{ l }}</figcaption>
      }
      <pre><code [innerHTML]="highlighted()"></code></pre>
    </figure>
  `,
  styles: [
    `
      .b-code {
        margin: 0;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
      }
      figcaption {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 6px 12px;
        background: var(--ink);
        color: var(--surface);
      }
      pre {
        margin: 0;
        padding: 14px 16px;
        overflow-x: auto;
      }
      code {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--ink);
        white-space: pre;
      }
    `,
  ],
})
export class BrutalistCodeBlock implements CodeBlockContract {
  readonly code = input('');
  readonly label = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const src = this.code();
    if (!src) return '';
    return hljs.highlight(src, { language: 'typescript' }).value;
  });
}
