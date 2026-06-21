import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';

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
  /** Mensaje del último fallo de worker (null = ninguno). Lo muestra la UI. */
  readonly error = signal<string | null>(null);

  /** Corre la escala completa: 1, 2, 4, 8, 16 workers en paralelo, midiendo cada tanda. */
  async runScale(example: WorkerExample, limit: number): Promise<void> {
    if (this.running() || !example.workerFactory) {
      return;
    }
    this.runs.set([]);
    this.error.set(null);
    this.running.set(true);
    // try/finally: pase lo que pase (incluido un fallo de worker), running vuelve a
    // false y no deja la demo trabada con el spinner para siempre.
    try {
      for (const k of this.scale) {
        this.currentWorkers.set(k);
        const ms = await this.runK(example, k, limit);
        this.runs.update((r) => [...r, { workers: k, ms }]);
      }
    } finally {
      this.currentWorkers.set(0);
      this.running.set(false);
    }
  }

  /**
   * Corre K workers a la vez con el mismo trabajo; resuelve con el wall-clock total.
   * Un worker que falla (onerror — p.ej. OOM al lanzar 32 hilos) cuenta como término:
   * se termina y se suma al contador, así la tanda no queda esperando un onmessage que
   * nunca llega. Sin esto, la Promise no resuelve y la escala se cuelga.
   */
  private runK(example: WorkerExample, k: number, limit: number): Promise<number> {
    return new Promise<number>((resolve) => {
      const t0 = this.clock();
      let done = 0;
      const settle = (worker: WorkerLike) => {
        worker.terminate();
        done += 1;
        if (done === k) {
          resolve(Math.round(this.clock() - t0));
        }
      };
      for (let i = 0; i < k; i++) {
        const worker = example.workerFactory!() as unknown as WorkerLike;
        worker.onmessage = () => settle(worker);
        worker.onerror = (event) => {
          (event as { preventDefault?: () => void })?.preventDefault?.();
          this.error.set(this.messageOf(event));
          settle(worker);
        };
        worker.postMessage({ command: 'compute', limit });
      }
    });
  }

  private messageOf(event: unknown): string {
    const message = (event as { message?: string })?.message;
    return message ?? 'Un worker falló al ejecutarse';
  }

  reset(): void {
    this.runs.set([]);
    this.running.set(false);
    this.currentWorkers.set(0);
    this.error.set(null);
  }
}
