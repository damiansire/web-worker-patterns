# @worker-patterns/core

Motor **agnostico de framework** de dos patrones de Web Workers, extraidos de
[web-worker-patterns](../../README.md) (ejemplos 10 y 12): un pool de workers
reusable y un wrapper de `SharedArrayBuffer` + `Atomics` con fallback simulado.
Cero dependencias de Angular (ni de ningun otro framework): solo TypeScript
estandar, `WorkerLike` (el contrato minimo de un Worker) y timers globales.

Se distribuye como paquete npm (`@worker-patterns/core`, `access: public`) y
ademas vive como paquete de workspace que la app Angular de este repo consume.

## Instalacion

```bash
npm install @worker-patterns/core
```

ESM puro (`"type": "module"`), tipos incluidos, sin dependencias de runtime.

## Por que existe

La app educativa (`web-worker-patterns`) es una demo Angular, no una libreria
publicable. Pero la logica real de los ejemplos 10 (pool) y 12 (SharedArrayBuffer)
no tiene nada de Angular adentro: vivia mezclada con `signal()`/`Injectable`
en los servicios de la app. Este paquete la extrae para que sirva como
referencia standalone (cualquier stack, no solo Angular) y se testea sola,
sin `TestBed`.

## API publica

### `WorkerPool<TPayload>`

```ts
import { WorkerPool } from '@worker-patterns/core';

const log: string[] = [];
const pool = new WorkerPool<number>(
  {
    poolSize: 4,
    tasks: [{ id: 1, payload: 100000 } /* ... */],
    workerFactory: () => new Worker(new URL('./primes.worker.js', import.meta.url)),
    buildMessage: (task) => ({ command: 'compute', limit: task.payload }),
    // Opcional: si el worker manda progreso, solo el resultado cierra la tarea.
    isTaskDone: (data) => (data as { type?: string }).type === 'result',
    stepDelayMs: 0,
  },
  {
    onDispatch: (slot, taskId) => log.push(`slot ${slot} toma T${taskId}`),
    // outcome: 'done' | 'error'; data: el event.data del resultado, o el error
    onTaskSettled: (slot, taskId, outcome, data) =>
      log.push(`T${taskId} ${outcome} en slot ${slot}: ${JSON.stringify(data)}`),
    onSlotIdle: (slot) => log.push(`slot ${slot} libre`),
    onFinish: () => log.push('pool terminado'),
  },
);

pool.start(); // hasta N workers, creados UNA vez, drenan M tareas
pool.reset(); // termina todo y limpia el estado: despues no llega ningun callback
pool.isRunning();
```

Mantiene un pool FIJO de `poolSize` workers y los reusa para drenar
`tasks` (tipicamente muchas mas tareas que workers). Contrato en los bordes:

- `poolSize` tiene que ser un entero >= 1: si no, el constructor tira `RangeError`.
- Con `tasks` vacio, `onFinish` se dispara una vez y no se crea ningun worker.
  Los workers se crean al despachar la primera tarea de cada slot, asi que con
  menos tareas que slots se crean menos de `poolSize`.
- Por defecto todo mensaje del worker cierra la tarea en curso. Si el worker
  manda progreso, `isTaskDone(data)` decide cual mensaje es el resultado; los
  demas se ignoran. `onTaskSettled` recibe como cuarto argumento el `event.data`
  que cerro la tarea (o el error, si fallo).
- Un worker que dispara `error` se da por muerto (un error de carga, como una URL
  404, deja al worker descartando todo mensaje posterior): el pool lo termina,
  liquida la tarea en vuelo como `'error'` y crea uno nuevo con `workerFactory`
  para ese slot antes de despachar la siguiente. Con una factory rota, todas las
  tareas terminan en `'error'` y `onFinish` llega una vez: nunca queda colgado.
- Si `buildMessage`, `workerFactory` o `postMessage` tiran (por ejemplo un payload
  no clonable), esa tarea termina en `'error'` y el slot sigue drenando.

### `SharedCounterBuffer`

```ts
import { SharedCounterBuffer, isSharedMemorySupported } from '@worker-patterns/core';

const output = document.createElement('output');
const buffer = new SharedCounterBuffer();
buffer.start(
  // Una factory, no un worker: la clase crea uno nuevo en cada arranque.
  isSharedMemorySupported()
    ? () => new Worker(new URL('./counter.worker.js', import.meta.url), { type: 'module' })
    : undefined,
  { target: 50, intervalMs: 60, pollIntervalMs: 30 },
  {
    onValue: (v) => (output.value = String(v)),
    onFinish: (v) => (output.value = `listo: ${v}`),
    onError: () => (output.value = 'el worker productor fallo'),
  },
);
output.value = String(buffer.value); // valor actual
buffer.stop(); // frena timers y termina el worker
```

Si hay soporte real (`SharedArrayBuffer` + `crossOriginIsolated === true`) y
se pasa una factory, comparte memoria de verdad: crea el worker, que recibe
`{ command: 'start', sab, target, intervalMs }` y la incrementa con
`Atomics.add` (ver `shared-counter.logic.ts`); el lector hace poll con
`Atomics.load`, sin recibir un solo `postMessage`. Sin soporte, cae a un
backend simulado (mismo comportamiento observable, sin memoria compartida
real) para seguir mostrando el concepto, y la factory ni se llama.

Ownership: la clase es duena del worker que crea con la factory. Lo termina al
llegar al target, en `stop()`, si dispara `error` y al volver a llamar
`start()`, que crea uno nuevo (un worker terminado no se puede reusar). Si el
worker productor dispara `error`, el poll se corta y llega `onError` en vez de
`onFinish`.

