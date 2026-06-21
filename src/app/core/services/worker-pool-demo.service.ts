import { Injectable, computed, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';

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
 * El pool es un scheduler del lado del main (el worker no sabe que está en un
 * pool: sólo computa). Estado en signals root para que sobreviva el cambio de
 * theme — incluso a media cola.
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

  private workers: WorkerLike[] = [];
  private queue: number[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();

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
    this.queue = this.tasks().map((t) => t.id);
    this.running.set(true);

    for (let i = 0; i < n; i++) {
      const worker = example.workerFactory!() as unknown as WorkerLike;
      this.workers.push(worker);
      worker.onmessage = () => this.onSlotDone(i, limit);
      // Camino de error: si el worker falla, NO podemos dejar el slot ocupado para
      // siempre (la cola no drenaría y running() quedaría en true). Liberamos el slot
      // y seguimos despachando para que el scheduler no se cuelgue por un worker roto.
      worker.onerror = () => this.onSlotError(i, limit);
      // Arranque escalonado: cada slot toma su primera tarea un poco después que
      // el anterior, para que el drenado se vea en diagonal y no en bloque.
      const offset = Math.round((this.stepDelayMs / n) * i);
      if (offset === 0) {
        this.dispatch(i, limit);
      } else {
        const t = setTimeout(() => {
          this.timers.delete(t);
          this.dispatch(i, limit);
        }, offset);
        this.timers.add(t);
      }
    }
  }

  /** Asigna la próxima tarea de la cola al slot, o lo deja libre si no hay más. */
  private dispatch(slotIdx: number, limit: number): void {
    const taskId = this.queue.shift();
    if (taskId === undefined) {
      this.slots.update((s) =>
        s.map((sl, i) => (i === slotIdx ? { ...sl, busy: false, taskId: undefined } : sl)),
      );
      this.maybeFinish();
      return;
    }
    this.slots.update((s) =>
      s.map((sl, i) => (i === slotIdx ? { ...sl, busy: true, taskId } : sl)),
    );
    this.tasks.update((ts) =>
      ts.map((t) => (t.id === taskId ? { ...t, state: 'running' as const, slot: slotIdx + 1 } : t)),
    );
    this.workers[slotIdx].postMessage({ command: 'compute', limit });
  }

  private onSlotDone(slotIdx: number, limit: number): void {
    // El cómputo del worker ya terminó (es rápido), pero MANTENEMOS la tarea
    // visible "corriendo" en el slot durante stepDelayMs antes de marcarla hecha
    // y agarrar la próxima. Así el slot se ve ocupado con su Tn y el drenado se
    // percibe (sin esto, el slot parpadea a 'libre' y no se ve el reuso).
    const t = setTimeout(() => {
      this.timers.delete(t);
      const taskId = this.slots()[slotIdx]?.taskId;
      if (taskId != null) {
        this.tasks.update((ts) =>
          ts.map((task) => (task.id === taskId ? { ...task, state: 'done' as const } : task)),
        );
      }
      this.slots.update((s) =>
        s.map((sl, i) => (i === slotIdx ? { ...sl, processed: sl.processed + 1 } : sl)),
      );
      this.dispatch(slotIdx, limit);
    }, this.stepDelayMs);
    this.timers.add(t);
  }

  /**
   * Un worker del slot falló (onerror). Marca su tarea como hecha (para que la cola
   * avance y el contador no se trabe), suma el procesado y despacha la próxima. Sin
   * esto, el slot quedaría busy para siempre y running() nunca volvería a false.
   */
  private onSlotError(slotIdx: number, limit: number): void {
    const taskId = this.slots()[slotIdx]?.taskId;
    if (taskId != null) {
      this.tasks.update((ts) =>
        ts.map((task) => (task.id === taskId ? { ...task, state: 'done' as const } : task)),
      );
    }
    this.slots.update((s) =>
      s.map((sl, i) => (i === slotIdx ? { ...sl, processed: sl.processed + 1 } : sl)),
    );
    this.dispatch(slotIdx, limit);
  }

  private maybeFinish(): void {
    if (this.queue.length === 0 && this.slots().every((s) => !s.busy)) {
      this.running.set(false);
      for (const w of this.workers) {
        w.terminate();
      }
      this.workers = [];
    }
  }

  reset(): void {
    this.teardown();
    this.tasks.set([]);
    this.slots.set([]);
    this.running.set(false);
  }

  private teardown(): void {
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers.clear();
    for (const w of this.workers) {
      w.terminate();
    }
    this.workers = [];
    this.queue = [];
  }
}
