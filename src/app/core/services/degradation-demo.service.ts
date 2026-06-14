import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { countPrimesUpTo } from '../domain/workers/primes.worker.logic';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export interface DegradationResult {
  value: number;
  ms: number;
  /** Qué camino corrió: el worker (ideal) o el main (fallback). */
  path: 'worker' | 'main';
}

/**
 * Demo de degradación elegante (ejemplo 13). El MISMO trabajo se ejecuta por uno
 * de dos caminos, elegido por feature-detection (`typeof Worker`):
 *   - si hay Worker: corre off-thread, la UI no se traba.
 *   - si no (o si forzás el fallback): corre la MISMA función en el main —la UI
 *     se congela, pero el resultado es idéntico y la app sigue funcionando.
 * La lección: detectá la feature y degradá con gracia, así funciona en todos
 * lados, mejor donde se puede.
 *
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class DegradationDemoService {
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  /** Resultado del feature-detect real del entorno. */
  readonly supported = signal(typeof Worker !== 'undefined');
  /** Si el usuario fuerza el camino fallback (simular navegador sin Worker). */
  readonly forceFallback = signal(false);
  readonly result = signal<DegradationResult | null>(null);
  readonly running = signal(false);

  private worker?: WorkerLike;

  toggleFallback(): void {
    if (this.running()) {
      return;
    }
    this.forceFallback.update((v) => !v);
    this.result.set(null);
  }

  /** Corre el trabajo por el camino que corresponda según el feature-detect. */
  run(example: WorkerExample, limit: number): void {
    if (this.running()) {
      return;
    }
    this.result.set(null);
    const useWorker = this.supported() && !this.forceFallback() && !!example.workerFactory;

    if (useWorker) {
      this.running.set(true);
      const worker = example.workerFactory!() as unknown as WorkerLike;
      this.worker = worker;
      const t0 = this.clock();
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as { count?: number };
        this.result.set({
          value: data.count ?? 0,
          ms: Math.round(this.clock() - t0),
          path: 'worker',
        });
        this.running.set(false);
        worker.terminate();
        this.worker = undefined;
      };
      worker.postMessage({ command: 'compute', limit });
    } else {
      // Fallback: corre la MISMA función en el main (bloquea hasta terminar).
      const t0 = this.clock();
      const value = countPrimesUpTo(limit);
      this.result.set({ value, ms: Math.round(this.clock() - t0), path: 'main' });
    }
  }

  reset(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.result.set(null);
    this.running.set(false);
    this.forceFallback.set(false);
  }
}
