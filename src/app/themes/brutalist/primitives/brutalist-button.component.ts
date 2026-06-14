import { Component, input, output } from '@angular/core';
import { ButtonContract } from '../../../ui-contracts/button.contract';

/**
 * Botón brutalista (oscuro): bordes amarillos gruesos, sombra dura, sin radius.
 * Disabled = estado apagado explícito (gris sobre negro, plano), nunca pastel.
 */
@Component({
  selector: 'brutalist-button',
  standalone: true,
  template: `
    <button class="b-btn" [attr.data-variant]="variant()" [disabled]="disabled()" (click)="pressed.emit()">
      <ng-content />
    </button>
  `,
  styles: [
    `
      .b-btn {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 10px 18px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        box-shadow: 4px 4px 0 var(--border);
        cursor: pointer;
        transition: transform 0.05s, box-shadow 0.05s;
      }
      .b-btn[data-variant='solid'] {
        background: var(--accent);
        color: var(--surface);
      }
      .b-btn:not(:disabled):active {
        transform: translate(4px, 4px);
        box-shadow: 0 0 0 var(--border);
      }
      /* Apagado pero legible: gris plano sobre negro, sin sombra, coherente con
         la paleta. Aplica igual a solid y ghost (nunca amarillo pálido/pastel). */
      .b-btn:disabled {
        background: transparent;
        color: var(--ink-muted);
        border-color: #3a3a3a;
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
  ],
})
export class BrutalistButton implements ButtonContract {
  readonly variant = input<'solid' | 'ghost'>('ghost');
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
