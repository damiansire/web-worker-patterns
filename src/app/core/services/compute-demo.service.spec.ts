import { TestBed } from '@angular/core/testing';
import { Worker as NodeWorker } from 'node:worker_threads';
import { ComputeDemoService } from './compute-demo.service';
import { WorkerExample } from '../domain/examples/example.model';
import { countPrimesUpTo } from '../domain/workers/primes.worker.logic';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  posted: unknown[] = [];
  terminated = false;
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  result(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
  fail(message: string): void {
    this.onerror?.({ message });
  }
}

describe('ComputeDemoService', () => {
  let svc: ComputeDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ComputeDemoService);
    fake = new FakeWorker();
    t = 0;
    svc.clock = () => t;
    example = {
      id: '04-offloading-computation',
      order: 4,
      category: 'optimization',
      i18nKey: 'examples.04-offloading-computation',
      demo: 'offload',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('runMain computes on the main thread and records the result + time', () => {
    t = 100;
    svc.runMain(10);
    // entre el inicio y el set del resultado el reloj no avanza en el test, pero
    // el conteo real (división de prueba) sí corre:
    expect(svc.mainResult()).toMatchObject({ count: 4, limit: 10 });
    expect(svc.phase()).toBe('idle');
  });

  it('runWorker posts the compute command and records the worker result', () => {
    t = 100;
    svc.runWorker(example, 500);
    expect(fake.posted[0]).toEqual({ command: 'compute', limit: 500 });
    expect(svc.phase()).toBe('worker');

    t = 450;
    fake.result({ type: 'result', count: 95, limit: 500 });
    expect(svc.workerResult()).toEqual({ count: 95, ms: 350, limit: 500 });
    expect(svc.phase()).toBe('idle');
    expect(fake.terminated).toBe(true);
  });

  it('un fallo del worker (onerror) libera la fase y registra el error (no queda colgado en "worker")', () => {
    t = 100;
    svc.runWorker(example, 500);
    expect(svc.phase()).toBe('worker');

    fake.fail('boom');

    expect(svc.phase()).toBe('idle');
    expect(svc.error()).toBe('boom');
    expect(fake.terminated).toBe(true);
  });

  it('reset clears both results', () => {
    svc.runMain(10);
    svc.reset();
    expect(svc.mainResult()).toBeNull();
    expect(svc.workerResult()).toBeNull();
    expect(svc.liveMs()).toBe(0);
  });
});

/**
 * Medición REAL (no el reloj inyectado de arriba, sin worker mockeado): la
 * afirmación del ejemplo 04 es "en el main la UI se congela, en un worker
 * sigue fluida". Antes eso era sólo un claim visual; acá queda versionado como
 * un número concreto: contamos ticks de un `setInterval` MIENTRAS corre el
 * mismo cómputo (`countPrimesUpTo`, la función real del worker), primero
 * bloqueando el hilo y después en un hilo de SO real. jsdom no tiene `Worker`
 * del DOM, así que usamos `node:worker_threads` (mismo motivo que
 * `worker-real-concurrency.spec.ts`): lo que hace falta probar es que el
 * event loop del "main" queda libre, y eso es independiente de si el hilo
 * secundario es un `Worker` de DOM o un hilo de `worker_threads`.
 */
describe('ComputeDemoService — medición real: hilo principal bloqueado vs worker libre', () => {
  it('en el main, contar primos BLOQUEA: cero ticks del event loop corren durante el cómputo', () => {
    let ticks = 0;
    const tick = setInterval(() => ticks++, 1);
    try {
      const t0 = performance.now();
      const count = countPrimesUpTo(200000); // mismo cómputo que corre el worker real
      const ms = performance.now() - t0;

      expect(count).toBeGreaterThan(0);
      expect(ms).toBeGreaterThan(0); // tiempo real medido, no inyectado
      // el bloqueo real: ningún timer pudo disparar mientras el main calculaba.
      expect(ticks).toBe(0);
    } finally {
      clearInterval(tick);
    }
  });

  it(
    'en un worker real, el main queda libre: los ticks del event loop siguen ' +
      'corriendo mientras el worker cuenta primos',
    async () => {
      const worker = new NodeWorker(
        `
          const { parentPort } = require('node:worker_threads');
          const countPrimesUpTo = ${countPrimesUpTo.toString()};
          parentPort.on('message', (msg) => {
            parentPort.postMessage(countPrimesUpTo(msg.limit));
          });
        `,
        { eval: true },
      );

      let ticks = 0;
      const tick = setInterval(() => ticks++, 1);
      try {
        const t0 = performance.now();
        const count = await new Promise<number>((resolve, reject) => {
          worker.on('message', (raw) => resolve(raw as number));
          worker.on('error', reject);
          worker.postMessage({ limit: 300000 });
        });
        const ms = performance.now() - t0;

        expect(count).toBeGreaterThan(0);
        expect(ms).toBeGreaterThan(0); // tiempo real medido
        // el main quedó libre: el event loop siguió tickeando MIENTRAS calculaba.
        expect(ticks).toBeGreaterThan(0);
      } finally {
        clearInterval(tick);
        await worker.terminate();
      }
    },
    10000,
  );
});
