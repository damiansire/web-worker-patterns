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

  /**
   * Token de la escala vigente. `reset()` lo incrementa para abortar la escala en
   * vuelo: la que ya no coincide no crea más tandas ni pisa los signals.
   */
  private runToken = 0;
  /** Workers vivos de la tanda en curso, para poder terminarlos en `reset()`. */
  private readonly live = new Set<WorkerLike>();
  /** Destraba el `await runK` en curso cuando `reset()` aborta la tanda. */
  private cancelCurrent: (() => void) | null = null;

  /** Corre la escala completa: 1, 2, 4, 8, 16 workers en paralelo, midiendo cada tanda. */
  async runScale(example: WorkerExample, limit: number): Promise<void> {
    if (this.running() || !example.workerFactory) {
      return;
    }
    const token = ++this.runToken;
    this.runs.set([]);
    this.error.set(null);
    this.running.set(true);
    // try/finally: pase lo que pase (incluido un fallo de worker), running vuelve a
    // false y no deja la demo trabada con el spinner para siempre.
    try {
      for (const k of this.scale) {
        if (token !== this.runToken) break; // reset() abortó la escala entre tandas
        this.currentWorkers.set(k);
        const ms = await this.runK(example, k, limit);
        if (token !== this.runToken) break; // abortada mientras corría esta tanda
        this.runs.update((r) => [...r, { workers: k, ms }]);
      }
    } finally {
      // Sólo la escala vigente toca los flags: si reset() ya dejó paso a otra
      // corrida, no la pisamos (evita el clobber de una escala nueva).
      if (token === this.runToken) {
        this.currentWorkers.set(0);
        this.running.set(false);
      }
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
      const batch = new Set<WorkerLike>();
      const finish = () => resolve(Math.round(this.clock() - t0));
      const settle = (worker: WorkerLike) => {
        worker.terminate();
        batch.delete(worker);
        this.live.delete(worker);
        done += 1;
        if (done === k) {
          this.cancelCurrent = null;
          finish();
        }
      };
      // reset() invoca esto: termina los workers vivos de la tanda y resuelve, para
      // que el `await runK` no quede colgado esperando un onmessage que ya no llega.
      this.cancelCurrent = () => {
        for (const worker of batch) {
          worker.terminate();
          this.live.delete(worker);
        }
        batch.clear();
        this.cancelCurrent = null;
        finish();
      };
      for (let i = 0; i < k; i++) {
        const worker = example.workerFactory!() as unknown as WorkerLike;
        batch.add(worker);
        this.live.add(worker);
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
    // Aborta la escala en vuelo: sin esto, runScale seguía creando tandas (hasta 32
    // workers) fuera de pantalla y (al dejar running=false) un segundo disparo pasaba
    // el guard y arrancaba una escalada concurrente (~64 workers pinneando el CPU).
    this.runToken++;
    this.cancelCurrent?.();
    for (const worker of this.live) {
      worker.terminate();
    }
    this.live.clear();
    this.runs.set([]);
    this.running.set(false);
    this.currentWorkers.set(0);
    this.error.set(null);
  }
}
