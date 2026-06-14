/**
 * Snippets neutrales del ejemplo 10 (pool de workers).
 */
export const WORKER_POOL_SNIPPETS: Record<string, string> = {
  'pool.ts': `// Un pool fijo de N workers que se REUSAN para drenar una cola
// de M tareas (M >> N). El pool vive en el main: el worker sólo computa.
const N = 4;
const queue = [...tasks];                 // M tareas pendientes
const pool = Array.from({ length: N }, () =>
  new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' }),
);

for (const worker of pool) {
  const next = () => {
    const task = queue.shift();
    if (!task) return;                    // cola vacía: el worker queda libre
    worker.onmessage = () => { markDone(task); next(); }; // ← termina y agarra otra
    worker.postMessage({ command: 'compute', limit: task.limit });
  };
  next();
}`,

  'sin-pool.ts': `// El anti-patrón: un worker por tarea. Crea M workers (y el
// ejemplo 09 ya mostró que pasar los núcleos no acelera nada).
for (const task of tasks) {               // ← M workers, uno por tarea
  const w = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
  w.onmessage = () => { markDone(task); w.terminate(); };
  w.postMessage({ command: 'compute', limit: task.limit });
}
// 24 tareas → 24 workers creados. Con pool: 4.`,
};
