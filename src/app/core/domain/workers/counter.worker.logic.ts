/**
 * Lógica pura del worker contador, extraída para poder testearla sin levantar un
 * Web Worker real (en jsdom no hay `Worker`). El worker (`counter.worker.ts`)
 * solo cablea esto a `postMessage`. Protocolo neutral compartido por todos los
 * themes (ARQUITECTURA §3.1).
 */

export interface CounterTick {
  type: 'tick';
  tick: number;
  at: number;
}

export interface Counter {
  start(intervalMs?: number): void;
  stop(): void;
  reset(): void;
}

/**
 * Crea un contador que emite un `tick` incremental cada `intervalMs`.
 * @param emit  callback para emitir cada tick (en el worker: `postMessage`).
 * @param now   reloj inyectable (en tests se controla; en runtime `performance.now`).
 */
export function createCounter(
  emit: (tick: CounterTick) => void,
  now: () => number = () => performance.now(),
): Counter {
  let count = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  const stop = (): void => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  return {
    start(intervalMs = 1000): void {
      stop();
      timer = setInterval(() => {
        count += 1;
        emit({ type: 'tick', tick: count, at: now() });
      }, intervalMs);
    },
    stop,
    reset(): void {
      stop();
      count = 0;
    },
  };
}
