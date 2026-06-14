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

  'runner.usage.ts': `// El ExampleRunnerService spawnea el worker y vuelca los ticks al monitor.
const worker = example.workerFactory();          // new Worker(new URL('counter.worker', ...))
worker.onmessage = (e) => {
  if (e.data.type === 'tick') {
    this.lastTick.set(e.data.tick);
    this.monitor.push('worker', 'worker');         // el monitor registra la actividad
  }
};
worker.postMessage({ command: 'start', intervalMs: 500 });`,
};
