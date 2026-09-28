/**
 * Snippets neutrales del ejemplo 11 (backpressure / control de flujo).
 */
export const BACKPRESSURE_SNIPPETS: Record<string, string> = {
  'sin-backpressure.ts': `// Sin control de flujo: disparás todo de una. postMessage NO
// bloquea ni avisa si el worker no da abasto: la cola interna del
// worker se infla sin techo (memoria + latencia).
for (const task of tasks) {           // 40 mensajes de golpe
  worker.postMessage({ command: 'compute', limit: task.limit });
}
// el worker procesa de a uno; los otros 39 esperan encolados.`,

  'con-backpressure.ts': `// Con backpressure: mandás sólo mientras haya "crédito" (una
// ventana chica) y esperás el ack del worker antes de mandar más.
const WINDOW = 3;
let inFlight = 0, i = 0;

function pump() {
  while (inFlight < WINDOW && i < tasks.length) {
    worker.postMessage({ command: 'compute', limit: tasks[i++].limit });
    inFlight++;
  }
}
worker.onmessage = () => { inFlight--; pump(); }; // libera crédito y sigue
pump();
// la cola nunca pasa de WINDOW; lo pendiente espera en el productor,
// donde todavía podés descartarlo o re-priorizarlo.`,
};
