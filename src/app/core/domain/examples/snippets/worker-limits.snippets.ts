/**
 * Snippets neutrales del ejemplo 09 (límites del paralelismo).
 */
export const WORKER_LIMITS_SNIPPETS: Record<string, string> = {
  'cuantos-nucleos.ts': `// Cuántos hilos pueden correr de verdad en paralelo:
const cores = navigator.hardwareConcurrency; // p.ej. 8

// Más workers que núcleos no corren "más en paralelo":
// se reparten los mismos núcleos (time-slicing).`,

  'correr-k-workers.ts': `// Corre K copias del mismo trabajo a la vez y mide cuánto
// tarda hasta que terminan TODAS.
async function timeWith(k, limit) {
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: k }, () => new Promise((done) => {
      const w = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
      w.onmessage = () => { w.terminate(); done(); };
      w.postMessage({ command: 'compute', limit });
    })),
  );
  return performance.now() - t0;
}

// k = 1,2,4,8 → tiempo casi igual (caben en los núcleos).
// k = 16 en 8 núcleos → ~2x: ya no hay dónde correrlos en paralelo.`,
};
