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
  /** Tamano fijo del pool (N): entero >= 1, si no el constructor tira `RangeError`. */
  poolSize: number;
  /** Cola de tareas a drenar (M, tipicamente M >> N). */
  tasks: WorkerPoolTask<TPayload>[];
  /**
   * Crea un worker nuevo. Se llama como mucho `poolSize` veces por `start()`
   * (una por slot que llega a tomar una tarea), mas una vez por cada worker
   * que dispara `error` y hay que reemplazar.
   */
  workerFactory: () => WorkerLike;
  /** Arma el mensaje que se le manda al worker para una tarea dada. */
  buildMessage: (task: WorkerPoolTask<TPayload>) => unknown;
  /**
   * Decide si un mensaje del worker cierra la tarea en curso. Sirve para
   * workers que mandan progreso antes del resultado: los mensajes que no
   * cierran la tarea se ignoran. Default: todo mensaje cierra la tarea.
   */
  isTaskDone?: (data: unknown) => boolean;
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
  /**
   * Un slot termino una tarea (exito o error) y va a buscar la siguiente.
   * `data` es el `event.data` del mensaje que cerro la tarea ('done'), o el
   * evento de error / la excepcion que la hizo fallar ('error').
   */
  onTaskSettled?(
    slotIndex: number,
    taskId: number,
    outcome: 'done' | 'error',
    data?: unknown,
  ): void;
  /** Un slot se quedo sin tareas por asignar. */
  onSlotIdle?(slotIndex: number): void;
  /** La cola se vacio y todos los slots quedaron libres: el pool termino. */
  onFinish?(): void;
}

export class WorkerPool<TPayload = unknown> {
  // Un hueco (`undefined`) es un slot sin worker vivo: todavia no tomo tarea, o
  // su worker murio y se reemplaza al despachar la siguiente.
  private workers: (WorkerLike | undefined)[] = [];
  private queue: WorkerPoolTask<TPayload>[] = [];
  private busy: boolean[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private running = false;

  constructor(
    private readonly options: WorkerPoolOptions<TPayload>,
    private readonly events: WorkerPoolEvents = {},
  ) {
    // Con 0 o NaN el pool quedaba "corriendo" sin workers para siempre; con 2.5
    // creaba mas workers que slots. Mejor fallar al construir.
    if (!Number.isInteger(options.poolSize) || options.poolSize < 1) {
      throw new RangeError(
        `WorkerPool: poolSize tiene que ser un entero >= 1 (recibido: ${options.poolSize})`,
      );
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Arranca el pool: hasta N workers, creados UNA vez, drenan la cola de M tareas. */
  start(): void {
    if (this.running) {
      return;
    }
    this.reset();
    this.queue = [...this.options.tasks];
    if (this.queue.length === 0) {
      // Nada que drenar: se termina ya, sin crear ningun worker.
      this.events.onFinish?.();
      return;
    }
    const n = this.options.poolSize;
    this.workers = Array.from({ length: n }, () => undefined);
    // Cada slot cuenta como ocupado hasta su primer despacho: si no, un worker
    // que responde sincronico daria el pool por terminado antes de que los
    // slots escalonados lleguen a arrancar.
    this.busy = Array.from({ length: n }, () => true);
    this.running = true;

    const stepDelayMs = this.options.stepDelayMs ?? 0;
    for (let i = 0; i < n; i++) {
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
    this.discardAllWorkers();
    this.queue = [];
    this.busy = [];
    this.currentTaskBySlot = [];
    this.running = false;
  }

  /** Crea el worker de un slot y engancha sus handlers a ESE slot. */
  private spawnWorker(slotIndex: number): WorkerLike {
    const worker = this.options.workerFactory();
    const isTaskDone = this.options.isTaskDone ?? (() => true);
    worker.onmessage = (event) => {
      if (isTaskDone(event.data)) {
        this.settle(slotIndex, 'done', event.data);
      }
    };
    // Un worker que dispara `error` se da por muerto: si el error fue de carga
    // (URL 404, sintaxis) descarta en silencio todo postMessage posterior, asi
    // que reusarlo colgaria el slot. Se termina y el slot pide uno nuevo.
    worker.onerror = (event) => {
      this.discardWorker(slotIndex);
      this.settle(slotIndex, 'error', event);
    };
    this.workers[slotIndex] = worker;
    return worker;
  }

  // Desengancha los handlers ANTES de terminar: un mensaje que ya estaba en
  // camino no puede disparar callbacks sobre un slot reseteado o reemplazado.
  private discardWorker(slotIndex: number): void {
    const worker = this.workers[slotIndex];
    if (worker === undefined) {
      return;
    }
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    this.workers[slotIndex] = undefined;
  }

  private discardAllWorkers(): void {
    for (let i = 0; i < this.workers.length; i++) {
      this.discardWorker(i);
    }
    this.workers = [];
  }

  private dispatch(slotIndex: number): void {
    if (!this.running) {
      return;
    }
    const task = this.queue.shift();
    if (task === undefined) {
      this.busy[slotIndex] = false;
      this.events.onSlotIdle?.(slotIndex);
      this.maybeFinish();
      return;
    }
    this.busy[slotIndex] = true;
    this.currentTaskBySlot[slotIndex] = task.id;
    this.events.onDispatch?.(slotIndex, task.id);
    try {
      const worker = this.workers[slotIndex] ?? this.spawnWorker(slotIndex);
      worker.postMessage(this.options.buildMessage(task));
    } catch (err) {
      // buildMessage roto, payload no clonable (DataCloneError) o factory que
      // tira: la tarea falla sola y el slot sigue drenando.
      this.settle(slotIndex, 'error', err);
    }
  }

  // Guarda la tarea en curso por slot sin exponer un mapa publico: alcanza con
  // un array paralelo, indexado igual que `workers`/`busy`.
  private currentTaskBySlot: (number | undefined)[] = [];

  private settle(slotIndex: number, outcome: 'done' | 'error', data: unknown): void {
    const taskId = this.currentTaskBySlot[slotIndex];
    if (taskId === undefined) {
      // Mensaje o error sin tarea en vuelo (tardio o duplicado): no hay nada
      // que liquidar, y despachar de nuevo mandaria dos tareas al mismo slot.
      return;
    }
    this.currentTaskBySlot[slotIndex] = undefined;
    const finish = () => {
      this.events.onTaskSettled?.(slotIndex, taskId, outcome, data);
      this.dispatch(slotIndex);
    };
    const stepDelayMs = this.options.stepDelayMs ?? 0;
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
      this.discardAllWorkers();
      this.events.onFinish?.();
    }
  }
}
