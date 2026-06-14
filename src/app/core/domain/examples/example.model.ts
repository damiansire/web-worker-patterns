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
 */
export type DemoKind = 'thread-block' | 'message-exchange';

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
  /** Tabs de código a mostrar (component.ts, worker.ts, ...). */
  snippets: Record<string, string>;
}
