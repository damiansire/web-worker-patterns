import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { ThreadLane } from '../domain/thread-lane';
import { WorkerLike } from '../domain/workers/worker-like';
import { buildBlockedLanes, buildWorkerLanes, busyBlock } from '../domain/thread-demo';

export type RunPhase = 'idle' | 'worker' | 'main';

/**
 * Corre el ejemplo de contraste worker-vs-main (demo 01): dos corridas
 * comparables (una en un worker, otra bloqueando el main), cada una con sus
 * `ThreadLane[]`, para verlas lado a lado. Es neutral: no sabe nada de themes. El
 * estado vive en signals root, así que cambiar de theme con un worker corriendo
 * no reinicia nada.
 */
@Injectable({ providedIn: 'root' })
export class ExampleRunnerService {
  private worker?: WorkerLike;

  // ── Demo de contraste worker vs main thread ───────────────────────────────
  // Dos corridas comparables, cada una con sus carriles, para verlas lado a lado.
  private readonly _workerLanes = signal<ThreadLane[] | null>(null);
  private readonly _mainLanes = signal<ThreadLane[] | null>(null);
  readonly workerLanes = this._workerLanes.asReadonly();
  readonly mainLanes = this._mainLanes.asReadonly();
  readonly workerTicks = signal(0);
  readonly mainTicks = signal(0);
  readonly phase = signal<RunPhase>('idle');

  /**
   * Corre el contador EN UN WORKER durante `ticks`. La UI sigue fluida: los
   * carriles se llenan en vivo (main libre · worker activo) y después para solo.
   */
  runWorkerDemo(example: WorkerExample, options?: { intervalMs?: number; ticks?: number }): void {
    const intervalMs = options?.intervalMs ?? 500;
    const ticks = options?.ticks ?? 5;
    this.stop();
    if (!example.workerFactory) {
      return;
    }
    this._workerLanes.set(null);
    this.workerTicks.set(0);
    this.phase.set('worker');

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; tick?: number };
      if (data?.type !== 'tick') {
        return;
      }
      const tick = data.tick ?? 0;
      this.workerTicks.set(tick);
      this._workerLanes.set(buildWorkerLanes(tick, intervalMs));
      if (tick >= ticks) {
        this.stop();
        this.phase.set('idle');
      }
    };
    worker.postMessage({ command: 'start', intervalMs });
  }

  /**
   * Corre el contador BLOQUEANDO el main thread: un busy-loop sincrónico de
   * `ticks * intervalMs` que congela la UI a propósito. Cuando suelta, muestra el
   * carril main en 'blocked' y los ticks que la UI no pudo pintar mientras tanto.
   */
  runMainBlockingDemo(options?: { intervalMs?: number; ticks?: number }): void {
    const intervalMs = options?.intervalMs ?? 500;
    const ticks = options?.ticks ?? 5;
    this.phase.set('main');
    this._mainLanes.set(null);
    this.mainTicks.set(0);

    busyBlock(ticks * intervalMs); // <- acá se congela todo

    this._mainLanes.set(buildBlockedLanes(ticks, intervalMs));
    this.mainTicks.set(ticks);
    this.phase.set('idle');
  }

  stop(): void {
    if (this.worker) {
      this.worker.postMessage({ command: 'stop' });
      // Terminamos el worker: sin terminate() el hilo queda vivo (leak) y el
      // estado `terminated` que la UI/los tests observan nunca se cumple.
      this.worker.terminate();
      this.worker = undefined;
    }
  }
}
