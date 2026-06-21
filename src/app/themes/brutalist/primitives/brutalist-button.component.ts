import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonBehavior } from '../../../ui-contracts/button-behavior.directive';

/** Botón brutalista: bordes negros gruesos, sin radius, sombra dura. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'brutalist-button',
  hostDirectives: [
    { directive: ButtonBehavior, inputs: ['variant', 'disabled'], outputs: ['pressed'] },
  ],
  template: `
    <button
      type="button"
      class="b-btn"
      [attr.data-variant]="behavior.variant()"
      [disabled]="behavior.disabled()"
      (click)="behavior.pressed.emit()"
    >
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
        transition:
          transform 0.05s,
          box-shadow 0.05s;
      }
      .b-btn[data-variant='solid'] {
        background: var(--accent);
        color: var(--surface-raised);
      }
      .b-btn:active {
        transform: translate(4px, 4px);
        box-shadow: 0 0 0 var(--border);
      }
      .b-btn:focus-visible {
        outline: 3px solid var(--accent);
        outline-offset: 2px;
      }
      .b-btn:disabled {
        background: var(--surface-raised);
        color: var(--ink-muted);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
  ],
})
export class BrutalistButton {
  protected readonly behavior = inject(ButtonBehavior);
}
