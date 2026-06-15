import { Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeBlockContract } from '../../../ui-contracts/code-block.contract';

hljs.registerLanguage('typescript', typescript);

/** Bloque de código dev-tool: panel de editor con barra de título. */
@Component({
  selector: 'devtool-code-block',
  template: `
    <div class="dt-code">
      <div class="dt-code-bar">
        <span class="dt-dot"></span><span class="dt-dot"></span><span class="dt-dot"></span>
        @if (label(); as l) {
          <span class="dt-code-label">{{ l }}</span>
        }
      </div>
      <pre><code [innerHTML]="highlighted()"></code></pre>
    </div>
  `,
  styles: [
    `
      .dt-code {
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        overflow: hidden;
      }
      .dt-code-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-bottom: var(--border-width) solid var(--border);
      }
      .dt-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ink-muted);
        opacity: 0.5;
      }
      .dt-code-label {
        margin-left: 8px;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
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
export class DevToolCodeBlock implements CodeBlockContract {
  readonly code = input('');
  readonly label = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const src = this.code();
    if (!src) return '';
    return hljs.highlight(src, { language: 'typescript' }).value;
  });
}
