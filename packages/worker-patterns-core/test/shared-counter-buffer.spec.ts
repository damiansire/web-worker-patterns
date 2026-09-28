import { describe, it, expect, vi } from 'vitest';
import { SharedCounterBuffer, isSharedMemorySupported } from '../src/shared-counter-buffer.js';
import type { WorkerLike } from '../src/worker-like.js';

describe('isSharedMemorySupported', () => {
  it('es un boolean (depende del entorno: SharedArrayBuffer + crossOriginIsolated)', () => {
    expect(typeof isSharedMemorySupported()).toBe('boolean');
  });
});

describe('SharedCounterBuffer (backend simulado, sin worker real)', () => {
  it('sube hasta el target por polling y dispara onFinish una sola vez', () => {
    vi.useFakeTimers();
    try {
      const buffer = new SharedCounterBuffer();
      const values: number[] = [];
      let finishedAt: number | undefined;
      let finishCalls = 0;

      buffer.start(
        undefined,
        { target: 5, intervalMs: 10, pollIntervalMs: 5 },
        {
          onValue: (v) => values.push(v),
          onFinish: (v) => {
            finishedAt = v;
            finishCalls++;
          },
        },
      );

      vi.advanceTimersByTime(200);

      expect(buffer.value).toBe(5);
      expect(finishedAt).toBe(5);
      expect(finishCalls).toBe(1); // no se re-dispara despues de terminar
      expect(Math.max(...values)).toBe(5);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stop() frena el conteo antes de llegar al target', () => {
    vi.useFakeTimers();
    try {
      const buffer = new SharedCounterBuffer();
      buffer.start(undefined, { target: 100, intervalMs: 10, pollIntervalMs: 5 });
      vi.advanceTimersByTime(50);
      const v = buffer.value;
      expect(v).toBeGreaterThan(0);
      buffer.stop();
      vi.advanceTimersByTime(200);
      expect(buffer.value).toBe(0); // stop() limpia la vista
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('SharedCounterBuffer (con worker real, camino no-simulado)', () => {
  class FakeWorker implements WorkerLike {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    terminated = false;
    lastMessage?: unknown;
    postMessage(message: unknown): void {
      this.lastMessage = message;
    }
    terminate(): void {
      this.terminated = true;
    }
  }

  it('cuando hay soporte real, arranca el worker con el SharedArrayBuffer', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    try {
      expect(isSharedMemorySupported()).toBe(true);
      const worker = new FakeWorker();
      const buffer = new SharedCounterBuffer();
      buffer.start(() => worker, { target: 3, intervalMs: 10 });

      const msg = worker.lastMessage as { command: string; sab: SharedArrayBuffer; target: number };
      expect(msg.command).toBe('start');
      expect(msg.sab).toBeInstanceOf(SharedArrayBuffer);
      expect(msg.target).toBe(3);
      buffer.stop();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // Worker fake que actúa como productor REAL: al recibir el SAB, incrementa ESA
  // memoria con Atomics.add en cada intervalo (lo que haría el worker de verdad).
  class ProducerWorker implements WorkerLike {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    terminated = false;
    private timer?: ReturnType<typeof setInterval>;
    postMessage(message: unknown): void {
      if (this.terminated) {
        return; // un worker terminado descarta los mensajes, como el real
      }
      const { sab, intervalMs } = message as { sab: SharedArrayBuffer; intervalMs: number };
      const view = new Int32Array(sab);
      this.timer = setInterval(() => {
        Atomics.add(view, 0, 1);
      }, intervalMs);
    }
    terminate(): void {
      this.terminated = true;
      if (this.timer !== undefined) {
        clearInterval(this.timer);
      }
    }
  }

  it('e2e: el worker incrementa el MISMO SAB vía Atomics y el lector lo ve subir hasta el target', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    vi.useFakeTimers();
    try {
      const worker = new ProducerWorker();
      const buffer = new SharedCounterBuffer();
      const values: number[] = [];
      let finishedAt: number | undefined;

      buffer.start(
        () => worker,
        { target: 5, intervalMs: 10, pollIntervalMs: 5 },
        {
          onValue: (v) => values.push(v),
          onFinish: (v) => {
            finishedAt = v;
          },
        },
      );

      vi.advanceTimersByTime(200);

      // El lector leyó (Atomics.load) de la MISMA memoria que el worker escribió,
      // sin un solo postMessage de vuelta: esa es la tesis del ejemplo 12.
      expect(finishedAt).toBe(5);
      expect(Math.max(...values)).toBe(5);
      expect(worker.terminated).toBe(true); // al llegar al target se termina el worker
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  // M8: antes `start` reusaba el worker que `stop` acababa de terminar y el
  // contador quedaba en 0 para siempre.
  it('reiniciar crea un worker nuevo por arranque, termina el anterior y vuelve a contar', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    vi.useFakeTimers();
    try {
      const created: ProducerWorker[] = [];
      const factory = (): ProducerWorker => {
        const w = new ProducerWorker();
        created.push(w);
        return w;
      };
      const buffer = new SharedCounterBuffer();
      const finishes: number[] = [];

      buffer.start(factory, { target: 5, intervalMs: 10, pollIntervalMs: 5 });
      vi.advanceTimersByTime(20);
      buffer.start(
        factory,
        { target: 5, intervalMs: 10, pollIntervalMs: 5 },
        { onFinish: (v) => finishes.push(v) },
      );
      vi.advanceTimersByTime(200);
      // Y otra vez despues de terminar.
      buffer.start(
        factory,
        { target: 5, intervalMs: 10, pollIntervalMs: 5 },
        { onFinish: (v) => finishes.push(v) },
      );
      vi.advanceTimersByTime(200);

      expect(finishes).toEqual([5, 5]);
      expect(created).toHaveLength(3);
      expect(created.every((w) => w.terminated)).toBe(true);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('si el worker productor falla, corta el poll y avisa por onError una vez', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      const buffer = new SharedCounterBuffer();
      const values: number[] = [];
      const errors: unknown[] = [];
      let finished = false;

      buffer.start(
        () => worker,
        { target: 5, intervalMs: 10, pollIntervalMs: 5 },
        {
          onValue: (v) => values.push(v),
          onFinish: () => (finished = true),
          onError: (e) => errors.push(e),
        },
      );
      vi.advanceTimersByTime(10);
      const boom = new Error('el script del worker no cargo');
      worker.onerror?.(boom);
      const valuesAtError = values.length;
      vi.advanceTimersByTime(200);

      expect(errors).toEqual([boom]);
      expect(values).toHaveLength(valuesAtError); // el poll se corto
      expect(finished).toBe(false);
      expect(worker.terminated).toBe(true);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('sin soporte real no llama a la factory (no queda ningun worker huerfano)', () => {
    vi.useFakeTimers();
    try {
      let created = 0;
      const buffer = new SharedCounterBuffer();
      buffer.start(
        () => {
          created++;
          return new FakeWorker();
        },
        { target: 2, intervalMs: 10, pollIntervalMs: 5 },
      );
      vi.advanceTimersByTime(100);
      expect(isSharedMemorySupported()).toBe(false);
      expect(created).toBe(0);
      expect(buffer.value).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
