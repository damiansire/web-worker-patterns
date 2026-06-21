import { Injectable, inject, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { ThreadLane } from './thread-monitor.service';
import { ThreadMonitorService } from './thread-monitor.service';
import { buildBlockedLanes, buildWorkerLanes, busyBlock } from '../domain/thread-demo';

export type RunPhase = 'idle' | 'worker' | 'main';

/**
 * Corre un ejemplo: spawnea su worker real y vuelca su actividad en el
 * ThreadMonitorService (ARQUITECTURA §3.2 / §10.2). Es neutral: no sabe nada de
 * themes. El estado vive en signals root, así que cambiar de theme con un worker
 * corriendo no reinicia nada.
 */

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ExampleRunnerService {
  private readonly monitor = inject(ThreadMonitorService);
  private worker?: WorkerLike;

  private readonly _runningId = signal<string | null>(null);
  readonly runningId = this._runningId.asReadonly();
  readonly lastTick = signal(0);

  // ── Demo de contraste worker vs main thread (backlog #2) ──────────────────
  // Dos corridas comparables, cada una con sus carriles, para verlas lado a lado.
  private readonly _workerLanes = signal<ThreadLane[] | null>(null);
  private readonly _mainLanes = signal<ThreadLane[] | null>(null);
  readonly workerLanes = this._workerLanes.asReadonly();
  readonly mainLanes = this._mainLanes.asReadonly();
  readonly workerTicks = signal(0);
  readonly mainTicks = signal(0);
  readonly phase = signal<RunPhase>('idle');

  /**
   * Corre el contador EN UN WORKER durante `ticks`. La UI sigue fluida: los
   * carriles se llenan en vivo (main libre · worker activo) y después para solo.
   */
  runWorkerDemo(example: WorkerExample, options?: { intervalMs?: number; ticks?: number }): void {
    const intervalMs = options?.intervalMs ?? 500;
    const ticks = options?.ticks ?? 5;
    this.stop();
    if (!example.workerFactory) {
      return;
    }
    this._workerLanes.set(null);
    this.workerTicks.set(0);
    this.phase.set('worker');

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; tick?: number };
      if (data?.type !== 'tick') {
        return;
      }
      const tick = data.tick ?? 0;
      this.workerTicks.set(tick);
      this._workerLanes.set(buildWorkerLanes(tick, intervalMs));
      if (tick >= ticks) {
        this.stop();
        this.phase.set('idle');
      }
    };
    worker.postMessage({ command: 'start', intervalMs });
  }

  /**
   * Corre el contador BLOQUEANDO el main thread: un busy-loop sincrónico de
   * `ticks * intervalMs` que congela la UI a propósito. Cuando suelta, muestra el
   * carril main en 'blocked' y los ticks que la UI no pudo pintar mientras tanto.
   */
  runMainBlockingDemo(options?: { intervalMs?: number; ticks?: number }): void {
    const intervalMs = options?.intervalMs ?? 500;
    const ticks = options?.ticks ?? 5;
    this.phase.set('main');
    this._mainLanes.set(null);
    this.mainTicks.set(0);

    busyBlock(ticks * intervalMs); // <- acá se congela todo

    this._mainLanes.set(buildBlockedLanes(ticks, intervalMs));
    this.mainTicks.set(ticks);
    this.phase.set('idle');
  }

  /** Limpia ambas corridas de la comparación. */
  resetComparison(): void {
    this.stop();
    this._workerLanes.set(null);
    this._mainLanes.set(null);
    this.workerTicks.set(0);
    this.mainTicks.set(0);
    this.phase.set('idle');
  }

  /** Spawnea el worker del ejemplo y empieza a registrar su actividad. */
  start(example: WorkerExample, options?: { intervalMs?: number }): void {
    this.stop();
    if (!example.workerFactory) {
      return;
    }

    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;

    this.monitor.registerLane('main', 'Main thread');
    this.monitor.registerLane('worker', 'Worker');
    this.monitor.start();
    this.monitor.push('main', 'idle');

    worker.onmessage = (event: MessageEvent) => this.handleMessage(event.data);
    worker.postMessage({ command: 'start', intervalMs: options?.intervalMs ?? 1000 });
    this._runningId.set(example.id);
  }

  private handleMessage(data: { type?: string; tick?: number }): void {
    if (data?.type === 'tick') {
      this.lastTick.set(data.tick ?? this.lastTick());
      // Cada tick: el worker hizo trabajo; el main thread quedó libre. Así el
      // monitor muestra el contraste (worker activo · main responsivo).
      this.monitor.push('main', 'idle');
      this.monitor.push('worker', 'worker');
    }
  }

  stop(): void {
    if (this.worker) {
      this.worker.postMessage({ command: 'stop' });
      // Terminamos el worker: sin terminate() el hilo queda vivo (leak) y el
      // estado `terminated` que la UI/los tests observan nunca se cumple.
      this.worker.terminate();
      this.worker = undefined;
    }
    this._runningId.set(null);
  }
}
