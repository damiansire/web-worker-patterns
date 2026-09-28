import { describe, it, expect, vi } from 'vitest';
import { wrap, expose, releaseRemote, type RpcEndpoint } from '../src/rpc.js';

type Listener = (e: { data?: unknown }) => void;

/** Un extremo de prueba: ademas del contrato, deja emitir `error`/`messageerror`. */
interface TestEndpoint extends RpcEndpoint {
  emit(type: 'message' | 'error' | 'messageerror', event: { data?: unknown }): void;
  posted: unknown[];
}

function endpoint(send: (message: unknown) => void): TestEndpoint {
  const listeners = new Map<string, Set<Listener>>();
  const of = (type: string): Set<Listener> => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    return listeners.get(type)!;
  };
  const self: TestEndpoint = {
    posted: [],
    postMessage: (m) => {
      self.posted.push(m);
      send(m);
    },
    addEventListener: (t, l) => of(t).add(l),
    removeEventListener: (t, l) => of(t).delete(l),
    emit: (t, e) => of(t).forEach((l) => l(e)),
  };
  return self;
}

/**
 * Dos endpoints enlazados que simulan los dos hilos: un postMessage en uno entrega
 * (en un microtask, y CLONADO con structuredClone como haría postMessage real) a
 * los listeners del otro. Sin Web Workers: ejercita el protocolo RPC puro.
 */
function linkedEndpoints(): [TestEndpoint, TestEndpoint] {
  const deliver = (target: TestEndpoint, message: unknown): void => {
    const data = structuredClone(message);
    queueMicrotask(() => target.emit('message', { data }));
  };
  const a: TestEndpoint = endpoint((m) => deliver(b, m));
  const b: TestEndpoint = endpoint((m) => deliver(a, m));
  return [a, b];
}

/** Estado de una promesa despues de dejar correr la cola de tareas. */
async function stateOf(p: Promise<unknown>): Promise<'pending' | 'fulfilled' | 'rejected'> {
  let state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  p.then(
    () => (state = 'fulfilled'),
    () => (state = 'rejected'),
  );
  await new Promise((r) => setTimeout(r, 20));
  return state;
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

  // M1: antes este test afirmaba que la promesa quedaba colgada para siempre.
  it('releaseRemote rechaza lo pendiente y las llamadas posteriores, sin colgarse', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose({ ping: () => 'pong' }, workerEnd);
    const remote = wrap<{ ping: () => string }>(mainEnd);

    expect(await remote.ping()).toBe('pong');
    const inFlight = remote.ping();
    remote[releaseRemote]();

    await expect(inFlight).rejects.toThrow(/releaseRemote/);
    await expect(remote.ping()).rejects.toThrow(/releaseRemote/);
  });

  // M1: el worker murio (script que no carga, excepcion no atrapada) con una
  // llamada en vuelo. Nadie va a responder: la promesa tiene que rechazar.
  it.each(['error', 'messageerror'] as const)(
    'un evento %s del endpoint rechaza las llamadas pendientes',
    async (type) => {
      const mainEnd = endpoint(() => {}); // del otro lado no responde nadie
      const remote = wrap<{ add: (a: number, b: number) => number }>(mainEnd);

      const p = remote.add(1, 2);
      mainEnd.emit(type, {});

      expect(await stateOf(p)).toBe('rejected');
      await expect(p).rejects.toThrow(new RegExp(type));
    },
  );

  // A3
  it('dos wrap sobre el mismo endpoint no se roban las respuestas', async () => {
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose({ add: (a: number, b: number) => a + b }, workerEnd);
    const a = wrap<{ add: (a: number, b: number) => number }>(mainEnd);
    const b = wrap<{ add: (a: number, b: number) => number }>(mainEnd);

    expect(await Promise.all([a.add(1, 1), b.add(10, 10)])).toEqual([2, 20]);
  });

  // A3: dos expose respondian las dos cada llamada, en silencio.
  it('un segundo expose sobre el mismo endpoint tira un error claro', () => {
    const [, workerEnd] = linkedEndpoints();
    const unexpose = expose({ a: () => 1 }, workerEnd);

    expect(() => expose({ b: () => 2 }, workerEnd)).toThrow(/ya tiene un expose/);

    // Despues de desengancharlo, el endpoint vuelve a estar libre.
    unexpose();
    expect(() => expose({ b: () => 2 }, workerEnd)).not.toThrow();
  });

  // M6 (runtime): los metodos de una clase viven en el prototipo y usan `this`.
  it('expone una instancia de class con sus metodos y su `this`', async () => {
    class Contador {
      #total = 0;
      sumar(n: number): number {
        this.#total += n;
        return this.#total;
      }
    }
    const [mainEnd, workerEnd] = linkedEndpoints();
    expose(new Contador(), workerEnd);
    const remote = wrap<Contador>(mainEnd);

    expect(await remote.sumar(2)).toBe(2);
    expect(await remote.sumar(3)).toBe(5);
  });

  // B2: un argumento no clonable hace tirar a postMessage (DataCloneError).
  it('si postMessage tira, la llamada rechaza y no queda registrada como pendiente', async () => {
    const [mainEnd] = linkedEndpoints();
    const remote = wrap<{ fn: (cb: () => number) => number }>(mainEnd);

    // `pending` es interno: se observa por el `delete` del Map durante la llamada.
    // (mockRestore borra el historial, por eso se cuenta antes de restaurar).
    const deleted = vi.spyOn(Map.prototype, 'delete');
    let p: Promise<number>;
    let deleteCalls: number;
    try {
      p = remote.fn(() => 1);
      deleteCalls = deleted.mock.calls.length;
    } finally {
      deleted.mockRestore();
    }
    await expect(p).rejects.toThrow(/could not be cloned/);
    // La entrada se borro al fallar el envio (antes quedaba huerfana en `pending`).
    expect(deleteCalls).toBe(1);
  });

  // B3: JSON.stringify y los duck-typing checks no pueden disparar RPCs.
  it('el proxy no responde a then, toJSON, simbolos ni nombres de duck-typing', () => {
    const mainEnd = endpoint(() => {});
    const remote = wrap<{ add: (a: number, b: number) => number }>(mainEnd) as unknown as Record<
      string | symbol,
      unknown
    >;

    for (const prop of ['then', 'toJSON', 'subscribe', 'asymmetricMatch', 'nodeType', '$$typeof']) {
      expect(remote[prop], prop).toBeUndefined();
    }
    expect(remote[Symbol.iterator]).toBeUndefined();
    expect(JSON.stringify(remote)).toBe('{}');
    expect(mainEnd.posted).toEqual([]);
  });
});
