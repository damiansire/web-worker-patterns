import { Injectable, inject, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { ThreadMonitorService } from './thread-monitor.service';

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
      this.worker.terminate();
      this.worker = undefined;
    }
    this._runningId.set(null);
  }
}
