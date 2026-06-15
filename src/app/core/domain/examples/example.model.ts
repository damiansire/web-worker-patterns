/**
 * Modelo neutral de un ejemplo de Web Workers (ARQUITECTURA §3.1).
 *
 * Un ejemplo NO es un componente: es metadata + referencia al worker real.
 * Cada theme decide cómo renderizarlo a partir de estos datos. Esta capa no
 * conoce los themes ni importa nada de UI.
 */

export type Category =
  | 'understanding'
  | 'communication'
  | 'management'
  | 'optimization'
  | 'advanced';

/**
 * Tipo de demo interactiva del ejemplo: define qué visualización educativa
 * renderiza cada theme. Cada ejemplo enseña un concepto distinto, así que no
 * comparten una sola demo.
 *   - thread-block:     worker vs main bloqueado (ej. 01)
 *   - message-exchange: ida y vuelta de mensajes main <-> worker (ej. 03)
 *   - offload:          cómputo pesado en el worker (UI fluida) vs en el main (UI congelada) (ej. 04)
 *   - error-handling:   un error dentro del worker se captura con onerror y la app sigue viva (ej. 05)
 *   - lifecycle:        ciclo de vida del worker: arrancar una tarea larga y terminarla a mitad (ej. 06)
 *   - transferable:     transferir un ArrayBuffer (zero-copy, deja el buffer detached) vs clonarlo (ej. 07)
 *   - shared-worker:    un SharedWorker compartido por varias conexiones: un solo estado, N clientes (ej. 08)
 *   - worker-limits:    correr K workers a la vez: el paralelismo se aplana al pasar los núcleos del CPU (ej. 09)
 *   - worker-pool:      un pool fijo de N workers que se reusan para drenar una cola de M tareas (ej. 10)
 *   - backpressure:     productor más rápido que el worker: sin control de flujo la cola se infla; con ack queda acotada (ej. 11)
 *   - shared-memory:    SharedArrayBuffer + Atomics: main y worker comparten la MISMA memoria, sin postMessage (ej. 12)
 *   - degradation:      feature-detect de Worker: corre off-thread si hay, o en el main si no (mismo resultado) (ej. 13)
 *   - offscreen-canvas: transferControlToOffscreen: el worker dibuja/anima un canvas con su propio
 *                       rendering loop; sigue fluido aunque el main esté bloqueado (ej. 14)
 *   - clone-cost:       mide el round-trip REAL (structured clone ida y vuelta) de payloads que el
 *                       usuario dimensiona por tamaño y complejidad; grafica ms vs bytes (ej. 15)
 */
export type DemoKind =
  | 'thread-block'
  | 'message-exchange'
  | 'offload'
  | 'error-handling'
  | 'lifecycle'
  | 'transferable'
  | 'shared-worker'
  | 'worker-limits'
  | 'worker-pool'
  | 'backpressure'
  | 'shared-memory'
  | 'degradation'
  | 'offscreen-canvas'
  | 'clone-cost';

export interface WorkerExample {
  /** Slug estable, ej. '01-setinterval-counter'. */
  id: string;
  /** Orden de presentación (1..N). */
  order: number;
  category: Category;
  /** Clave de traducción del título/descripción (Transloco). */
  i18nKey: string;
  /** Qué demo educativa muestra (si tiene worker). */
  demo?: DemoKind;
  /** El worker real, si el ejemplo usa uno. Cada theme lo corre vía el runner. */
  workerFactory?: () => Worker;
  /** Fábrica de SharedWorker (ej. 08): se llama una vez por cada conexión/panel. */
  sharedWorkerFactory?: () => SharedWorker;
  /** Tabs de código a mostrar (component.ts, worker.ts, ...). */
  snippets: Record<string, string>;
}
