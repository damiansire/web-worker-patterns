import { describe, it, expect } from 'vitest';
import { WorkerPool, type WorkerPoolTask } from '../src/worker-pool.js';
import type { WorkerLike } from '../src/worker-like.js';

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  postMessage(): void {
    // Responde en un microtask (asincrono, como un worker real), asi el
    // trabajo se reparte entre los slots en vez de drenar uno solo.
    queueMicrotask(() => this.onmessage?.({ data: { type: 'result' } } as MessageEvent));
  }
  terminate(): void {
    this.terminated = true;
  }
}

class FailingWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  postMessage(): void {
    queueMicrotask(() => this.onerror?.(new Error('boom')));
  }
  terminate(): void {
    this.terminated = true;
  }
}

async function waitUntil(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 1000 && !cond(); i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

function makeTasks(count: number): WorkerPoolTask<number>[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, payload: 1000 }));
}

describe('WorkerPool', () => {
  it('crea EXACTAMENTE N workers (no uno por tarea) y drena las M tareas', async () => {
    const created: FakeWorker[] = [];
    let finished = false;
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: makeTasks(24),
        workerFactory: () => {
          const w = new FakeWorker();
          created.push(w);
          return w;
        },
        buildMessage: (task) => ({ command: 'compute', limit: task.payload }),
      },
      { onFinish: () => (finished = true) },
    );

    pool.start();
    await waitUntil(() => finished);

    expect(created).toHaveLength(4);
    expect(created.length).toBeLessThan(24);
    expect(created.every((w) => w.terminated)).toBe(true);
  });

  it('reusa los slots: algun slot procesa mas de una tarea', async () => {
    const settledBySlot = new Map<number, number>();
    let finished = false;
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: makeTasks(24),
        workerFactory: () => new FakeWorker(),
        buildMessage: () => ({ command: 'compute' }),
      },
      {
        onTaskSettled: (slot) => settledBySlot.set(slot, (settledBySlot.get(slot) ?? 0) + 1),
        onFinish: () => (finished = true),
      },
    );

    pool.start();
    await waitUntil(() => finished);

    const total = [...settledBySlot.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(24);
    expect(Math.max(...settledBySlot.values())).toBeGreaterThan(1);
  });

  it('un worker que falla no cuelga el pool: la cola drena igual', async () => {
    let finished = false;
    let errorCount = 0;
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: makeTasks(24),
        workerFactory: () => new FailingWorker(),
        buildMessage: () => ({ command: 'compute' }),
      },
      {
        onTaskSettled: (_slot, _taskId, outcome) => {
          if (outcome === 'error') errorCount++;
        },
        onFinish: () => (finished = true),
      },
    );

    pool.start();
    await waitUntil(() => finished);

    expect(errorCount).toBe(24);
    expect(pool.isRunning()).toBe(false);
  });

  it('reset() termina los workers en curso y limpia el estado', async () => {
    const created: FakeWorker[] = [];
    const pool = new WorkerPool({
      poolSize: 4,
      tasks: makeTasks(24),
      workerFactory: () => {
        const w = new FakeWorker();
        created.push(w);
        return w;
      },
      buildMessage: () => ({ command: 'compute' }),
    });

    pool.start();
    pool.reset();

    expect(pool.isRunning()).toBe(false);
    expect(created.every((w) => w.terminated)).toBe(true);
  });

  // B1: el FakeWorker responde en un microtask que corre DESPUES de reset().
  it('despues de reset() no se dispara ningun callback', async () => {
    const events: string[] = [];
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: makeTasks(24),
        workerFactory: () => new FakeWorker(),
        buildMessage: () => ({ command: 'compute' }),
      },
      {
        onDispatch: () => events.push('dispatch'),
        onTaskSettled: () => events.push('settled'),
        onSlotIdle: () => events.push('idle'),
        onFinish: () => events.push('finish'),
      },
    );

    pool.start();
    pool.reset();
    events.length = 0;
    await new Promise((r) => setTimeout(r, 20));

    expect(events).toEqual([]);
  });

  // A2: un worker que no carga (URL rota) dispara UN error y queda muerto: los
  // postMessage siguientes se descartan en silencio y nunca vuelve nada.
  it('un worker muerto se reemplaza: con una factory rota las M tareas terminan en error', async () => {
    const created: DeadOnLoadWorker[] = [];
    let finishCalls = 0;
    const outcomes: string[] = [];
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: makeTasks(24),
        workerFactory: () => {
          const w = new DeadOnLoadWorker();
          created.push(w);
          return w;
        },
        buildMessage: () => ({ command: 'compute' }),
      },
      {
        onTaskSettled: (_slot, _taskId, outcome) => outcomes.push(outcome),
        onFinish: () => finishCalls++,
      },
    );

    pool.start();
    await waitUntil(() => finishCalls > 0);
    await new Promise((r) => setTimeout(r, 20));

    expect(outcomes).toHaveLength(24);
    expect(outcomes.every((o) => o === 'error')).toBe(true);
    expect(finishCalls).toBe(1);
    expect(pool.isRunning()).toBe(false);
    expect(created.every((w) => w.terminated)).toBe(true);
  });

  // M2: un worker que manda progreso antes del resultado de cada tarea.
  it('isTaskDone: los mensajes de progreso no cierran la tarea y onTaskSettled recibe el dato', async () => {
    const settled: { slot: number; taskId: number; data: unknown }[] = [];
    let finished = false;
    const pool = new WorkerPool<number>(
      {
        poolSize: 2,
        tasks: makeTasks(6),
        workerFactory: () => new ProgressWorker(),
        buildMessage: (task) => ({ taskId: task.id }),
        isTaskDone: (data) => (data as { type: string }).type === 'result',
      },
      {
        onTaskSettled: (slot, taskId, _outcome, data) => settled.push({ slot, taskId, data }),
        onFinish: () => (finished = true),
      },
    );

    pool.start();
    await waitUntil(() => finished);

    expect(settled).toHaveLength(6);
    // Cada tarea se liquida con SU resultado (sin corrimiento de taskId).
    for (const s of settled) {
      expect(s.data).toEqual({ type: 'result', taskId: s.taskId });
    }
  });

  it('sin isTaskDone, onTaskSettled recibe el event.data del mensaje', async () => {
    const data: unknown[] = [];
    let finished = false;
    const pool = new WorkerPool(
      {
        poolSize: 1,
        tasks: makeTasks(2),
        workerFactory: () => new FakeWorker(),
        buildMessage: () => ({ command: 'compute' }),
      },
      {
        onTaskSettled: (_slot, _taskId, _outcome, d) => data.push(d),
        onFinish: () => (finished = true),
      },
    );

    pool.start();
    await waitUntil(() => finished);

    expect(data).toEqual([{ type: 'result' }, { type: 'result' }]);
  });

  // M3
  it.each([0, -1, 2.5, Number.NaN])('poolSize %s tira RangeError con mensaje claro', (poolSize) => {
    expect(
      () =>
        new WorkerPool({
          poolSize,
          tasks: makeTasks(1),
          workerFactory: () => new FakeWorker(),
          buildMessage: () => ({}),
        }),
    ).toThrow(/poolSize/);
    expect(
      () =>
        new WorkerPool({
          poolSize,
          tasks: makeTasks(1),
          workerFactory: () => new FakeWorker(),
          buildMessage: () => ({}),
        }),
    ).toThrow(RangeError);
  });

  // M4
  it('con tasks vacio, onFinish se dispara una vez y no se crea ningun worker', async () => {
    let created = 0;
    let finishCalls = 0;
    const pool = new WorkerPool(
      {
        poolSize: 4,
        tasks: [],
        workerFactory: () => {
          created++;
          return new FakeWorker();
        },
        buildMessage: () => ({}),
      },
      { onFinish: () => finishCalls++ },
    );

    pool.start();
    await new Promise((r) => setTimeout(r, 20));

    expect(finishCalls).toBe(1);
    expect(created).toBe(0);
    expect(pool.isRunning()).toBe(false);
  });

  // M5: payload no clonable (DataCloneError) o buildMessage que tira.
  it('si buildMessage o postMessage tiran, la tarea termina en error y el pool sigue', async () => {
    const outcomes = new Map<number, string>();
    let finished = false;
    const pool = new WorkerPool<number>(
      {
        poolSize: 2,
        tasks: makeTasks(6),
        workerFactory: () => new CloningWorker(),
        buildMessage: (task) => {
          if (task.id === 2) {
            throw new Error('buildMessage roto');
          }
          // La tarea 4 lleva una funcion: postMessage tira DataCloneError.
          return task.id === 4 ? { fn: () => 1 } : { id: task.id };
        },
      },
      {
        onTaskSettled: (_slot, taskId, outcome) => outcomes.set(taskId, outcome),
        onFinish: () => (finished = true),
      },
    );

    expect(() => pool.start()).not.toThrow();
    await waitUntil(() => finished);

    expect(outcomes.size).toBe(6);
    expect(outcomes.get(2)).toBe('error');
    expect(outcomes.get(4)).toBe('error');
    expect([1, 3, 5, 6].every((id) => outcomes.get(id) === 'done')).toBe(true);
    expect(pool.isRunning()).toBe(false);
  });
});

/** Worker cuyo script no cargo: UN error asincrono y despues silencio total. */
class DeadOnLoadWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  constructor() {
    setTimeout(() => this.onerror?.(new Error('404: no se pudo cargar el script')), 0);
  }
  postMessage(): void {
    // Un worker muerto descarta los mensajes: nunca responde.
  }
  terminate(): void {
    this.terminated = true;
  }
}

/** Manda `progress` y despues `result` por cada tarea, como un worker real con avance. */
class ProgressWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  postMessage(message: unknown): void {
    const { taskId } = message as { taskId: number };
    setTimeout(() => this.onmessage?.({ data: { type: 'progress', taskId } } as MessageEvent), 0);
    setTimeout(() => this.onmessage?.({ data: { type: 'result', taskId } } as MessageEvent), 5);
  }
  terminate(): void {}
}

/** Clona el mensaje como un postMessage real: una funcion tira DataCloneError. */
class CloningWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  postMessage(message: unknown): void {
    const data = structuredClone(message);
    queueMicrotask(() => this.onmessage?.({ data } as MessageEvent));
  }
  terminate(): void {}
}
