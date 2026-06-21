import {
  type InputSignal,
  type InputSignalWithTransform,
  type OutputEmitterRef,
} from '@angular/core';

export type ButtonVariant = 'solid' | 'ghost';

/**
 * Contrato de botón (ARQUITECTURA §5): la API que todo botón de tema expone.
 *
 * Antes era una clase vacía (`{}`), así que `implements ButtonContract` no daba
 * ninguna type-safety real. Ahora declara los miembros como signals, de modo que
 * la directiva de comportamiento compartida (`ButtonBehavior`) y cualquier otra
 * implementación quedan obligadas a respetar la forma.
 */
export abstract class ButtonContract {
  abstract readonly variant: InputSignal<ButtonVariant>;
  // Acepta `<btn disabled>` (atributo HTML) además de `[disabled]="bool"`: el valor de
  // entrada es unknown y booleanAttribute lo coacciona a boolean (de ahí el With-Transform).
  abstract readonly disabled: InputSignalWithTransform<boolean, unknown>;
  abstract readonly pressed: OutputEmitterRef<void>;
}
