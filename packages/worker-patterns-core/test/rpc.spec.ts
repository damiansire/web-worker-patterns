import { describe, it, expect } from 'vitest';
import { wrap, expose, releaseRemote, type RpcEndpoint } from '../src/rpc.js';

/**
 * Dos endpoints enlazados que simulan los dos hilos: un postMessage en uno entrega
 * (en un microtask, y CLONADO con structuredClone como haría postMessage real) a
 * los listeners del otro. Sin Web Workers: ejercita el protocolo RPC puro.
 */
function linkedEndpoints(): [RpcEndpoint, RpcEndpoint] {
  const listenersA = new Set<(e: { data: unknown }) => void>();
  const listenersB = new Set<(e: { data: unknown }) => void>();
  const deliver = (targets: Set<(e: { data: unknown }) => void>, message: unknown): void => {
    const data = structuredClone(message);
    queueMicrotask(() => targets.forEach((l) => l({ data })));
  };
  const a: RpcEndpoint = {
    postMessage: (m) => deliver(listenersB, m),
    addEventListener: (_t, l) => listenersA.add(l),
    removeEventListener: (_t, l) => listenersA.delete(l),
  };
  const b: RpcEndpoint = {
    postMessage: (m) => deliver(listenersA, m),
    addEventListener: (_t, l) => listenersB.add(l),
    removeEventListener: (_t, l) => listenersB.delete(l),
  };
  return [a, b];
}

describe('rpc (wrap/expose)', () => {
  it('llama un método remoto por nombre y resuelve con el resultado', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    const api = {
      add: (a: number, b: number) => a + b,
      greet: async (name: string) => `hola ${name}`,
    };
    expose(api, workerEnd);
    const remote = wrap<typeof api>(mainEnd);

    expect(await remote.add(2, 3)).toBe(5);
    expect(await remote.greet('ada')).toBe('hola ada');
  });

  it('re-lanza el error del worker como rechazo en el main (con name y message)', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose(
      {
        boom: () => {
          throw new RangeError('kaboom');
        },
      },
      workerEnd,
    );
    const remote = wrap<{ boom: () => never }>(mainEnd);

    await expect(remote.boom()).rejects.toThrow('kaboom');
    await expect(remote.boom()).rejects.toBeInstanceOf(Error);
    await remote.boom().catch((e: Error) => expect(e.name).toBe('RangeError'));
  });

  it('un método desconocido rechaza en vez de colgarse', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose({ known: () => 1 }, workerEnd);
    const remote = wrap<{ known: () => number; nope: () => number }>(mainEnd);

    await expect(remote.nope()).rejects.toThrow(/desconocido/);
  });

  it('varias llamadas concurrentes no se cruzan (cada id resuelve la suya)', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose({ echo: (n: number) => n }, workerEnd);
    const remote = wrap<{ echo: (n: number) => number }>(mainEnd);

    const results = await Promise.all([remote.echo(1), remote.echo(2), remote.echo(3)]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('releaseRemote corta el listener: llamadas posteriores ya no resuelven', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose({ ping: () => 'pong' }, workerEnd);
    const remote = wrap<{ ping: () => string }>(mainEnd);

    expect(await remote.ping()).toBe('pong');
    (remote[releaseRemote] as () => void)();

    // Ya sin listener: la respuesta nunca se entrega, la Promise queda pendiente.
    let settled = false;
    void remote.ping().then(
      () => (settled = true),
      () => (settled = true),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(settled).toBe(false);
  });
});
