/**
 * Snippets neutrales del ejemplo 01 (contador). Son los tabs de código que cada
 * theme muestra en su code-block. Strings planos para no acoplar el dominio a la UI.
 */
export const COUNTER_SNIPPETS: Record<string, string> = {
  'counter.worker.ts': `// Corre en un hilo separado. Emite un tick por intervalo.
const counter = createCounter((tick) => postMessage(tick));

addEventListener('message', ({ data }) => {
  if (data.command === 'start') counter.start(data.intervalMs ?? 1000);
  if (data.command === 'stop') counter.stop();
});`,

  'counter.worker.logic.ts': `export function createCounter(emit, now = () => performance.now()) {
  let count = 0, timer;
  return {
    start(intervalMs = 1000) {
      this.stop();
      timer = setInterval(() => {
        count += 1;
        emit({ type: 'tick', tick: count, at: now() });
      }, intervalMs);
    },
    stop() { clearInterval(timer); timer = undefined; },
    reset() { this.stop(); count = 0; },
  };
}`,

  'runner.usage.ts': `// El ExampleRunnerService crea el worker, publica cada tick y lo termina en el tope.
const ticks = 5;
const worker = new Worker(new URL('./counter.worker', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.type !== 'tick') return;
  workerTicks.set(e.data.tick);             // signal que pinta la UI
  if (e.data.tick >= ticks) {
    worker.postMessage({ command: 'stop' });
    worker.terminate();                     // sin terminate() el hilo queda vivo
  }
};
worker.postMessage({ command: 'start', intervalMs: 500 });`,
};
