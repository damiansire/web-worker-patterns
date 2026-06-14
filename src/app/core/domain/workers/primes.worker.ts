/// <reference lib="webworker" />
import { countPrimesUpTo } from './primes.worker.logic';

/**
 * Worker de cómputo pesado (ejemplo 04): recibe un límite, cuenta los primos
 * hasta ahí (trabajo pesado) y responde el resultado. Corre en un hilo separado,
 * así que el main queda libre mientras calcula. La demo corre EXACTAMENTE la
 * misma función en el main para mostrar el contraste (allá la UI se congela).
 *
 * Protocolo neutral:
 *   in:  { command: 'compute', limit: number }
 *   out: { type: 'result', count: number, limit: number }
 */
addEventListener('message', ({ data }: MessageEvent) => {
  if (data?.command === 'compute') {
    const limit = Number(data.limit) || 0;
    const count = countPrimesUpTo(limit);
    postMessage({ type: 'result', count, limit });
  }
});
