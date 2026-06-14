import { WorkerExample } from './example.model';
import { COUNTER_SNIPPETS } from './snippets/counter.snippets';
import { ECHO_SNIPPETS } from './snippets/echo.snippets';
import { PRIMES_SNIPPETS } from './snippets/primes.snippets';

/**
 * Registry neutral de ejemplos (ARQUITECTURA §3.1).
 *
 * Es metadata pura: ids, orden, categoría, clave i18n y referencia al worker
 * real. No conoce componentes ni themes. Cada theme renderiza estos datos.
 *
 * Migración progresiva: el `workerFactory` y los `snippets` de cada ejemplo se
 * trasladan a esta capa neutral a medida que los themes los van consumiendo
 * (los componentes mono-theme actuales en `app/examples/` se eliminan cuando un
 * theme los reemplaza). El contador ya vive acá como pieza canónica que valida
 * el pipeline worker -> runner -> monitor.
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
  { id: '02-main-thread', order: 2, category: 'understanding', i18nKey: 'examples.02-main-thread', snippets: {} },
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
  { id: '05-error-handling', order: 5, category: 'management', i18nKey: 'examples.05-error-handling', snippets: {} },
  { id: '06-lifecycle-termination', order: 6, category: 'management', i18nKey: 'examples.06-lifecycle-termination', snippets: {} },
  { id: '07-transferable-objects', order: 7, category: 'optimization', i18nKey: 'examples.07-transferable-objects', snippets: {} },
  { id: '08-shared-worker', order: 8, category: 'communication', i18nKey: 'examples.08-shared-worker', snippets: {} },
  { id: '09-worker-limits', order: 9, category: 'management', i18nKey: 'examples.09-worker-limits', snippets: {} },
  { id: '10-worker-pool', order: 10, category: 'optimization', i18nKey: 'examples.10-worker-pool', snippets: {} },
  { id: '11-backpressure-scheduling', order: 11, category: 'advanced', i18nKey: 'examples.11-backpressure-scheduling', snippets: {} },
  { id: '12-shared-array-buffer', order: 12, category: 'advanced', i18nKey: 'examples.12-shared-array-buffer', snippets: {} },
  { id: '13-graceful-degradation', order: 13, category: 'advanced', i18nKey: 'examples.13-graceful-degradation', snippets: {} },
];

/** Acceso por id. */
export function findExample(id: string): WorkerExample | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
