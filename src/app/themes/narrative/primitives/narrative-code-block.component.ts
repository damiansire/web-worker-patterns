import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeBlockContract } from '../../../ui-contracts/code-block.contract';

hljs.registerLanguage('typescript', typescript);

/** Bloque de código narrative: aparte tipográfico, fondo suave. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'narrative-code-block',
  template: `
    <figure class="n-code">
      @if (label(); as l) {
        <figcaption>{{ l }}</figcaption>
      }
      <pre><code [innerHTML]="highlighted()"></code></pre>
    </figure>
  `,
  styles: [
    `
      .n-code {
        margin: 0;
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      figcaption {
        font-family: var(--font-body);
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--ink-muted);
        padding: 10px 18px;
        border-bottom: var(--border-width) solid var(--border);
      }
      pre {
        margin: 0;
        padding: 18px 20px;
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
export class NarrativeCodeBlock implements CodeBlockContract {
  readonly code = input('');
  readonly label = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const src = this.code();
    if (!src) return '';
    return hljs.highlight(src, { language: 'typescript' }).value;
  });
}
