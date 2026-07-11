import { Worker } from 'node:worker_threads';
import { countPrimesUpTo } from './primes.worker.logic';
import { incrementShared } from './shared-counter.worker.logic';

/**
 * Tests con un Worker REAL, no un mock (gap detectado en la auditoría: los
 * `*-demo.service.spec.ts`, incluido `lifecycle-demo.service.spec.ts`, sólo
 * ejercitan un `FakeWorker` en memoria — necesario para un scheduler
 * determinista, pero incapaz de detectar una condición de carrera real o una
 * violación real de orden de mensajes, porque nunca hay dos hilos de verdad).
 *
 * jsdom (el entorno de estos tests) no implementa el `Worker` del DOM, así que
 * usamos `node:worker_threads`: no es la misma API, pero da hilos de SO reales,
 * que es justo la garantía que hay que probar acá (orden FIFO de mensajes al
 * mismo worker, atomicidad de `Atomics` bajo concurrencia real). Cada worker
 * corre el CÓDIGO DE PRODUCCIÓN tal cual — vía `.toString()` de la función ya
 * importada, no una copia a mano que pueda divergir.
 */

function primesWorkerSource(): string {
  return `
    const { parentPort } = require('node:worker_threads');
    const countPrimesUpTo = ${countPrimesUpTo.toString()};
    parentPort.on('message', (msg) => {
      parentPort.postMessage({ seq: msg.seq, count: countPrimesUpTo(msg.limit) });
    });
  `;
}

function incrementWorkerSource(): string {
  return `
    const { parentPort, workerData } = require('node:worker_threads');
    const incrementShared = ${incrementShared.toString()};
    const view = new Int32Array(workerData.sab);
    for (let i = 0; i < workerData.iterations; i++) {
      incrementShared(view);
    }
    parentPort.postMessage('done');
  `;
}

describe('Worker real (node:worker_threads): FIFO y condición de carrera', () => {
  it(
    'un worker real preserva el orden de ENVÍO de los mensajes (FIFO), aunque el ' +
      'último mensaje sea el más rápido de calcular',
    async () => {
      const worker = new Worker(primesWorkerSource(), { eval: true });
      try {
        // Límites DECRECIENTES: si el worker reordenara por velocidad de cómputo,
        // el mensaje 4 (limit chico, rápido) respondería antes que el 0 (limit
        // grande, lento). Un worker real no reordena: procesa un mensaje a la vez,
        // en el orden en que llegaron a su cola.
        const limits = [60000, 45000, 30000, 15000, 1000];
        const received: number[] = [];

        const done = new Promise<void>((resolve, reject) => {
          worker.on('message', (raw) => {
            const msg = raw as { seq: number; count: number };
            received.push(msg.seq);
            if (received.length === limits.length) resolve();
          });
          worker.on('error', reject);
        });

        limits.forEach((limit, seq) => worker.postMessage({ seq, limit }));
        await done;

        expect(received).toEqual([0, 1, 2, 3, 4]);
      } finally {
        await worker.terminate();
      }
    },
    10000,
  );

  it(
    'varios workers reales incrementando la MISMA memoria compartida en paralelo ' +
      'no pierden ningún incremento (Atomics es atómico bajo hilos de SO reales)',
    async () => {
      const workerCount = 4;
      const iterationsPerWorker = 2000;
      const sab = new SharedArrayBuffer(4);
      const view = new Int32Array(sab);

      const workers = Array.from(
        { length: workerCount },
        () =>
          new Worker(incrementWorkerSource(), {
            eval: true,
            workerData: { sab, iterations: iterationsPerWorker },
          }),
      );

      try {
        await Promise.all(
          workers.map(
            (w) =>
              new Promise<void>((resolve, reject) => {
                w.on('message', () => resolve());
                w.on('error', reject);
              }),
          ),
        );
      } finally {
        await Promise.all(workers.map((w) => w.terminate()));
      }

      // Si `incrementShared` no fuera atómico (p. ej. `view[0]++` en vez de
      // `Atomics.add`), varios hilos de SO reales escribiendo a la vez pierden
      // incrementos por la carrera read-modify-write y este número da MENOS.
      expect(Atomics.load(view, 0)).toBe(workerCount * iterationsPerWorker);
    },
    10000,
  );
});
