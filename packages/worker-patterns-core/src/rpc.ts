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
 * Alcance (honesto): cubre el caso más común y enseñable: un objeto de MÉTODOS
 * (sync o async) llamados por nombre, con el resultado resuelto como Promise y los
 * errores del worker re-lanzados como rechazo en el llamador. NO cubre lo que la
 * comlink completa sí: proxiar objetos vivos/callbacks por un MessagePort dedicado,
 * transfer handlers custom, ni acumulación de paths anidados. Para eso, comlink.
 * Framework-agnostic: sólo depende del contrato `RpcEndpoint`.
 */

/**
 * Eventos que escucha el RPC. `message` trae las llamadas y respuestas; `error`
 * y `messageerror` (los del `Worker` del DOM) le avisan a `wrap` que ninguna
 * respuesta pendiente va a llegar. Un endpoint que no los emite los ignora.
 */
export type RpcEventType = 'message' | 'error' | 'messageerror';

/** Los dos extremos (el `Worker` en el main, `self` en el worker) exponen esto. */
export interface RpcEndpoint {
  postMessage(message: unknown): void;
  addEventListener(type: RpcEventType, listener: (event: { data?: unknown }) => void): void;
  removeEventListener(type: RpcEventType, listener: (event: { data?: unknown }) => void): void;
}

/**
 * Un objeto de sólo métodos (posiblemente async): lo que se expone y se llama.
 * Es un tipo mapeado sobre `T` (y no un `Record<string, fn>`) para aceptar APIs
 * declaradas como `interface` o `class`, que no tienen index signature.
 */
export type MethodMap<T> = { [K in keyof T]: (...args: never[]) => unknown };

/** `remote[releaseRemote]()` deja de escuchar respuestas y rechaza lo pendiente. */
export const releaseRemote = Symbol('releaseRemote');

/** La cara remota de una API: cada método devuelve una Promise del resultado. */
export type Remote<T extends MethodMap<T>> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>;
} & { [releaseRemote](): void };

interface CallMsg {
  __wprpc: 'call';
  /** Instancia de `wrap` que llama: la respuesta vuelve con el mismo valor. */
  caller: string;
  id: number;
  method: string;
  args: unknown[];
}
interface ReturnMsg {
  __wprpc: 'return';
  caller: string;
  id: number;
  ok: boolean;
  value?: unknown;
  error?: { name: string; message: string; stack?: string };
}

/**
 * Propiedades que el Proxy de `wrap` NO convierte en llamada remota: `then`
 * (si no, `await remote` lo trata como thenable y se cuelga), `toJSON`
 * (`JSON.stringify`) y las que usan los chequeos de duck-typing de librerias
 * comunes (RxJS, matchers de test, DOM, React). Una API remota no puede tener
 * métodos con estos nombres.
 */
const NOT_REMOTE_METHODS = new Set([
  'then',
  'toJSON',
  'subscribe',
  'asymmetricMatch',
  'nodeType',
  '$$typeof',
]);

// Endpoints con un `expose` activo. Dos `expose` sobre el mismo endpoint
// responderian cada llamada dos veces, y el primero podia contestar "método
// desconocido" aunque el segundo lo tuviera: no esta soportado.
const exposedEndpoints = new WeakSet<RpcEndpoint>();

let wrapCount = 0;

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
 * función para dejar de escuchar. Un endpoint admite un solo `expose` activo:
 * el segundo tira.
 */
