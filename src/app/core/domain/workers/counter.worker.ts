/// <reference lib="webworker" />
import { createCounter } from './counter.worker.logic';

/**
 * Worker canónico del contador (ARQUITECTURA §3.1). Cablea la lógica pura
 * (`counter.worker.logic.ts`) a `postMessage`. Valida el pipeline
 * worker -> runner -> thread-monitor: un worker emite ticks en un hilo separado
 * y el monitor los registra.
 *
 * Protocolo neutral:
 *   in:  { command: 'start', intervalMs?: number } | { command: 'stop' } | { command: 'reset' }
 *   out: { type: 'tick', tick: number, at: number }
 */
const counter = createCounter((tick) => postMessage(tick));

addEventListener('message', ({ data }: MessageEvent) => {
  switch (data?.command) {
    case 'start':
      counter.start(typeof data.intervalMs === 'number' ? data.intervalMs : 1000);
      break;
    case 'stop':
      counter.stop();
      break;
    case 'reset':
      counter.reset();
      break;
  }
});
