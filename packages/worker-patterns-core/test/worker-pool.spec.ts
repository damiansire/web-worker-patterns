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
});
