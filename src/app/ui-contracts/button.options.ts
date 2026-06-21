import { createOptions } from '../core/utils/di';
import { type ButtonVariant } from './button.contract';

export interface ButtonOptions {
  readonly variant: ButtonVariant;
}

export const BUTTON_DEFAULT_OPTIONS: ButtonOptions = {
  variant: 'ghost',
};

/**
 * Token + provider del default de los botones (estilo Taiga `tuiButtonOptions`).
 * `provideButtonOptions({variant: 'solid'})` en un subárbol cambia el default sin
 * tocar cada `<*-button>`.
 */
export const [BUTTON_OPTIONS, provideButtonOptions] = createOptions(BUTTON_DEFAULT_OPTIONS);
