import { Component, input, output } from '@angular/core';
import { ButtonContract } from '../../../ui-contracts/button.contract';

/** Botón editorial: pill suave, tipografía de display, acento cálido. */
@Component({
  selector: 'editorial-button',
  standalone: true,
  template: `
    <button class="e-btn" [attr.data-variant]="variant()" [disabled]="disabled()" (click)="pressed.emit()">
      <ng-content />
    </button>
  `,
  styles: [
    `
      .e-btn {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 14px;
        padding: 10px 20px;
        background: transparent;
        color: var(--ink);
        border: var(--border-width) solid var(--ink);
        border-radius: var(--radius);
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
      }
      .e-btn[data-variant='solid'] {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--surface-raised);
      }
      .e-btn:hover:not(:disabled) {
        background: var(--ink);
        color: var(--surface-raised);
      }
      .e-btn[data-variant='solid']:hover:not(:disabled) {
        background: var(--ink);
        border-color: var(--ink);
      }
      .e-btn:disabled {
        background: transparent;
        color: var(--ink-muted);
        border-color: var(--ink-muted);
        cursor: not-allowed;
      }
    `,
  ],
})
export class EditorialButton implements ButtonContract {
  readonly variant = input<'solid' | 'ghost'>('ghost');
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
