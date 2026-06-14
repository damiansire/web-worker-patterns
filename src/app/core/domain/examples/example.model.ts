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

export interface WorkerExample {
  /** Slug estable, ej. '01-setinterval-counter'. */
  id: string;
  /** Orden de presentación (1..N). */
  order: number;
  category: Category;
  /** Clave de traducción del título/descripción (Transloco). */
  i18nKey: string;
  /** El worker real, si el ejemplo usa uno. Cada theme lo corre vía el runner. */
  workerFactory?: () => Worker;
  /** Tabs de código a mostrar (component.ts, worker.ts, ...). */
  snippets: Record<string, string>;
}
