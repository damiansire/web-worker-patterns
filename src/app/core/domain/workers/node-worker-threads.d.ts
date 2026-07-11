/**
 * Tipado ambiental mínimo de `node:worker_threads`, sólo lo que
 * `worker-real-concurrency.spec.ts` y `compute-demo.service.spec.ts` usan.
 *
 * El repo no trae `@types/node` (no lo necesita para `src/`: los workers reales
 * son `Worker` del DOM). Estos specs SÍ necesitan hilos de SO reales — jsdom no
 * implementa `Worker` del DOM — y usan `node:worker_threads` sólo en tests para
 * probar concurrencia real (no un mock). Sumar `@types/node` completo por esto
 * sería una dependencia nueva para un puñado de tipos; esta declaración ambiental
 * los cubre sin tocar `package.json`.
 */
declare module 'node:worker_threads' {
  export class Worker {
    constructor(script: string, options?: { eval?: boolean; workerData?: unknown });
    postMessage(value: unknown): void;
    on(event: 'message', listener: (value: unknown) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    terminate(): Promise<number>;
  }
}
