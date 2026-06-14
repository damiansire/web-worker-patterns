import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { countPrimesUpTo } from '../domain/workers/primes.worker.logic';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export interface ComputeResult {
  count: number;
  ms: number;
  limit: number;
}

export type ComputePhase = 'idle' | 'worker' | 'main';

/**
 * Demo de offloading de cómputo pesado (ejemplo 04). Corre el MISMO cálculo en
 * dos lugares:
 *   - en un worker: la UI sigue fluida y un cronómetro en vivo sube mientras
 *     calcula (prueba de que el main está libre);
 *   - en el main: el mismo cálculo bloquea el hilo y la página entera se congela
 *     hasta que termina.
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class ComputeDemoService {
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  private worker?: WorkerLike;
  private liveTimer?: ReturnType<typeof setInterval>;
  private liveStart = 0;

  readonly workerResult = signal<ComputeResult | null>(null);
  readonly mainResult = signal<ComputeResult | null>(null);
  /** Cronómetro en vivo mientras el worker calcula (sube solo si el main está libre). */
  readonly liveMs = signal(0);
  readonly phase = signal<ComputePhase>('idle');

  /** Corre el cómputo EN UN WORKER: la UI no se traba; el cronómetro sube en vivo. */
  runWorker(example: WorkerExample, limit: number): void {
    if (this.phase() === 'worker' || !example.workerFactory) {
      return;
    }
    this.stopLive();
    this.phase.set('worker');
    this.workerResult.set(null);

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    const t0 = this.clock();
    this.liveStart = t0;
    this.liveMs.set(0);
    this.liveTimer = setInterval(
      () => this.liveMs.set(Math.round(this.clock() - this.liveStart)),
      50,
    );

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; count?: number };
      if (data?.type === 'result') {
        const ms = Math.round(this.clock() - t0);
        this.stopLive();
        this.liveMs.set(ms);
        this.workerResult.set({ count: data.count ?? 0, ms, limit });
        this.phase.set('idle');
        worker.terminate();
        this.worker = undefined;
      }
    };
    worker.postMessage({ command: 'compute', limit });
  }

  /** Corre el MISMO cómputo EN EL MAIN: bloquea el hilo, la página se congela. */
  runMain(limit: number): void {
    this.phase.set('main');
    this.mainResult.set(null);
    const t0 = this.clock();
    const count = countPrimesUpTo(limit); // <- acá se congela todo
    this.mainResult.set({ count, ms: Math.round(this.clock() - t0), limit });
    this.phase.set('idle');
  }

  reset(): void {
    this.stopLive();
    this.worker?.terminate();
    this.worker = undefined;
    this.workerResult.set(null);
    this.mainResult.set(null);
    this.liveMs.set(0);
    this.phase.set('idle');
  }

  private stopLive(): void {
    if (this.liveTimer !== undefined) {
      clearInterval(this.liveTimer);
      this.liveTimer = undefined;
    }
  }
}
