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
