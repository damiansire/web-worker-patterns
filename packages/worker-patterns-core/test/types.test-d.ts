/**
 * Tests de TIPOS (no corre en vitest: solo lo chequea `npm run typecheck`).
 * Cada bloque fija un contrato que un consumidor escribe tal cual bajo `strict`.
 */
import { WorkerPool } from '../src/worker-pool.js';
import { SharedCounterBuffer } from '../src/shared-counter-buffer.js';
import { wrap, expose, releaseRemote, type RpcEndpoint } from '../src/rpc.js';
import type { WorkerLike } from '../src/worker-like.js';

// A1: un Worker del DOM es un WorkerLike sin cast.
const domWorker: WorkerLike = new Worker(new URL('./x.worker.js', import.meta.url));
void domWorker;

new WorkerPool({
  poolSize: 2,
  tasks: [{ id: 1, payload: 10 }],
  workerFactory: () => new Worker(new URL('./x.worker.js', import.meta.url)),
  buildMessage: (task) => ({ limit: task.payload }),
});

new SharedCounterBuffer().start(
  () => new Worker(new URL('./x.worker.js', import.meta.url)),
  { target: 3 },
);

// M6: APIs declaradas como interface y como instancia de class.
interface CalcApi {
  add(a: number, b: number): number;
  twice(n: number): Promise<number>;
}
const calc = wrap<CalcApi>(new Worker(new URL('./x.worker.js', import.meta.url)));
const sum: Promise<number> = calc.add(1, 2);
const doubled: Promise<number> = calc.twice(2);
void sum;
void doubled;

class Calculadora {
  #base = 10;
  add(a: number, b: number): number {
    return this.#base + a + b;
  }
}
declare const workerSelf: RpcEndpoint;
expose(new Calculadora(), workerSelf);
const remoteCalc = wrap<Calculadora>(workerSelf);
const fromClass: Promise<number> = remoteCalc.add(1, 2);
void fromClass;

// M7: releaseRemote se invoca sin cast.
remoteCalc[releaseRemote]();

// Un objeto con propiedades que no son metodos no es una API RPC.
// @ts-expect-error `count` no es un metodo
wrap<{ count: number }>(workerSelf);
