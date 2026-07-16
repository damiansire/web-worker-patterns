import type { WorkerLike } from './worker-like.js';

/**
 * Pool de workers reusables (ejemplo 10 de web-worker-patterns), agnostico de
 * framework. En vez de crear un worker por tarea (no escala: ejemplo 09),
 * mantiene un pool FIJO de N workers y los reusa para drenar una cola de M
 * tareas (M >> N): cada worker termina su tarea y agarra la siguiente de la
 * cola. La tesis, con numeros: se crean N workers, no M.
 *
 * El pool es un scheduler del lado del consumidor (el worker no sabe que esta
 * en un pool: solo computa). No depende de Angular ni de ningun otro
 * framework: solo de `WorkerLike` y de `setTimeout`/`setInterval` globales.
 */
export interface WorkerPoolTask<TPayload = unknown> {
  id: number;
  payload: TPayload;
}

export interface WorkerPoolOptions<TPayload = unknown> {
  /** Tamano fijo del pool (N). */
  poolSize: number;
  /** Cola de tareas a drenar (M, tipicamente M >> N). */
  tasks: WorkerPoolTask<TPayload>[];
  /** Crea un worker nuevo; se llama exactamente `poolSize` veces por `start()`. */
  workerFactory: () => WorkerLike;
  /** Arma el mensaje que se le manda al worker para una tarea dada. */
  buildMessage: (task: WorkerPoolTask<TPayload>) => unknown;
  /**
   * Cuanto se mantiene una tarea "corriendo" en su slot despues de que el
   * worker respondio, antes de despachar la siguiente. 0 = sin throttle
   * (util en tests). Default 0.
   */
  stepDelayMs?: number;
}

export interface WorkerPoolEvents {
  /** Un slot tomo una tarea de la cola. */
  onDispatch?(slotIndex: number, taskId: number): void;
  /** Un slot termino una tarea (exito o error) y va a buscar la siguiente. */
  onTaskSettled?(slotIndex: number, taskId: number, outcome: 'done' | 'error'): void;
  /** Un slot se quedo sin tareas por asignar. */
  onSlotIdle?(slotIndex: number): void;
  /** La cola se vacio y todos los slots quedaron libres: el pool termino. */
  onFinish?(): void;
}

export class WorkerPool<TPayload = unknown> {
  private workers: WorkerLike[] = [];
  private queue: WorkerPoolTask<TPayload>[] = [];
  private busy: boolean[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private running = false;

  constructor(
    private readonly options: WorkerPoolOptions<TPayload>,
    private readonly events: WorkerPoolEvents = {},
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  /** Arranca el pool: crea N workers UNA vez y drena la cola de M tareas. */
  start(): void {
    if (this.running) {
      return;
    }
    this.reset();
    const n = this.options.poolSize;
    this.queue = [...this.options.tasks];
    this.busy = Array.from({ length: n }, () => false);
    this.running = true;

    const stepDelayMs = this.options.stepDelayMs ?? 0;
    for (let i = 0; i < n; i++) {
      const worker = this.options.workerFactory();
      this.workers.push(worker);
      worker.onmessage = () => this.settle(i, 'done', stepDelayMs);
      // Camino de error: si el worker falla, NO podemos dejar el slot ocupado
      // para siempre (la cola no drenaria y isRunning() nunca volveria a false).
      worker.onerror = () => this.settle(i, 'error', stepDelayMs);

      // Arranque escalonado: cada slot toma su primera tarea un poco despues
      // que el anterior, para que el drenado no salga en bloque.
      const offset = stepDelayMs === 0 ? 0 : Math.round((stepDelayMs / n) * i);
      if (offset === 0) {
        this.dispatch(i);
      } else {
        const t = setTimeout(() => {
          this.timers.delete(t);
          this.dispatch(i);
        }, offset);
        this.timers.add(t);
      }
    }
  }

  /** Frena timers, termina todos los workers y vacia el estado interno. */
  reset(): void {
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers.clear();
    for (const w of this.workers) {
      w.terminate();
    }
    this.workers = [];
    this.queue = [];
    this.busy = [];
    this.running = false;
  }

  private dispatch(slotIndex: number): void {
    const task = this.queue.shift();
    if (task === undefined) {
      this.busy[slotIndex] = false;
      this.events.onSlotIdle?.(slotIndex);
      this.maybeFinish();
      return;
    }
    this.busy[slotIndex] = true;
    this.events.onDispatch?.(slotIndex, task.id);
    this.workers[slotIndex].postMessage(this.options.buildMessage(task));
    this.currentTask(slotIndex, task.id);
  }

  // Guarda la tarea en curso por slot sin exponer un mapa publico: alcanza con
  // un array paralelo, indexado igual que `workers`/`busy`.
  private currentTaskBySlot: (number | undefined)[] = [];
  private currentTask(slotIndex: number, taskId: number): void {
    this.currentTaskBySlot[slotIndex] = taskId;
  }

  private settle(slotIndex: number, outcome: 'done' | 'error', stepDelayMs: number): void {
    const finish = () => {
      const taskId = this.currentTaskBySlot[slotIndex];
      if (taskId !== undefined) {
        this.events.onTaskSettled?.(slotIndex, taskId, outcome);
      }
      this.dispatch(slotIndex);
    };
    if (stepDelayMs === 0) {
      finish();
      return;
    }
    const t = setTimeout(() => {
      this.timers.delete(t);
      finish();
    }, stepDelayMs);
    this.timers.add(t);
  }

  private maybeFinish(): void {
    if (this.queue.length === 0 && this.busy.every((b) => !b)) {
      this.running = false;
      for (const w of this.workers) {
        w.terminate();
      }
      this.workers = [];
      this.events.onFinish?.();
    }
  }
}
