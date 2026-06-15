import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import {
  buildPayload,
  countNodes,
  serializedBytes,
  PayloadConfig,
} from '../domain/workers/clone-cost.worker.logic';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export interface CloneMeasure {
  size: number;
  depth: number;
  nodeCount: number;
  serializedBytes: number;
  /** Round-trip medido (ms): structured clone ida + vuelta. */
  ms: number;
}

/**
 * Demo de costo de structured clone (ejemplo 15). Hace un BARRIDO: para tamaños
 * crecientes a una profundidad fija, manda el payload al worker y mide el
 * round-trip REAL (postMessage clona al salir y al volver). Cada medición es un
 * punto {bytes, ms} de la curva — no hay número inventado, lo mide la máquina.
 *
 * Estado en signals root para que sobreviva el cambio de theme. El reloj es
 * inyectable para tests deterministas (mismo patrón que ComputeDemoService).
 */
@Injectable({ providedIn: 'root' })
export class CloneCostDemoService {
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  private worker?: WorkerLike;
  private queue: PayloadConfig[] = [];
  private current?: {
    config: PayloadConfig;
    payload: unknown;
    nodeCount: number;
    bytes: number;
    samples: number[];
    t0: number;
  };
  private nextId = 0;
  private reps = 3;
  /** Primera medición descartada: paga el arranque (JIT, primer postMessage, serializer en frío). */
  private warming = false;

  readonly measurements = signal<CloneMeasure[]>([]);
  readonly running = signal(false);
  /** Profundidad del barrido en curso (rotula la curva en la UI). */
  readonly depth = signal(0);

  /**
   * Corre el barrido: `steps` payloads de tamaño 1/steps..maxSize a profundidad
   * `depth`. Secuencial (manda el siguiente recién cuando vuelve el anterior) para
   * que cada medición sea limpia.
   */
  runSweep(
    example: WorkerExample,
    opts: { maxSize: number; depth: number; steps?: number; reps?: number },
  ): void {
    if (this.running() || !example.workerFactory) {
      return;
    }
    const steps = Math.max(1, Math.floor(opts.steps ?? 8));
    const maxSize = Math.max(1, Math.floor(opts.maxSize));
    const depth = Math.max(0, Math.floor(opts.depth));
    this.reps = Math.max(1, Math.floor(opts.reps ?? 3));

    this.measurements.set([]);
    this.depth.set(depth);
    this.running.set(true);
    this.queue = Array.from({ length: steps }, (_, i) => ({
      size: Math.round((maxSize * (i + 1)) / steps),
      depth,
    }));

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    worker.onmessage = () => this.onReply();

    // Warm-up: una vuelta descartada ANTES de cronometrar, para que el costo de
    // arranque (compilar el handler, primer postMessage, serializer en frío) no
    // quede clavado como un pico en la primera medición e invierta la curva.
    this.warming = true;
    this.current = undefined;
    worker.postMessage({ id: this.nextId++, payload: buildPayload({ size: 200, depth }) });
  }

  private sendNext(): void {
    const config = this.queue.shift();
    if (!config || !this.worker) {
      this.finish();
      return;
    }
    const payload = buildPayload(config);
    this.current = {
      config,
      payload,
      nodeCount: countNodes(payload),
      bytes: serializedBytes(payload),
      samples: [],
      t0: this.clock(),
    };
    this.worker.postMessage({ id: this.nextId++, payload });
  }

  private onReply(): void {
    // La vuelta de warm-up no se registra: dispara el barrido real y listo.
    if (this.warming) {
      this.warming = false;
      this.sendNext();
      return;
    }
    const cur = this.current;
    if (!cur || !this.worker) {
      return;
    }
    cur.samples.push(this.clock() - cur.t0);

    // Cada tamaño se mide `reps` veces; re-medimos el MISMO payload hasta juntar
    // las muestras y después registramos la MEDIANA. La mediana es inmune a un
    // outlier aislado (una pausa de GC o del scheduler) que si no reescalaría el
    // eje Y y aplastaría la tendencia real.
    if (cur.samples.length < this.reps) {
      cur.t0 = this.clock();
      this.worker.postMessage({ id: this.nextId++, payload: cur.payload });
      return;
    }

    this.measurements.update((m) => [
      ...m,
      {
        size: cur.config.size,
        depth: cur.config.depth,
        nodeCount: cur.nodeCount,
        serializedBytes: cur.bytes,
        ms: median(cur.samples),
      },
    ]);
    this.current = undefined;
    this.sendNext();
  }

  private finish(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.running.set(false);
  }

  reset(): void {
    this.finish();
    this.queue = [];
    this.current = undefined;
    this.warming = false;
    this.measurements.set([]);
    this.depth.set(0);
  }
}

/** Mediana de una lista no vacía (robusta a un outlier aislado). */
function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
