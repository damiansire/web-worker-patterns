/**
 * Forma del contenido del recorrido como juego (i18n, clave `learning`). Es texto:
 * qué dice cada vecino, cómo se llama cada término en lenguaje llano. La
 * estructura (qué misiones y caminos existen) vive en `missions.ts`; el gate de
 * `content.spec.ts` verifica que las dos coincidan.
 *
 * Marcas dentro de un texto:
 *   `{nombre llano|id-del-término}`  cambia de idioma al aprenderse (ver `morph.ts`)
 *   `[valor]`                        lo completa la misión con lo que midió
 */
export interface PathContent {
  /** Lo que dice el botón que elige este camino. */
  label: string;
  /** Lo que se dice mientras corre. */
  during: string;
  /** Lo que se dice al terminar, con los valores medidos. */
  after: string[];
  /** Botón de una acción a mitad de camino (cortar una tarea). */
  act?: string;
  /** Lo que se dice si la acción a mitad de camino no llegó a tiempo. */
  missed?: string[];
  /** Línea extra cuando el navegador no permitió la versión real. */
  simulated?: string;
}

export interface MissionContent {
  npc: string;
  hello: string;
  ask: string;
  /** Lo que dice el vecino cuando la misión ya está cumplida. */
  done: string;
  paths: Record<string, PathContent>;
}

export interface TermContent {
  plain: string;
  note: string;
}

export interface MastersContent {
  /** Antes de la primera situación. */
  ready: string;
  wrong: string;
  /** Falta aprender una palabra del examen. */
  missing: string;
  pass: string;
  /** Al ganar el último sello. */
  final: string;
  /** Texto de cada situación: región -> id -> texto. */
  challenges: Record<string, Record<string, string>>;
}

export interface LearningContent {
  ui: Record<string, string>;
  masters: MastersContent;
  regions: Record<string, string>;
  vocab: Record<string, TermContent>;
  missions: Record<string, MissionContent>;
}

/** Completa las marcas `[valor]` de un texto. Una marca sin valor queda visible. */
export function fill(text: string, values: Readonly<Record<string, string | number>>): string {
  return text.replace(/\[([a-z]+)\]/gi, (mark, key: string) =>
    key in values ? String(values[key]) : mark,
  );
}

/** Todas las líneas que un camino puede llegar a mostrar en la caja de diálogo. */
export function spokenLines(path: PathContent): string[] {
  return [
    path.during,
    ...path.after,
    ...(path.missed ?? []),
    ...(path.simulated ? [path.simulated] : []),
  ];
}
