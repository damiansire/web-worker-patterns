/// <reference lib="webworker" />

/**
 * Worker canónico del contador (ARQUITECTURA §3.1).
 *
 * Emite un `tick` periódico en un hilo separado. Es la pieza más simple del
 * dominio y la que valida el pipeline worker -> runner -> thread-monitor: un
 * worker emite ticks y el monitor los registra.
 *
 * Protocolo neutral (compartido por todos los themes):
 *   in:  { command: 'start', intervalMs?: number } | { command: 'stop' } | { command: 'reset' }
 *   out: { type: 'tick', tick: number, at: number }
 */

let count = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function stop(): void {
  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }
}

addEventListener('message', ({ data }: MessageEvent) => {
  const command = data?.command as 'start' | 'stop' | 'reset' | undefined;

  switch (command) {
    case 'start': {
      stop();
      const intervalMs = typeof data.intervalMs === 'number' ? data.intervalMs : 1000;
      timer = setInterval(() => {
        count += 1;
        postMessage({ type: 'tick', tick: count, at: performance.now() });
      }, intervalMs);
      break;
    }
    case 'stop':
      stop();
      break;
    case 'reset':
      stop();
      count = 0;
      break;
  }
});