### `incrementShared` / `readShared` / `reachedTarget`

Las funciones puras de Atomics que usa `SharedCounterBuffer` por dentro (y que
el worker productor usa del otro lado). Exportadas sueltas porque son el punto
mas testeable del patron: Atomics sobre un `Int32Array`, sin IO.

### `WorkerLike`

El contrato minimo de Worker que consume todo lo de arriba: `postMessage`,
`terminate`, `onmessage`, `onerror`, `onmessageerror?`. Lo implementa el
`Worker` real del DOM (asignable a `WorkerLike` sin cast bajo `strict`) y
cualquier mock de test.

### `wrap` / `expose` (RPC tipado, patron comlink)

En vez de un `switch (msg.type)` a mano sobre `postMessage`, llamar al worker se
siente local:

```ts
import { wrap, expose, releaseRemote, type RpcEndpoint } from '@worker-patterns/core';

// La API se puede declarar como interface, type literal o class.
interface MathApi {
  add(a: number, b: number): number;
}

// worker.ts
expose<MathApi>({ add: (a, b) => a + b }, self as unknown as RpcEndpoint);

// main.ts
const worker = new Worker(new URL('./math.worker.js', import.meta.url), { type: 'module' });
const api = wrap<MathApi>(worker);
await api.add(2, 3); // 5, via un solo postMessage; los errores del worker re-lanzan aca
api[releaseRemote](); // corta los listeners y rechaza lo que quede pendiente
worker.terminate();
```

`wrap<T>()` devuelve un Proxy tipado: cada método manda un `postMessage` y
resuelve una Promise con la respuesta (o rechaza con el error del worker
re-lanzado). `expose()` resuelve el método contra el objeto real (con el objeto
como `this`, asi funciona una instancia de `class`) y responde.

Contrato en los bordes:

- Una llamada nunca queda colgada por algo que el RPC pueda ver:
  `remote[releaseRemote]()` rechaza todo lo pendiente y toda llamada posterior, y
  un evento `error` o `messageerror` del endpoint rechaza todo lo pendiente. Si
  terminás el worker con `terminate()` no se emite ningun evento: llamá a
  `remote[releaseRemote]()` para rechazar lo que quedaba en vuelo. No hay timeouts.
- Si un argumento no se puede clonar (`DataCloneError`), la llamada rechaza en el
  acto.
- Varios `wrap` sobre el mismo endpoint son independientes: cada uno marca sus
  llamadas con un id de instancia y solo consume sus respuestas.
- Un solo `expose` activo por endpoint: el segundo tira un error. Juntá los
  métodos en una sola API, o llamá antes a la función que devolvió el primero.
- El Proxy no convierte en llamada remota `then`, `toJSON`, los símbolos ni los
  nombres que usan chequeos de duck-typing comunes (`subscribe`,
  `asymmetricMatch`, `nodeType`, `$$typeof`): devuelve `undefined`, asi que
  `await remote` y `JSON.stringify(remote)` no disparan RPCs. Una API remota no
  puede tener métodos con esos nombres.
- `RpcEndpoint.addEventListener`/`removeEventListener` reciben `'message'`,
  `'error'` o `'messageerror'`. Un endpoint propio (no un `Worker`) tiene que
  despachar cada listener solo para su tipo de evento; los que no emite, los
  puede ignorar.
- `MethodMap<T>` es generico (`T extends MethodMap<T>`): una API es un objeto
  cuyas propiedades publicas son todas métodos.

Alcance honesto: cubre APIs de métodos por nombre; NO proxia objetos
vivos/callbacks por MessagePort ni paths anidados (para eso, la comlink completa).

## Build y test

```bash
npm run build --workspace packages/worker-patterns-core      # borra dist/ y compila con tsc
npm test --workspace packages/worker-patterns-core           # vitest
npm run typecheck --workspace packages/worker-patterns-core  # tipos de src, test y ejemplos del README
```

Los bloques de codigo `ts` de este README estan copiados tal cual en
`test/readme-examples/` y los chequea `npm run typecheck` (lo corre
`prepublishOnly`); un test de vitest falla si el README y esas copias divergen.

Se corren automaticamente antes de `npm run build`/`npm test` en la raiz del
repo (hooks `prebuild`/`pretest` del `package.json` raiz), asi la app Angular
siempre consume una version fresca.

## Alcance real (honesto)

- Extraccion de codigo REAL y funcionando, agnostica de framework, con tests
  propios (42 tests, `vitest`, sin `TestBed`, sin DOM), mas un type-check
  de los tests y de los ejemplos de este README.
- La app Angular consume este paquete (workspace `packages/*`, resuelto via
  `node_modules/@worker-patterns/core`) desde `WorkerPoolDemoService` y
  `SharedMemoryDemoService`: la logica de pool/SharedArrayBuffer ya NO vive
  duplicada en la app, esos servicios son un adaptador delgado (`WorkerPool`
  → signals, `SharedCounterBuffer` → signals).
- **Distribucion**: `access: public` + pipeline de Changesets (`.changeset/`,
  `.github/workflows/release.yml`): un push a `main` con un changeset abre el PR
  "Version Packages" y, al mergearlo, publica la version nueva + tag + GitHub
  Release. La primera publicacion (`0.1.0`) queda a criterio del owner del repo
  (requiere cargar el secret `NPM_TOKEN`).
- **Lo que NO cubre todavia**: un solo entry point (`.`), sin subpaths; el
  fallback simulado del `SharedCounterBuffer` es didactico, no un backend de
  produccion.
