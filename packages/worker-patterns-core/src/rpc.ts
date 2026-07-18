/**
 * Mini-RPC tipado sobre `postMessage` (patrón comlink, destilado en la skill
 * off-main-thread). En vez de un `switch (msg.type)` a mano, `wrap<T>()` devuelve
 * un Proxy donde llamar al worker SE SIENTE local:
 *
 *   // worker
 *   expose({ add: (a, b) => a + b }, self);
 *   // main
 *   const api = wrap<{ add(a: number, b: number): number }>(worker);
 *   await api.add(2, 3); // 5, vía un solo postMessage
 *
 * Alcance (honesto): cubre el caso más común y enseñable — un objeto de MÉTODOS
 * (sync o async) llamados por nombre, con el resultado resuelto como Promise y los
 * errores del worker re-lanzados como rechazo en el llamador. NO cubre lo que la
 * comlink completa sí: proxiar objetos vivos/callbacks por un MessagePort dedicado,
 * transfer handlers custom, ni acumulación de paths anidados. Para eso, comlink.
 * Framework-agnostic: sólo depende del contrato `RpcEndpoint`.
 */

/** Los dos extremos (el `Worker` en el main, `self` en el worker) exponen esto. */
export interface RpcEndpoint {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

/** Un objeto de sólo métodos (posiblemente async): lo que se expone y se llama. */
export type MethodMap = Record<string, (...args: never[]) => unknown>;

/** La cara remota de una API: cada método devuelve una Promise del resultado. */
export type Remote<T extends MethodMap> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>;
};

/** `remote[releaseRemote]()` deja de escuchar respuestas (hygiene: sin leak de listener). */
export const releaseRemote = Symbol('releaseRemote');

interface CallMsg {
  __wprpc: 'call';
  id: number;
  method: string;
  args: unknown[];
}
interface ReturnMsg {
  __wprpc: 'return';
  id: number;
  ok: boolean;
  value?: unknown;
  error?: { name: string; message: string; stack?: string };
}

function isReturn(data: unknown): data is ReturnMsg {
  return !!data && (data as ReturnMsg).__wprpc === 'return';
}
function isCall(data: unknown): data is CallMsg {
  return !!data && (data as CallMsg).__wprpc === 'call';
}

/**
 * Del lado del worker: escucha llamadas RPC, resuelve el método contra `api`, lo
 * ejecuta (await si es async) y responde con el resultado o con el error
 * serializado (para que re-lance como rechazo en el llamador). Devuelve una
 * función para dejar de escuchar.
 */
export function expose(api: MethodMap, endpoint: RpcEndpoint): () => void {
  const listener = (event: { data: unknown }): void => {
    const msg = event.data;
    if (!isCall(msg)) {
      return;
    }
    const reply = (extra: Partial<ReturnMsg>): void =>
      endpoint.postMessage({ __wprpc: 'return', id: msg.id, ...extra });
    void (async () => {
      try {
        const fn = api[msg.method];
        if (typeof fn !== 'function') {
          throw new TypeError(`RPC: método desconocido "${msg.method}"`);
        }
        const value = await (fn as (...a: unknown[]) => unknown)(...msg.args);
        reply({ ok: true, value });
      } catch (err) {
        const e = err as Partial<Error>;
        reply({
          ok: false,
          error: { name: e?.name ?? 'Error', message: e?.message ?? String(err), stack: e?.stack },
        });
      }
    })();
  };
  endpoint.addEventListener('message', listener);
  return () => endpoint.removeEventListener('message', listener);
}

/**
 * Del lado del main: devuelve un Proxy tipado. Cada llamada a un método manda UN
 * `postMessage({ method, args })` y devuelve una Promise que resuelve con la
 * respuesta (o rechaza con el error re-lanzado del worker). `remote[releaseRemote]()`
 * corta el listener.
 */
export function wrap<T extends MethodMap>(endpoint: RpcEndpoint): Remote<T> {
  let nextId = 0;
  const pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: unknown) => void }
  >();

  const listener = (event: { data: unknown }): void => {
    const msg = event.data;
    if (!isReturn(msg)) {
      return;
    }
    const slot = pending.get(msg.id);
    if (!slot) {
      return;
    }
    pending.delete(msg.id);
    if (msg.ok) {
      slot.resolve(msg.value);
    } else {
      const error = new Error(msg.error?.message ?? 'Error desconocido en el worker');
      error.name = msg.error?.name ?? 'Error';
      if (msg.error?.stack) {
        error.stack = msg.error.stack;
      }
      slot.reject(error);
    }
  };
  endpoint.addEventListener('message', listener);
  const release = (): void => endpoint.removeEventListener('message', listener);

  return new Proxy({} as Remote<T>, {
    get(_target, prop) {
      if (prop === releaseRemote) {
        return release;
      }
      // `then` DEBE ser undefined: si no, `await remote` trataría al Proxy como
      // thenable y llamaría un método "then" inexistente, colgándose.
      if (typeof prop !== 'string' || prop === 'then') {
        return undefined;
      }
      return (...args: unknown[]) =>
        new Promise((resolve, reject) => {
          const id = nextId++;
          pending.set(id, { resolve, reject });
          endpoint.postMessage({ __wprpc: 'call', id, method: prop, args });
        });
    },
  });
}