export function expose<T extends MethodMap<T>>(api: T, endpoint: RpcEndpoint): () => void {
  if (exposedEndpoints.has(endpoint)) {
    throw new Error(
      'RPC: este endpoint ya tiene un expose() activo; juntá los métodos en una sola API ' +
        'o llamá a la función que devolvió el primer expose() antes de exponer otra.',
    );
  }
  const listener = (event: { data?: unknown }): void => {
    const msg = event.data;
    if (!isCall(msg)) {
      return;
    }
    const reply = (extra: Partial<ReturnMsg>): void =>
      endpoint.postMessage({ __wprpc: 'return', caller: msg.caller, id: msg.id, ...extra });
    void (async () => {
      try {
        const fn = (api as Record<string, unknown>)[msg.method];
        if (typeof fn !== 'function') {
          throw new TypeError(`RPC: método desconocido "${msg.method}"`);
        }
        // `apply` con `api` como this: los métodos de una clase viven en el
        // prototipo y leen su estado por `this`.
        const value = await (fn as (...a: unknown[]) => unknown).apply(api, msg.args);
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
  exposedEndpoints.add(endpoint);
  endpoint.addEventListener('message', listener);
  return () => {
    endpoint.removeEventListener('message', listener);
    exposedEndpoints.delete(endpoint);
  };
}

/**
 * Del lado del main: devuelve un Proxy tipado. Cada llamada a un método manda UN
 * `postMessage({ method, args })` y devuelve una Promise que resuelve con la
 * respuesta (o rechaza con el error re-lanzado del worker). Un `error` o
 * `messageerror` del endpoint rechaza todo lo pendiente. `remote[releaseRemote]()`
 * corta los listeners y rechaza lo pendiente y lo que se llame después.
 */
export function wrap<T extends MethodMap<T>>(endpoint: RpcEndpoint): Remote<T> {
  // Identifica las llamadas de ESTE wrap: con dos wrap sobre el mismo endpoint,
  // los ids (0, 1, ...) se repiten y cada uno consumia las respuestas del otro.
  // El contador garantiza unicidad dentro del modulo; la parte aleatoria, entre
  // copias distintas de la libreria que compartan el endpoint.
  const caller = `${++wrapCount}-${Math.random().toString(36).slice(2)}`;
  let nextId = 0;
  let released = false;
  const pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: unknown) => void }
  >();

  const rejectAll = (reason: string): void => {
    for (const slot of pending.values()) {
      slot.reject(new Error(reason));
    }
    pending.clear();
  };

  const listener = (event: { data?: unknown }): void => {
    const msg = event.data;
    if (!isReturn(msg) || msg.caller !== caller) {
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
  // Sin estos dos, un worker que muere (script que no carga, excepción no
  // atrapada) o un mensaje que no se puede deserializar dejaban las promesas
  // colgadas para siempre. No hay forma de saber a qué llamada correspondía,
  // así que se rechaza todo lo pendiente.
  const onError = (): void =>
    rejectAll('RPC: el endpoint emitió "error" con la llamada pendiente');
  const onMessageError = (): void =>
    rejectAll('RPC: el endpoint emitió "messageerror" (un mensaje no se pudo deserializar)');
  endpoint.addEventListener('message', listener);
  endpoint.addEventListener('error', onError);
  endpoint.addEventListener('messageerror', onMessageError);

  const releasedMessage = 'RPC: remote liberado con releaseRemote, la llamada no se va a responder';
  const release = (): void => {
    released = true;
    endpoint.removeEventListener('message', listener);
    endpoint.removeEventListener('error', onError);
    endpoint.removeEventListener('messageerror', onMessageError);
    rejectAll(releasedMessage);
  };

  return new Proxy({} as Remote<T>, {
    get(_target, prop) {
      if (prop === releaseRemote) {
        return release;
      }
      if (typeof prop !== 'string' || NOT_REMOTE_METHODS.has(prop)) {
        return undefined;
      }
      return (...args: unknown[]) =>
        new Promise((resolve, reject) => {
          if (released) {
            reject(new Error(releasedMessage));
            return;
          }
          const id = nextId++;
          pending.set(id, { resolve, reject });
          try {
            endpoint.postMessage({ __wprpc: 'call', caller, id, method: prop, args });
          } catch (err) {
            // Argumento no clonable (DataCloneError): la llamada nunca salió,
            // así que no puede quedar esperando una respuesta.
            pending.delete(id);
            reject(err);
          }
        });
    },
  });
}
