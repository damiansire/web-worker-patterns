/// <reference lib="webworker" />

/**
 * SharedWorker de contador compartido (ejemplo 08). UNA sola instancia que
 * varias conexiones (paneles/pestañas) comparten: cada `connect` agrega un
 * MessagePort a la lista; el estado (`count`, `instanceId`) vive acá, no en cada
 * cliente. Cualquier cambio se difunde (broadcast) a TODOS los puertos, así los
 * clientes ven siempre el mismo número.
 *
 * Protocolo neutral:
 *   in  (por puerto): { type: 'inc' | 'reset', portLabel } | { type: 'bye' }
 *   out (broadcast):  { type: 'hello', instanceId, clients, count }
 *                     { type: 'state', count, by, seq }
 *                     { type: 'clients', clients }
 */
const scope = self as unknown as SharedWorkerGlobalScope;

// `instanceId` se calcula UNA vez por instancia del worker: es la prueba de que
// todas las conexiones hablan con el mismo backend.
const instanceId = 'wkr-' + Math.random().toString(36).slice(2, 6);
let count = 0;
let seq = 0;
const ports: MessagePort[] = [];

function broadcast(message: unknown): void {
  for (const p of ports) {
    p.postMessage(message);
  }
}

scope.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  ports.push(port);
  port.start();

  port.onmessage = ({ data }: MessageEvent) => {
    if (data?.type === 'inc') {
      count += 1;
      broadcast({ type: 'state', count, by: data.portLabel, seq: seq++ });
    } else if (data?.type === 'reset') {
      count = 0;
      broadcast({ type: 'state', count, by: data.portLabel, seq: seq++ });
    } else if (data?.type === 'bye') {
      const i = ports.indexOf(port);
      if (i >= 0) {
        ports.splice(i, 1);
      }
      broadcast({ type: 'clients', clients: ports.length });
    }
  };

  // Saluda al recién llegado (le pasa el id + el estado actual) y actualiza la
  // cuenta de clientes en todos.
  port.postMessage({ type: 'hello', instanceId, clients: ports.length, count });
  broadcast({ type: 'clients', clients: ports.length });
};
