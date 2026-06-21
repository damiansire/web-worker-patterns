import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeBlockContract } from '../../../ui-contracts/code-block.contract';

hljs.registerLanguage('typescript', typescript);

/**
 * Bloque de código brutalista (oscuro): marco amarillo grueso, etiqueta en bloque
 * de acento (invertida), código sobre fondo casi negro. El highlighting usa el
 * tema github-dark (cargado global en styles.scss), legible sobre el fondo negro;
 * el texto base y los comentarios se fuerzan a un gris claro para que no se apaguen.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'fb-code-block',
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
        background: var(--surface);
      }
      figcaption {
        font-family: var(--font-display);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 6px 14px;
        background: var(--accent);
        color: var(--surface);
        border-bottom: var(--border-width) solid var(--border);
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
      /* Comentarios legibles sobre negro (el gris apagado del tema se sube). */
      code ::ng-deep .hljs-comment {
        color: #6f7681;
      }
    `,
  ],
})
export class FullBrutalistCodeBlock implements CodeBlockContract {
  readonly code = input('');
  readonly label = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const src = this.code();
    if (!src) return '';
    return hljs.highlight(src, { language: 'typescript' }).value;
  });
}
