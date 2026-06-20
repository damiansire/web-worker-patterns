import { WorkerExample } from './example.model';
import { COUNTER_SNIPPETS } from './snippets/counter.snippets';
import { ECHO_SNIPPETS } from './snippets/echo.snippets';
import { PRIMES_SNIPPETS } from './snippets/primes.snippets';
import { RISKY_SNIPPETS } from './snippets/risky.snippets';
import { LIFECYCLE_SNIPPETS } from './snippets/lifecycle.snippets';
import { TRANSFER_SNIPPETS } from './snippets/transfer.snippets';
import { SHARED_WORKER_SNIPPETS } from './snippets/shared-worker.snippets';
import { WORKER_LIMITS_SNIPPETS } from './snippets/worker-limits.snippets';
import { WORKER_POOL_SNIPPETS } from './snippets/worker-pool.snippets';
import { BACKPRESSURE_SNIPPETS } from './snippets/backpressure.snippets';
import { SHARED_MEMORY_SNIPPETS } from './snippets/shared-memory.snippets';
import { DEGRADATION_SNIPPETS } from './snippets/degradation.snippets';
import { OFFSCREEN_CANVAS_SNIPPETS } from './snippets/offscreen-canvas.snippets';
import { CLONE_COST_SNIPPETS } from './snippets/clone-cost.snippets';
import { COMPOSITOR_SNIPPETS } from './snippets/compositor.snippets';

/**
 * Registry neutral de ejemplos (ARQUITECTURA §3.1).
 *
 * Es metadata pura: ids, orden, categoría, clave i18n y referencia al worker
 * real. No conoce componentes ni themes. Cada theme renderiza estos datos.
 *
 * Es la única fuente de verdad de los ejemplos: cada uno declara su `demo`
 * (qué visualización), su `workerFactory`/`sharedWorkerFactory` y sus
 * `snippets`. El contenido educativo (título, texto, takeaways) vive en i18n y
 * lo resuelve `ExampleContentService` por id.
 */
export const EXAMPLES: WorkerExample[] = [
  {
    id: '01-setinterval-counter',
    order: 1,
    category: 'understanding',
    i18nKey: 'examples.01-setinterval-counter',
    demo: 'thread-block',
    workerFactory: () =>
      new Worker(new URL('../workers/counter.worker', import.meta.url), { type: 'module' }),
    snippets: COUNTER_SNIPPETS,
  },
  {
    id: '02-main-thread',
    order: 2,
    category: 'understanding',
    i18nKey: 'examples.02-main-thread',
    snippets: {},
  },
  {
    id: '03-basic-communication',
    order: 3,
    category: 'communication',
    i18nKey: 'examples.03-basic-communication',
    demo: 'message-exchange',
    workerFactory: () =>
      new Worker(new URL('../workers/echo.worker', import.meta.url), { type: 'module' }),
    snippets: ECHO_SNIPPETS,
  },
  {
    id: '04-offloading-computation',
    order: 4,
    category: 'optimization',
    i18nKey: 'examples.04-offloading-computation',
    demo: 'offload',
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: PRIMES_SNIPPETS,
  },
  {
    id: '05-error-handling',
    order: 5,
    category: 'management',
    i18nKey: 'examples.05-error-handling',
    demo: 'error-handling',
    workerFactory: () =>
      new Worker(new URL('../workers/risky.worker', import.meta.url), { type: 'module' }),
    snippets: RISKY_SNIPPETS,
  },
  {
    id: '06-lifecycle-termination',
    order: 6,
    category: 'management',
    i18nKey: 'examples.06-lifecycle-termination',
    demo: 'lifecycle',
    workerFactory: () =>
      new Worker(new URL('../workers/lifecycle.worker', import.meta.url), { type: 'module' }),
    snippets: LIFECYCLE_SNIPPETS,
  },
  {
    id: '07-transferable-objects',
    order: 7,
    category: 'optimization',
    i18nKey: 'examples.07-transferable-objects',
    demo: 'transferable',
    workerFactory: () =>
      new Worker(new URL('../workers/transfer.worker', import.meta.url), { type: 'module' }),
    snippets: TRANSFER_SNIPPETS,
  },
  {
    id: '08-shared-worker',
    order: 8,
    category: 'communication',
    i18nKey: 'examples.08-shared-worker',
    demo: 'shared-worker',
    sharedWorkerFactory: () =>
      new SharedWorker(new URL('../workers/shared-counter.worker', import.meta.url), {
        type: 'module',
      }),
    snippets: SHARED_WORKER_SNIPPETS,
  },
  {
    id: '09-worker-limits',
    order: 9,
    category: 'management',
    i18nKey: 'examples.09-worker-limits',
    demo: 'worker-limits',
    // Reusa el worker de primos del ejemplo 04: cada tanda corre K copias a la vez.
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: WORKER_LIMITS_SNIPPETS,
  },
  {
    id: '10-worker-pool',
    order: 10,
    category: 'optimization',
    i18nKey: 'examples.10-worker-pool',
    demo: 'worker-pool',
    // Reusa el worker de primos: el pool (scheduler) vive en el main.
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: WORKER_POOL_SNIPPETS,
  },
  {
    id: '11-backpressure-scheduling',
    order: 11,
    category: 'advanced',
    i18nKey: 'examples.11-backpressure-scheduling',
    demo: 'backpressure',
    // Reusa el worker de primos como consumidor que procesa de a uno.
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: BACKPRESSURE_SNIPPETS,
  },
  {
    id: '12-shared-array-buffer',
    order: 12,
    category: 'advanced',
    i18nKey: 'examples.12-shared-array-buffer',
    demo: 'shared-memory',
    workerFactory: () =>
      new Worker(new URL('../workers/atomics-counter.worker', import.meta.url), { type: 'module' }),
    snippets: SHARED_MEMORY_SNIPPETS,
  },
  {
    id: '13-graceful-degradation',
    order: 13,
    category: 'advanced',
    i18nKey: 'examples.13-graceful-degradation',
    demo: 'degradation',
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: DEGRADATION_SNIPPETS,
  },
  {
    id: '14-offscreen-canvas',
    order: 14,
    category: 'optimization',
    i18nKey: 'examples.14-offscreen-canvas',
    demo: 'offscreen-canvas',
    workerFactory: () =>
      new Worker(new URL('../workers/offscreen-canvas.worker', import.meta.url), {
        type: 'module',
      }),
    snippets: OFFSCREEN_CANVAS_SNIPPETS,
  },
  {
    id: '15-clone-cost',
    order: 15,
    category: 'optimization',
    i18nKey: 'examples.15-clone-cost',
    demo: 'clone-cost',
    workerFactory: () =>
      new Worker(new URL('../workers/clone-cost.worker', import.meta.url), { type: 'module' }),
    snippets: CLONE_COST_SNIPPETS,
  },
  {
    id: '16-compositor-vs-main',
    order: 16,
    category: 'understanding',
    i18nKey: 'examples.16-compositor-vs-main',
    demo: 'compositor-jank',
    // Reusa el worker de primos (ej. 04): el mismo cómputo pesado, pero en otro hilo.
    workerFactory: () =>
      new Worker(new URL('../workers/primes.worker', import.meta.url), { type: 'module' }),
    snippets: COMPOSITOR_SNIPPETS,
  },
];

/** Acceso por id. */
export function findExample(id: string): WorkerExample | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
