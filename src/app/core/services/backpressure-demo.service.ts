import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export type BackpressureMode = 'idle' | 'naive' | 'backpressure';

/**
 * Demo de backpressure (ejemplo 11). El productor (main) genera más mensajes de
 * los que el worker alcanza a procesar. Lo corre de dos formas:
 *   - naive (sin control de flujo): dispara las M tareas de una. La cola del
 *     worker se infla hasta M: memoria y latencia sin techo.
 *   - backpressure: sólo manda mientras haya "crédito" (una ventana chica) y
 *     espera el ack del worker antes de mandar la próxima. La cola nunca pasa
 *     de la ventana.
 * La métrica que enseña: el PICO de mensajes en cola (pending) de cada modo.
 * Estado en signals root para que sobreviva el cambio de theme.
 */
@Injectable({ providedIn: 'root' })
export class BackpressureDemoService {
  /** Total de mensajes que produce el productor. */
  readonly total = 40;
  /** Ventana de crédito del modo con backpressure (cuántos en vuelo permite). */
  readonly windowSize = 3;

  /** Mensajes en cola ahora (en vuelo: enviados - confirmados). */
  readonly pending = signal(0);
  readonly mode = signal<BackpressureMode>('idle');
  /** Pico de cola alcanzado en cada modo (la lección). */
  readonly naivePeak = signal<number | null>(null);
  readonly bpPeak = signal<number | null>(null);

  private worker?: WorkerLike;
  private sent = 0;
  private acked = 0;
  private peak = 0;
  private current: 'naive' | 'backpressure' = 'naive';
  private limit = 0;

  runNaive(example: WorkerExample, limit: number): void {
    this.run(example, limit, 'naive');
  }

  runBackpressure(example: WorkerExample, limit: number): void {
    this.run(example, limit, 'backpressure');
  }

  private run(example: WorkerExample, limit: number, mode: 'naive' | 'backpressure'): void {
    if (this.mode() !== 'idle' || !example.workerFactory) {
      return;
    }
    this.worker?.terminate();
    this.worker = example.workerFactory() as unknown as WorkerLike;
    this.worker.onmessage = () => this.onAck();
    this.sent = 0;
    this.acked = 0;
    this.peak = 0;
    this.limit = limit;
    this.current = mode;
    this.pending.set(0);
    this.mode.set(mode);

    // naive dispara TODO; backpressure sólo la ventana de crédito.
    const burst = mode === 'naive' ? this.total : this.windowSize;
    for (let i = 0; i < burst; i++) {
      this.post();
    }
  }

  private post(): void {
    if (this.sent >= this.total || !this.worker) {
      return;
    }
    this.sent += 1;
    const inFlight = this.sent - this.acked;
    this.pending.set(inFlight);
    if (inFlight > this.peak) {
      this.peak = inFlight;
    }
    this.worker.postMessage({ command: 'compute', limit: this.limit });
  }

  private onAck(): void {
    this.acked += 1;
    this.pending.set(this.sent - this.acked);
    // Con backpressure, recién ahora (al liberar crédito) mandamos la próxima.
    if (this.current === 'backpressure') {
      this.post();
    }
    if (this.acked >= this.total) {
      this.finish();
    }
  }

  private finish(): void {
    if (this.current === 'naive') {
      this.naivePeak.set(this.peak);
    } else {
      this.bpPeak.set(this.peak);
    }
    this.worker?.terminate();
    this.worker = undefined;
    this.pending.set(0);
    this.mode.set('idle');
  }

  reset(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.sent = 0;
    this.acked = 0;
    this.peak = 0;
    this.pending.set(0);
    this.naivePeak.set(null);
    this.bpPeak.set(null);
    this.mode.set('idle');
  }
}
