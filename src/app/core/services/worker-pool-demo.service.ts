import { Injectable, computed, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';
import { WorkerPool, type WorkerPoolTask } from '@worker-patterns/core';

export interface PoolTask {
  id: number;
  state: 'pending' | 'running' | 'done';
  /** Slot (worker) que la tomó, 1..N. */
  slot?: number;
}

export interface PoolSlot {
  id: number;
  busy: boolean;
  /** Tarea que corre ahora. */
  taskId?: number;
  /** Cuántas tareas ya despachó este slot — la prueba del reuso. */
  processed: number;
}

/**
 * Demo de pool de workers (ejemplo 10). En vez de crear un worker por tarea (lo
 * que el ejemplo 09 mostró que no escala), mantiene un pool FIJO de N workers y
 * los reusa para drenar una cola de M tareas (M >> N): cada worker termina su
 * tarea y agarra la siguiente de la cola. La tesis, mostrada con números: se
 * crean N workers, no M.
 *
 * El scheduler en sí (crear N workers, despachar, reintentar en error, terminar
 * al vaciar la cola) vive en `WorkerPool` de `@worker-patterns/core` — paquete
 * agnóstico de framework (wwp-3/wwp-5, `packages/worker-patterns-core/`). Este
 * servicio es el adaptador delgado: traduce los eventos del pool a signals root
 * (para que el estado sobreviva el cambio de theme, incluso a media cola) y
 * mantiene el "espejo" `tasks`/`slots` que consume la UI.
 */
@Injectable({ providedIn: 'root' })
export class WorkerPoolDemoService {
  /** Tamaño del pool: fijo y chico a propósito (4 se lee bien; no es el hardwareConcurrency). */
  readonly poolSize = signal(4);
  /** Cantidad de tareas en la cola (M >> N). */
  readonly taskCount = 24;
  /**
   * Cuánto se MANTIENE visible cada tarea corriendo en su slot antes de marcarse
   * hecha. Es el ritmo del drenado: con 4 slots y 24 tareas (6 vueltas) da
   * ~3s, suficiente para ver los slots ocupados con su Tn y la cola drenar.
   */
  stepDelayMs = 450;

  readonly tasks = signal<PoolTask[]>([]);
  readonly slots = signal<PoolSlot[]>([]);
  readonly running = signal(false);

  /** Tareas completadas (numerador del "14 / 24"). */
  readonly processed = computed(() => this.tasks().filter((t) => t.state === 'done').length);
  /** La tesis: workers creados = N (con pool) vs M (sin pool, un worker por tarea). */
  readonly workersCreated = computed(() => this.poolSize());
  readonly spawnedWithoutPool = this.taskCount;

  private pool?: WorkerPool<number>;

  /** Arranca el pool: crea N workers UNA vez y drena la cola de M tareas. */
  start(example: WorkerExample, limit: number): void {
    if (this.running() || !example.workerFactory) {
      return;
    }
    this.teardown();
    const n = this.poolSize();
    this.tasks.set(
      Array.from({ length: this.taskCount }, (_, i) => ({ id: i + 1, state: 'pending' as const })),
    );
    this.slots.set(Array.from({ length: n }, (_, i) => ({ id: i + 1, busy: false, processed: 0 })));
    this.running.set(true);

    const tasks: WorkerPoolTask<number>[] = this.tasks().map((t) => ({ id: t.id, payload: limit }));
    this.pool = new WorkerPool<number>(
      {
        poolSize: n,
        tasks,
        workerFactory: () => example.workerFactory!() as unknown as WorkerLike,
        buildMessage: (task) => ({ command: 'compute', limit: task.payload }),
        stepDelayMs: this.stepDelayMs,
      },
      {
        onDispatch: (slotIdx, taskId) => {
          this.slots.update((s) =>
            s.map((sl, i) => (i === slotIdx ? { ...sl, busy: true, taskId } : sl)),
          );
          this.tasks.update((ts) =>
            ts.map((t) =>
              t.id === taskId ? { ...t, state: 'running' as const, slot: slotIdx + 1 } : t,
            ),
          );
        },
        onTaskSettled: (slotIdx, taskId) => {
          this.tasks.update((ts) =>
            ts.map((t) => (t.id === taskId ? { ...t, state: 'done' as const } : t)),
          );
          this.slots.update((s) =>
            s.map((sl, i) => (i === slotIdx ? { ...sl, processed: sl.processed + 1 } : sl)),
          );
        },
        onSlotIdle: (slotIdx) => {
          this.slots.update((s) =>
            s.map((sl, i) => (i === slotIdx ? { ...sl, busy: false, taskId: undefined } : sl)),
          );
        },
        onFinish: () => this.running.set(false),
      },
    );
    this.pool.start();
  }

  reset(): void {
    this.teardown();
    this.tasks.set([]);
    this.slots.set([]);
    this.running.set(false);
  }

  private teardown(): void {
    this.pool?.reset();
    this.pool = undefined;
  }
}
