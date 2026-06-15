import { Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeBlockContract } from '../../../ui-contracts/code-block.contract';

hljs.registerLanguage('typescript', typescript);

/** Bloque de código editorial: tipográfico, marco fino, etiqueta serif. */
@Component({
  selector: 'editorial-code-block',
  template: `
    <figure class="e-code">
      @if (label(); as l) {
        <figcaption>{{ l }}</figcaption>
      }
      <pre><code [innerHTML]="highlighted()"></code></pre>
    </figure>
  `,
  styles: [
    `
      .e-code {
        margin: 0;
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      figcaption {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
        padding: 8px 16px;
        border-bottom: var(--border-width) solid var(--border);
      }
      pre {
        margin: 0;
        padding: 16px 18px;
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
export class EditorialCodeBlock implements CodeBlockContract {
  readonly code = input('');
  readonly label = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const src = this.code();
    if (!src) return '';
    return hljs.highlight(src, { language: 'typescript' }).value;
  });
}
