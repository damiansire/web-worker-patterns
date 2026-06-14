import { Component, input, output } from '@angular/core';
import { ButtonContract } from '../../../ui-contracts/button.contract';

/** Botón brutalista: bordes negros gruesos, sin radius, sombra dura. */
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
        font-family: var(--font-mono);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
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
        color: var(--surface-raised);
      }
      .b-btn:active {
        transform: translate(4px, 4px);
        box-shadow: 0 0 0 var(--border);
      }
      .b-btn:disabled {
        opacity: 0.4;
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
