/**
 * Vocabulario que el alumno va coleccionando (el "Workerdex").
 *
 * Cada término es una pieza real de la plataforma. La mecánica central del
 * recorrido como juego es el cambio de idioma: un concepto aparece primero en
 * lenguaje llano ("un ayudante") y, una vez aprendido, pasa a nombrarse por su API
 * (`new Worker()`) en TODOS los textos. Ver `morph.ts`.
 *
 * Acá vive solo lo que NO se traduce: el id estable y el nombre de la API. El
 * nombre llano y la nota de cada término son contenido y viven en i18n
 * (`learning.vocab.<id>`).
 */
export const VOCABULARY = [
  { id: 'main-thread', api: 'main thread' },
  { id: 'event-loop', api: 'event loop' },
  { id: 'compositor', api: 'compositor' },
  { id: 'new-worker', api: 'new Worker()' },
  { id: 'post-message', api: 'postMessage()' },
  { id: 'onmessage', api: 'onmessage' },
  { id: 'structured-clone', api: 'structured clone' },
  { id: 'shared-worker', api: 'SharedWorker' },
  { id: 'message-port', api: 'MessagePort' },
  { id: 'transferable', api: 'Transferable' },
  { id: 'worker-pool', api: 'worker pool' },
  { id: 'offscreen-canvas', api: 'OffscreenCanvas' },
  { id: 'onerror', api: 'onerror' },
  { id: 'terminate', api: 'terminate()' },
  { id: 'hardware-concurrency', api: 'hardwareConcurrency' },
  { id: 'backpressure', api: 'backpressure' },
  { id: 'shared-array-buffer', api: 'SharedArrayBuffer' },
  { id: 'atomics', api: 'Atomics' },
  { id: 'feature-detection', api: 'typeof Worker' },
] as const;

export type TermId = (typeof VOCABULARY)[number]['id'];

export interface Term {
  id: TermId;
  api: string;
}

const BY_ID = new Map<string, Term>(VOCABULARY.map((term) => [term.id, term]));

export function findTerm(id: string): Term | undefined {
  return BY_ID.get(id);
}

export function isTermId(id: unknown): id is TermId {
  return typeof id === 'string' && BY_ID.has(id);
}
