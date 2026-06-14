/**
 * Snippets neutrales del ejemplo 11 (backpressure / control de flujo).
 */
export const BACKPRESSURE_SNIPPETS: Record<string, string> = {
  'sin-backpressure.ts': `// Sin control de flujo: disparás todo de una. postMessage NO
// bloquea ni avisa si el worker no da abasto — la cola interna del
// worker se infla sin techo (memoria + latencia).
for (const item of items) {           // 40 mensajes de golpe
  worker.postMessage({ command: 'process', item });
}
// el worker procesa de a uno; los otros 39 esperan encolados.`,

  'con-backpressure.ts': `// Con backpressure: mandás sólo mientras haya "crédito" (una
// ventana chica) y esperás el ack del worker antes de mandar más.
const WINDOW = 3;
let inFlight = 0, i = 0;

function pump() {
  while (inFlight < WINDOW && i < items.length) {
    worker.postMessage({ command: 'process', item: items[i++] });
    inFlight++;
  }
}
worker.onmessage = () => { inFlight--; pump(); }; // libera crédito y sigue
pump();
// la cola nunca pasa de WINDOW: el productor va al ritmo del consumidor.`,
};
