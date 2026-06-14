import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export interface LimitRun {
  /** Cuántos workers corrieron a la vez. */
  workers: number;
  /** Wall-clock hasta que terminaron TODOS (ms). */
  ms: number;
}

/**
 * Demo de límites del paralelismo (ejemplo 09). Corre K copias del MISMO cómputo
 * pesado a la vez, para K en una escala fija, y mide cuánto tarda hasta que
 * terminan todas. Mientras K no supere los núcleos del CPU
 * (`navigator.hardwareConcurrency`), corren de verdad en paralelo y el tiempo se
 * mantiene plano; al pasar ese número, los workers se reparten los núcleos y el
 * tiempo trepa. La lección: más workers que núcleos no es más rápido.
 *
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class WorkerLimitsDemoService {
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  /** Núcleos lógicos del CPU: el umbral donde el paralelismo deja de escalar. */
  readonly hardwareConcurrency = signal(
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8,
  );
  /**
   * Escala fija de cantidades de workers a probar. Llega hasta 32 a propósito:
   * así, incluso en CPUs de 16 núcleos lógicos, al menos una tanda supera el
   * hardwareConcurrency y se ve el salto (la marca de "más workers que núcleos").
   */
  readonly scale: readonly number[] = [1, 2, 4, 8, 16, 32];

  readonly runs = signal<LimitRun[]>([]);
  readonly running = signal(false);
  /** K que se está corriendo ahora (0 = ocioso). */
  readonly currentWorkers = signal(0);

  /** Corre la escala completa: 1, 2, 4, 8, 16 workers en paralelo, midiendo cada tanda. */
  async runScale(example: WorkerExample, limit: number): Promise<void> {
    if (this.running() || !example.workerFactory) {
      return;
    }
    this.runs.set([]);
    this.running.set(true);
    for (const k of this.scale) {
      this.currentWorkers.set(k);
      const ms = await this.runK(example, k, limit);
      this.runs.update((r) => [...r, { workers: k, ms }]);
    }
    this.currentWorkers.set(0);
    this.running.set(false);
  }

  /** Corre K workers a la vez con el mismo trabajo; resuelve con el wall-clock total. */
  private runK(example: WorkerExample, k: number, limit: number): Promise<number> {
    return new Promise<number>((resolve) => {
      const t0 = this.clock();
      let done = 0;
      for (let i = 0; i < k; i++) {
        const worker = example.workerFactory!() as unknown as WorkerLike;
        worker.onmessage = () => {
          worker.terminate();
          done += 1;
          if (done === k) {
            resolve(Math.round(this.clock() - t0));
          }
        };
        worker.postMessage({ command: 'compute', limit });
      }
    });
  }

  reset(): void {
    this.runs.set([]);
    this.running.set(false);
    this.currentWorkers.set(0);
  }
}
