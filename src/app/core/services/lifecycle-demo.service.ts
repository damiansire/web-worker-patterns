import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';

export type LifecycleStatus = 'idle' | 'running' | 'terminated' | 'done';

/**
 * Demo del ciclo de vida de un worker (ejemplo 06). Arranca una tarea larga que
 * reporta progreso por pasos y la deja controlar desde el main:
 *   - `terminate()` la mata al instante: el paso en curso se descarta y el
 *     worker deja de existir (un worker terminado NO se reusa: hay que crear
 *     otro). El progreso queda congelado donde estaba.
 *   - si se la deja completar, el worker se cierra solo (`self.close()`).
 *
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class LifecycleDemoService {
  private worker?: WorkerLike;

  readonly status = signal<LifecycleStatus>('idle');
  readonly step = signal(0);
  readonly steps = signal(0);

  /** Arranca una tarea nueva. Siempre crea un worker fresco (el anterior, si lo había, se descarta). */
  start(example: WorkerExample, steps: number): void {
    if (this.status() === 'running' || !example.workerFactory) {
      return;
    }
    this.worker?.terminate();
    this.step.set(0);
    this.steps.set(steps);
    this.status.set('running');

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; step?: number; steps?: number };
      if (data?.type === 'progress') {
        this.step.set(data.step ?? 0);
        this.steps.set(data.steps ?? steps);
      } else if (data?.type === 'done') {
        this.status.set('done');
        this.worker = undefined; // el worker se cerró solo (self.close)
      }
    };
    worker.postMessage({ command: 'start', steps });
  }

  /** Corta la tarea a mitad: mata el worker ya, el trabajo en curso se pierde. */
  terminate(): void {
    if (this.status() !== 'running') {
      return;
    }
    this.worker?.terminate();
    this.worker = undefined;
    this.status.set('terminated'); // el progreso queda donde estaba
  }

  reset(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.step.set(0);
    this.steps.set(0);
    this.status.set('idle');
  }
}
