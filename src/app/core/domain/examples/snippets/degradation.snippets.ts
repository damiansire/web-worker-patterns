/**
 * Snippets neutrales del ejemplo 13 (degradación elegante).
 */
export const DEGRADATION_SNIPPETS: Record<string, string> = {
  'feature-detect.ts': `// El MISMO trabajo, dos caminos elegidos por feature-detection.
async function runTask(limit) {
  if (typeof Worker !== 'undefined') {
    try {
      return await runInWorker(limit); // ideal: off-thread, la UI no se traba
    } catch {
      // Worker existe pero falló (CSP, 404, error): caemos al main.
    }
  }
  return countPrimesUpTo(limit); // fallback: en el main (bloquea, pero anda)
}
// El resultado es idéntico por los dos caminos; cambia sólo la UX.`,

  'worker-vs-main.ts': `// Camino ideal: el worker corre en otro hilo.
function runInWorker(limit) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
    w.onmessage = (e) => { w.terminate(); resolve(e.data.count); };
    w.onerror = (e) => {
      e.preventDefault();
      w.terminate();
      reject(new Error(e.message ?? 'el worker falló')); // → runTask cae al main
    };
    w.postMessage({ command: 'compute', limit });
  });
}

// Fallback: la misma función pura, en el main. Funciona en cualquier
// entorno (incluido SSR / runtimes viejos sin Worker).
import { countPrimesUpTo } from './primes.worker.logic';`,
};
