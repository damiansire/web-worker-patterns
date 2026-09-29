import { findTerm, TermId } from './vocabulary';

/**
 * El cambio de idioma por palabra aprendida.
 *
 * Un texto marca sus conceptos como `{nombre llano|id-del-término}`. Mientras el
 * alumno no aprendió el término se muestra el nombre llano; después, el nombre de
 * la API. Una tercera parte opcional fija cómo se lee ya aprendido, para plurales
 * y artículos: `{ayudantes|worker|workers}`. Así el propio texto del juego va pasando de castellano a "plataforma"
 * a medida que se avanza, sin que ningún diálogo se reescriba.
 *
 *   morph('Llamá a {un ayudante|new-worker}.', new Set())
 *     -> [texto 'Llamá a ', texto 'un ayudante', texto '.']
 *   morph('Llamá a {un ayudante|new-worker}.', new Set(['new-worker']))
 *     -> [texto 'Llamá a ', término 'new Worker()', texto '.']
 *
 * Hay una segunda marca, `{=dato}`: algo que devolvió la plataforma (la respuesta
 * de un worker, el nombre de un error). Se muestra tal cual llegó y se distingue
 * de la prosa: un `HOLA` que volvió en mayúsculas es un dato, no un grito.
 */
export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'term'; termId: TermId; value: string }
  | { kind: 'data'; value: string };

const TOKEN = /\{([^{}|]+)\|([^{}|]+)(?:\|([^{}|]+))?\}|\{=([^{}]*)\}/g;

export function morph(text: string, learned: ReadonlySet<TermId>): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [token, plain, id, shown, data] = match;
    if (match.index > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, match.index) });
    }
    const term = data === undefined ? findTerm(id) : undefined;
    if (data !== undefined) {
      segments.push({ kind: 'data', value: data });
    } else if (term && learned.has(term.id)) {
      segments.push({ kind: 'term', termId: term.id, value: shown ?? term.api });
    } else {
      segments.push({ kind: 'text', value: plain });
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}

/** Ids de término que un texto menciona y que no existen en el vocabulario. */
export function unknownTerms(text: string): string[] {
  return [...text.matchAll(TOKEN)]
    .filter((match) => match[4] === undefined)
    .map((match) => match[2])
    .filter((id) => !findTerm(id));
}

/**
 * Palabras que el alumno lee en pantalla, en el PEOR de los dos idiomas: un texto
 * tiene que entrar en el presupuesto antes y después de aprender sus términos. El
 * nombre de una API cuenta como una palabra (se lee como un bloque).
 */
export function wordCount(text: string): number {
  const count = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
  const plain = text.replace(TOKEN, (...parts: (string | undefined)[]) => parts[4] ?? parts[1]!);
  const api = text.replace(TOKEN, (...parts: (string | undefined)[]) => parts[4] ?? 'API');
  return Math.max(count(plain), count(api));
}
