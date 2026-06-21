import { InjectionToken, InputSignal, Type } from '@angular/core';
import { ThreadLane } from '../core/domain/thread-lane';

/**
 * Contrato del ThreadVisualizer (ARQUITECTURA §5).
 *
 * El visualizador es estructuralmente distinto en cada theme (barras diagonales,
 * celdas duras, etc.): no alcanza con CSS. Cada theme provee su implementación
 * vía el token `THREAD_VISUALIZER`, y un layout la monta con `ngComponentOutlet`
 * pasándole los inputs neutrales del ThreadMonitorService. El dato es uno, el
 * render son cuatro.
 */
export abstract class ThreadVisualizerContract {
  abstract lanes: InputSignal<ThreadLane[]>;
  abstract elapsedMs: InputSignal<number>;
}

export const THREAD_VISUALIZER = new InjectionToken<Type<ThreadVisualizerContract>>(
  'THREAD_VISUALIZER',
);
