/**
 * Snippets neutrales del ejemplo 08 (SharedWorker).
 */
export const SHARED_WORKER_SNIPPETS: Record<string, string> = {
  'shared-counter.worker.ts': `// El estado vive acá, UNA vez. Cada conexión agrega un puerto;
// los cambios se difunden a TODOS (broadcast).
let count = 0;
const ports = [];

self.onconnect = (e) => {
  const port = e.ports[0];
  ports.push(port);
  port.start();                       // ← obligatorio para recibir mensajes
  port.onmessage = ({ data }) => {
    if (data.type === 'inc') count++;
    for (const p of ports) p.postMessage({ type: 'state', count });
  };
  port.postMessage({ type: 'hello', count }); // sincroniza al recién llegado
};`,

  'conectar.ts': `// Cada pestaña/panel conecta al MISMO SharedWorker por su propio puerto.
const worker = new SharedWorker(new URL('./shared-counter.worker', import.meta.url), { type: 'module' });
worker.port.start();
worker.port.onmessage = (e) => render(e.data.count);
worker.port.postMessage({ type: 'inc' });

// Otra pestaña hace lo mismo y ve el MISMO contador:
// no son dos copias sincronizadas, es una sola variable en el worker.`,
};
