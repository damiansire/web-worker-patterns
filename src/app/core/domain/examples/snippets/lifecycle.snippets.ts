/**
 * Snippets neutrales del ejemplo 06 (ciclo de vida y terminación).
 */
export const LIFECYCLE_SNIPPETS: Record<string, string> = {
  'lifecycle.worker.ts': `// Tarea larga: avanza por pasos y reporta progreso.
addEventListener('message', ({ data }) => {
  if (data.command !== 'start') return;
  let step = 0;
  const tick = () => {
    step++;
    postMessage({ type: 'progress', step, steps: data.steps });
    if (step >= data.steps) {
      postMessage({ type: 'done', steps: data.steps });
      self.close();              // el worker se cierra a sí mismo
      return;
    }
    setTimeout(tick, 350);
  };
  setTimeout(tick, 350);
});`,

  'en-el-main.ts': `// El main controla el ciclo de vida del worker.
const worker = new Worker(new URL('./lifecycle.worker', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.type === 'progress') render(e.data.step, e.data.steps);
};
worker.postMessage({ command: 'start', steps: 10 });`,

  'terminate.ts': `// Cortar a mitad: terminate() mata el worker AL INSTANTE.
// El setTimeout en curso muere con él y el trabajo pendiente se pierde.
worker.terminate();

// Un worker terminado NO se reusa: para volver a correr,
// hay que crear uno nuevo.
worker = new Worker(new URL('./lifecycle.worker', import.meta.url), { type: 'module' });`,
};
