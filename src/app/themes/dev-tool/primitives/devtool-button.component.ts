import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonBehavior } from '../../../ui-contracts/button-behavior.directive';

/** Botón dev-tool: estilo IDE/terminal, sutil, mono. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'devtool-button',
  hostDirectives: [
    { directive: ButtonBehavior, inputs: ['variant', 'disabled'], outputs: ['pressed'] },
  ],
  template: `
    <button
      type="button"
      class="dt-btn"
      [attr.data-variant]="behavior.variant()"
      [disabled]="behavior.disabled()"
      (click)="behavior.pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      .dt-btn {
        font-family: var(--font-mono);
        font-size: 12px;
        padding: 6px 12px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition:
          border-color 0.12s,
          background 0.12s;
      }
      .dt-btn:hover:not(:disabled) {
        border-color: var(--accent);
      }
      .dt-btn[data-variant='solid'] {
        background: var(--accent);
        color: var(--surface);
        border-color: var(--accent);
      }
      .dt-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .dt-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class DevToolButton {
  protected readonly behavior = inject(ButtonBehavior);
}
