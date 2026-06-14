/**
 * Snippets neutrales del ejemplo 04 (offloading de cómputo pesado).
 */
export const PRIMES_SNIPPETS: Record<string, string> = {
  'primes.worker.ts': `// Corre en un hilo separado. Recibe un límite y devuelve el resultado.
addEventListener('message', ({ data }) => {
  if (data.command === 'compute') {
    const count = countPrimesUpTo(data.limit); // trabajo PESADO
    postMessage({ type: 'result', count, limit: data.limit });
  }
});`,

  'en-un-worker.ts': `// En un worker: el main queda libre. La UI sigue respondiendo
// mientras el cálculo corre en otro hilo.
const worker = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
worker.onmessage = (e) => render(e.data.count);   // ← resultado, sin bloquear
worker.postMessage({ command: 'compute', limit: 500000 });`,

  'en-el-main.ts': `// En el main: el MISMO cálculo bloquea el hilo. La página entera se
// congela —no repinta, no responde clicks— hasta que termina.
const count = countPrimesUpTo(500000); // ← la UI se congela acá
render(count);`,
};
