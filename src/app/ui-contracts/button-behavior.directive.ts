import { booleanAttribute, Directive, inject, input, output } from '@angular/core';

import { type ButtonVariant, ButtonContract } from './button.contract';
import { BUTTON_OPTIONS } from './button.options';

/**
 * Comportamiento compartido de los botones de tema (estilo Taiga `hostDirectives`):
 * concentra la API del botón (`variant` / `disabled` / `pressed`) una sola vez.
 *
 * Cada botón de tema la compone con `hostDirectives` y aporta sólo su template y
 * sus estilos — sin re-declarar inputs/outputs. El default de `variant` sale del
 * token de opciones, configurable por DI.
 */
@Directive()
export class ButtonBehavior implements ButtonContract {
  public readonly variant = input<ButtonVariant>(inject(BUTTON_OPTIONS).variant);
  // booleanAttribute: que `<btn disabled>` (atributo HTML sin valor) cuente como true,
  // igual que el <button> nativo — no sólo `[disabled]="true"`.
  public readonly disabled = input(false, { transform: booleanAttribute });
  public readonly pressed = output<void>();
}
