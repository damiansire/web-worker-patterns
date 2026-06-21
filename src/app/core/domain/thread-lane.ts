/**
 * Contrato neutral de actividad de hilos (dominio).
 *
 * Es la frontera entre el productor del dato (ThreadMonitorService) y sus
 * consumidores (las primitivas ThreadVisualizer de cada theme, el contrato de
 * UI y el dominio thread-demo). Vive en dominio —no en el servicio— para que el
 * dominio no dependa del servicio que lo produce (evita la inversión
 * dominio↔servicio). El servicio re-exporta estos tipos por conveniencia.
 */

export type ThreadState = 'main' | 'worker' | 'blocked' | 'idle';

export interface ThreadSegment {
  startMs: number;
  endMs: number;
  state: ThreadState;
}

export interface ThreadLane {
  id: string; // 'main' | 'timer' | 'worker' | ...
  label: string;
  segments: ThreadSegment[];
}
