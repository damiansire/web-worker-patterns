import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';

export interface TransferResult {
  /** Round-trip en ms (ida + vuelta del buffer). */
  ms: number;
  /** Tamaño del buffer en MB. */
  mb: number;
  /**
   * Estado del buffer ORIGINAL del main después de mandarlo:
   *   - 'transfer': queda detached (byteLength 0) — el main perdió la propiedad.
   *   - 'clone': intacto — el main conserva su copia.
   */
  detached: boolean;
}

/**
 * Demo de objetos transferibles (ejemplo 07). Manda el MISMO ArrayBuffer de dos
 * maneras y mide el round-trip de cada una:
 *   - transferir: `postMessage(msg, [buf])` no copia (zero-copy), pero deja el
 *     buffer del main detached (byteLength 0): cambió de dueño.
 *   - clonar: `postMessage(msg)` copia el buffer (structured clone); el main
 *     conserva el suyo, pero para datos grandes la copia cuesta.
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class TransferDemoService {
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  readonly transferResult = signal<TransferResult | null>(null);
  readonly cloneResult = signal<TransferResult | null>(null);
  readonly busy = signal(false);

  /** Manda el buffer CON transfer list (zero-copy) y lo trae de vuelta. */
  runTransfer(example: WorkerExample, mb: number): void {
    this.run(example, mb, 'transfer');
  }

  /** Manda el buffer SIN transfer list (structured clone) y lo trae de vuelta. */
  runClone(example: WorkerExample, mb: number): void {
    this.run(example, mb, 'clone');
  }

  private run(example: WorkerExample, mb: number, mode: 'transfer' | 'clone'): void {
    if (this.busy() || !example.workerFactory) {
      return;
    }
    const worker = example.workerFactory() as unknown as WorkerLike;
    const buf = new ArrayBuffer(mb * 1024 * 1024);
    this.busy.set(true);

    const t0 = this.clock();
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string };
      if (data?.type === 'result') {
        const ms = Math.round((this.clock() - t0) * 10) / 10;
        const result: TransferResult = { ms, mb, detached: buf.byteLength === 0 };
        if (mode === 'transfer') {
          this.transferResult.set(result);
        } else {
          this.cloneResult.set(result);
        }
        this.busy.set(false);
        worker.terminate();
      }
    };

    if (mode === 'transfer') {
      worker.postMessage({ buf, mode }, [buf]); // transfer list → zero-copy, deja buf detached
    } else {
      worker.postMessage({ buf, mode }); // structured clone → copia
    }
  }

  reset(): void {
    this.transferResult.set(null);
    this.cloneResult.set(null);
    this.busy.set(false);
  }
}
