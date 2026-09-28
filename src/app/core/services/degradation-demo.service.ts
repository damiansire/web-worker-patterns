import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';
import { countPrimesUpTo } from '../domain/workers/primes.worker.logic';
import { afterNextPaint } from '../domain/thread-demo';

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
 *   - si no (o si forzás el fallback): corre la MISMA función en el main: la UI
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

  /** Cuándo arranca el cómputo en el main. Inyectable para tests sincrónicos. */
  defer: (run: () => void) => void = afterNextPaint;

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
      const worker = example.workerFactory!();
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
      // `typeof Worker` dice que la API existe, no que ESTE worker funcione: el script
      // puede no cargar (404, CSP) o fallar al computar. Degradar con gracia también
      // es caer al main en ese caso, en vez de quedarse sin resultado.
      worker.onerror = (event) => {
        (event as { preventDefault?: () => void })?.preventDefault?.();
        worker.terminate();
        this.worker = undefined;
        this.runOnMain(limit);
        this.running.set(false);
      };
      worker.postMessage({ command: 'compute', limit });
    } else {
      // Diferido: el estado "procesando" tiene que llegar a pintarse ANTES del freeze.
      this.running.set(true);
      this.defer(() => {
        this.runOnMain(limit);
        this.running.set(false);
      });
    }
  }

  /** Fallback: corre la MISMA función en el main (bloquea hasta terminar). */
  private runOnMain(limit: number): void {
    const t0 = this.clock();
    const value = countPrimesUpTo(limit);
    this.result.set({ value, ms: Math.round(this.clock() - t0), path: 'main' });
  }

  reset(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.result.set(null);
    this.running.set(false);
    this.forceFallback.set(false);
  }
}
