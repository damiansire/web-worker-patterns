import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';

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
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  /** Total de mensajes que produce el productor. */
  readonly total = 40;
  /** Ventana de crédito del modo con backpressure (cuántos en vuelo permite). */
  readonly windowSize = 3;

  /** Mensajes en vuelo ahora (enviados - confirmados, desde la óptica del productor). */
  readonly pending = signal(0);
  readonly mode = signal<BackpressureMode>('idle');
  /** Pico de mensajes en vuelo (sin confirmar) en cada modo. */
  readonly naivePeak = signal<number | null>(null);
  readonly bpPeak = signal<number | null>(null);
  /**
   * Latencia de cola (tail): cuánto tardó en volver la PEOR respuesta de la tanda, en ms.
   * Es la consecuencia física de la cola sin techo — sin control de flujo, la última espera
   * detrás de todas; con backpressure queda acotada a la ventana. La lección de verdad.
   */
  readonly naiveMaxLatency = signal<number | null>(null);
  readonly bpMaxLatency = signal<number | null>(null);
  /** Mensaje del último fallo de worker (null = ninguno). Lo muestra la UI. */
  readonly error = signal<string | null>(null);

  private worker?: WorkerLike;
  private sent = 0;
  private acked = 0;
  private peak = 0;
  private current: 'naive' | 'backpressure' = 'naive';
  private limit = 0;
  /** Marca de tiempo de cada mensaje enviado, en orden FIFO (el worker responde en orden). */
  private sendTimes: number[] = [];
  private maxLatency = 0;

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
    this.error.set(null);
    this.worker = example.workerFactory() as unknown as WorkerLike;
    this.worker.onmessage = () => this.onAck();
    this.worker.onerror = (event) => this.onError(event);
    this.sent = 0;
    this.acked = 0;
    this.peak = 0;
    this.maxLatency = 0;
    this.sendTimes = [];
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
    this.sendTimes.push(this.clock());
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
    // El worker responde FIFO: este ack es del mensaje más viejo sin confirmar. Su latencia
    // (ahora - cuándo se envió) es lo que esa respuesta esperó en la cola + el procesado.
    const startedAt = this.sendTimes.shift();
    if (startedAt != null) {
      const latency = this.clock() - startedAt;
      if (latency > this.maxLatency) {
        this.maxLatency = latency;
      }
    }
    // Con backpressure, recién ahora (al liberar crédito) mandamos la próxima.
    if (this.current === 'backpressure') {
      this.post();
    }
    if (this.acked >= this.total) {
      this.finish();
    }
  }

  /**
   * El worker de primos falló (onerror). Sin esto, mode() quedaría fijo en 'naive'/
   * 'backpressure' para siempre (running == true), bloqueando toda re-corrida y dejando
   * pending con un valor viejo. Registramos el error y liberamos el estado a 'idle'.
   */
  private onError(event: unknown): void {
    (event as { preventDefault?: () => void })?.preventDefault?.();
    const message = (event as { message?: string })?.message;
    this.error.set(message ?? 'El worker falló durante la tanda');
    this.worker?.terminate();
    this.worker = undefined;
    this.pending.set(0);
    this.mode.set('idle');
  }

  private finish(): void {
    if (this.current === 'naive') {
      this.naivePeak.set(this.peak);
      this.naiveMaxLatency.set(Math.round(this.maxLatency));
    } else {
      this.bpPeak.set(this.peak);
      this.bpMaxLatency.set(Math.round(this.maxLatency));
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
    this.maxLatency = 0;
    this.sendTimes = [];
    this.pending.set(0);
    this.naivePeak.set(null);
    this.bpPeak.set(null);
    this.naiveMaxLatency.set(null);
    this.bpMaxLatency.set(null);
    this.error.set(null);
    this.mode.set('idle');
  }
}
