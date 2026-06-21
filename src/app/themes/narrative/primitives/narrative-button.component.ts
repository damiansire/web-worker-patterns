import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonBehavior } from '../../../ui-contracts/button-behavior.directive';

/** Botón narrative: editorial de revista, serif, subrayado animado. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'narrative-button',
  hostDirectives: [
    { directive: ButtonBehavior, inputs: ['variant', 'disabled'], outputs: ['pressed'] },
  ],
  template: `
    <button
      type="button"
      class="n-btn"
      [attr.data-variant]="behavior.variant()"
      [disabled]="behavior.disabled()"
      (click)="behavior.pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      .n-btn {
        font-family: var(--font-body);
        font-size: 15px;
        padding: 9px 20px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition:
          box-shadow 0.2s,
          transform 0.2s;
      }
      .n-btn[data-variant='solid'] {
        background: var(--accent);
        color: var(--surface-raised);
        border-color: var(--accent);
      }
      .n-btn:hover:not(:disabled) {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }
      .n-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .n-btn:disabled {
        background: var(--surface-raised);
        color: var(--ink-muted);
        border-color: var(--ink-muted);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
  ],
})
export class NarrativeButton {
  protected readonly behavior = inject(ButtonBehavior);
}
