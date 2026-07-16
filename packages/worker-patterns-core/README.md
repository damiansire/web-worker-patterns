# @worker-patterns/core

Motor **agnostico de framework** de dos patrones de Web Workers, extraidos de
[web-worker-patterns](../../README.md) (ejemplos 10 y 12): un pool de workers
reusable y un wrapper de `SharedArrayBuffer` + `Atomics` con fallback simulado.
Cero dependencias de Angular (ni de ningun otro framework): solo TypeScript
estandar, `WorkerLike` (el contrato minimo de un Worker) y timers globales.

No se publica a npm (`private: true`): vive como referencia dentro de este
repo y como paquete de workspace que la app Angular consume.

## Por que existe

La app educativa (`web-worker-patterns`) es una demo Angular, no una libreria
publicable. Pero la logica real de los ejemplos 10 (pool) y 12 (SharedArrayBuffer)
no tiene nada de Angular adentro — vivia mezclada con `signal()`/`Injectable`
en los servicios de la app. Este paquete la extrae para que sirva como
referencia standalone (cualquier stack, no solo Angular) y se testea sola,
sin `TestBed`.

## API publica

### `WorkerPool<TPayload>`

```ts
import { WorkerPool } from '@worker-patterns/core';

const pool = new WorkerPool(
  {
    poolSize: 4,
    tasks: [{ id: 1, payload: 100000 }, /* ... */],
    workerFactory: () => new Worker(new URL('./primes.worker.js', import.meta.url)),
    buildMessage: (task) => ({ command: 'compute', limit: task.payload }),
    stepDelayMs: 0,
  },
  {
    onDispatch: (slot, taskId) => {},
    onTaskSettled: (slot, taskId, outcome) => {}, // outcome: 'done' | 'error'
    onSlotIdle: (slot) => {},
    onFinish: () => {},
  },
);

pool.start();  // crea N workers UNA vez, drena M tareas
pool.reset();  // termina todo y limpia el estado
pool.isRunning();
```

Mantiene un pool FIJO de `poolSize` workers y los reusa para drenar
`tasks` (tipicamente muchas mas tareas que workers). Si un worker dispara
`onerror`, el pool libera el slot y sigue drenando: nunca queda colgado.

### `SharedCounterBuffer`

```ts
import { SharedCounterBuffer, isSharedMemorySupported } from '@worker-patterns/core';

const buffer = new SharedCounterBuffer();
buffer.start(
  isSharedMemorySupported() ? myWorker : undefined,
  { target: 50, intervalMs: 60, pollIntervalMs: 30 },
  {
    onValue: (v) => console.log(v),
    onFinish: (v) => console.log('listo', v),
  },
);
buffer.value;   // valor actual
buffer.stop();  // frena timers y termina el worker
```

Si hay soporte real (`SharedArrayBuffer` + `crossOriginIsolated === true`) y
se pasa un worker, comparte memoria de verdad: el worker recibe
`{ command: 'start', sab, target, intervalMs }` y la incrementa con
`Atomics.add` (ver `shared-counter.logic.ts`); el lector hace poll con
`Atomics.load`, sin recibir un solo `postMessage`. Sin soporte, cae a un
backend simulado (mismo comportamiento observable, sin memoria compartida
real) para seguir mostrando el concepto.

### `incrementShared` / `readShared` / `reachedTarget`

Las funciones puras de Atomics que usa `SharedCounterBuffer` por dentro (y que
el worker productor usa del otro lado). Exportadas sueltas porque son el punto
mas testeable del patron: Atomics sobre un `Int32Array`, sin IO.

### `WorkerLike`

El contrato minimo de Worker que consume todo lo de arriba: `postMessage`,
`terminate`, `onmessage`, `onerror`, `onmessageerror?`. Lo implementa el
`Worker` real del DOM y cualquier mock de test.

## Build y test

```bash
npm run build --workspace packages/worker-patterns-core   # tsc -> dist/
npm test --workspace packages/worker-patterns-core        # vitest
```

Se corren automaticamente antes de `npm run build`/`npm test` en la raiz del
repo (hooks `prebuild`/`pretest` del `package.json` raiz), asi la app Angular
siempre consume una version fresca.

## Alcance real (honesto)

- Extraccion de codigo REAL y funcionando, agnostica de framework, con tests
  propios (12 tests, `vitest`, sin `TestBed`, sin DOM).
- La app Angular consume este paquete (workspace `packages/*`, resuelto via
  `node_modules/@worker-patterns/core`) desde `WorkerPoolDemoService` y
  `SharedMemoryDemoService`: la logica de pool/SharedArrayBuffer ya NO vive
  duplicada en la app, esos servicios son un adaptador delgado (`WorkerPool`
  → signals, `SharedCounterBuffer` → signals).
- **Lo que falta** para ser un paquete npm publicable de verdad: no tiene
  `access: public` ni pipeline de Changesets (ver skill `release-npm-changesets`),
  no tiene su propio CI, y `private: true` bloquea `npm publish` a proposito.
  Si en algun momento se decide publicarlo, ese es el siguiente paso — no
  esta hecho aca.
