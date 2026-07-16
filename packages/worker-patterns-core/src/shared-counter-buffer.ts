import type { WorkerLike } from './worker-like.js';
import { readShared, reachedTarget } from './shared-counter.logic.js';

/**
 * Wrapper agnostico de framework alrededor de un contador en `SharedArrayBuffer`
 * (ejemplo 12 de web-worker-patterns). Encapsula:
 *
 *  - la deteccion de soporte real (no alcanza con `typeof SharedArrayBuffer`: el
 *    gate fiable es `crossOriginIsolated`, que solo es true si el documento/proceso
 *    sirvio COOP/COEP),
 *  - la creacion del `SharedArrayBuffer` y el arranque del productor (un
 *    `WorkerLike`) via `postMessage`,
 *  - un fallback SIMULADO (buffer local que sube por timer) cuando no hay
 *    aislamiento cross-origin, para poder seguir mostrando el concepto,
 *  - el polling del lado lector (Atomics.load, sin recibir mensajes).
 *
 * Sin ningun import de Angular ni de ningun otro framework: consume `setInterval`
 * global y el contrato `WorkerLike`, nada mas.
 */
export interface SharedCounterOptions {
  /** A cuanto tiene que llegar el contador para considerarse terminado. */
  target: number;
  /** Cada cuanto el productor (worker real o simulado) incrementa. */
  intervalMs?: number;
  /** Cada cuanto el lector hace poll de la memoria. */
  pollIntervalMs?: number;
}

export interface SharedCounterHandlers {
  /** Se llama en cada poll con el valor leido (aunque no haya cambiado). */
  onValue?: (value: number) => void;
  /** Se llama una sola vez, cuando el valor alcanza el target. */
  onFinish?: (value: number) => void;
}

const DEFAULT_INTERVAL_MS = 60;
const DEFAULT_POLL_INTERVAL_MS = 30;

/** True solo si se puede compartir memoria real entre hilos en este entorno. */
export function isSharedMemorySupported(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true
  );
}

export class SharedCounterBuffer {
  private view?: Int32Array;
  private worker?: WorkerLike;
  private producerTimer?: ReturnType<typeof setInterval>;
  private pollTimer?: ReturnType<typeof setInterval>;
  private finished = false;

  /**
   * Arranca el contador. Si `worker` esta presente y hay soporte real, comparte
   * un `SharedArrayBuffer` con el; si no, cae al backend simulado (mismo
   * comportamiento observable, sin memoria compartida real).
   */
  start(
    worker: WorkerLike | undefined,
    options: SharedCounterOptions,
    handlers: SharedCounterHandlers = {},
  ): void {
    this.stop();
    this.finished = false;
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const usingRealSharedMemory = isSharedMemorySupported() && worker !== undefined;

    if (usingRealSharedMemory) {
      const sab = new SharedArrayBuffer(4); // un Int32
      this.view = new Int32Array(sab);
      this.worker = worker;
      worker!.postMessage({ command: 'start', sab, target: options.target, intervalMs });
    } else {
      this.view = new Int32Array(new ArrayBuffer(4));
      this.producerTimer = setInterval(() => {
        if (!this.view) {
          return;
        }
        this.view[0] += 1;
      }, intervalMs);
    }

    this.pollTimer = setInterval(() => {
      if (!this.view || this.finished) {
        return;
      }
      const v = usingRealSharedMemory ? readShared(this.view) : this.view[0];
      handlers.onValue?.(v);
      if (reachedTarget(v, options.target)) {
        this.finished = true;
        this.stopTimers();
        this.worker?.terminate();
        this.worker = undefined;
        handlers.onFinish?.(v);
      }
    }, pollIntervalMs);
  }

  /** Valor actual leido de la memoria (0 si nunca arranco). */
  get value(): number {
    return this.view ? this.view[0] : 0;
  }

  /** Frena timers y termina el worker sin disparar `onFinish`. */
  stop(): void {
    this.stopTimers();
    this.worker?.terminate();
    this.worker = undefined;
    this.view = undefined;
  }

  private stopTimers(): void {
    if (this.producerTimer !== undefined) {
      clearInterval(this.producerTimer);
      this.producerTimer = undefined;
    }
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }
}
