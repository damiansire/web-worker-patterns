/**
 * Snippets neutrales del ejemplo 13 (degradación elegante).
 */
export const DEGRADATION_SNIPPETS: Record<string, string> = {
  'feature-detect.ts': `// El MISMO trabajo, dos caminos elegidos por feature-detection.
async function runTask(limit) {
  if (typeof Worker !== 'undefined') {
    return runInWorker(limit);   // ideal: off-thread, la UI no se traba
  }
  return countPrimesUpTo(limit); // fallback: en el main (bloquea, pero anda)
}
// El resultado es idéntico por los dos caminos; cambia sólo la UX.`,

  'worker-vs-main.ts': `// Camino ideal: el worker corre en otro hilo.
function runInWorker(limit) {
  return new Promise((resolve) => {
    const w = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
    w.onmessage = (e) => { w.terminate(); resolve(e.data.count); };
    w.postMessage({ command: 'compute', limit });
  });
}

// Fallback: la misma función pura, en el main. Funciona en cualquier
// entorno (incluido SSR / runtimes viejos sin Worker).
import { countPrimesUpTo } from './primes.worker.logic';`,
};
