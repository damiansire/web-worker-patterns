/**
 * El guardado propio de la historia: lo que el progreso neutral
 * (`core/domain/learning`) no sabe porque es de este juego. Dos cosas:
 *
 *  - los caminos recorridos en los niveles que no son ejemplos del registry (el
 *    de entrada y el prólogo);
 *  - los retos cumplidos, de cualquier nivel.
 *
 * Es un valor inmutable: cada operación devuelve uno nuevo. Lógica pura (se
 * testea sin TestBed); quien lee y escribe en el navegador es `StoryProgress`.
 */
export interface StorySave {
  /** Caminos recorridos por nivel propio: `{ prologo: ['main', 'worker'] }`. */
  paths: Readonly<Record<string, readonly string[]>>;
  /** Ids de los niveles con el reto cumplido. */
  challenges: readonly string[];
}

/** Qué se acepta en un guardado: lo demás se descarta al leerlo. */
export interface SaveShape {
  /** Los caminos válidos de cada nivel propio. */
  paths: Readonly<Record<string, readonly string[]>>;
  /** Los niveles que tienen reto. */
  challenges: readonly string[];
}

export const EMPTY_SAVE: StorySave = { paths: {}, challenges: [] };

const VERSION = 1;

export function withPath(save: StorySave, levelId: string, pathId: string): StorySave {
  const walked = save.paths[levelId] ?? [];
  if (walked.includes(pathId)) return save;
  return { ...save, paths: { ...save.paths, [levelId]: [...walked, pathId] } };
}

export function withChallenge(save: StorySave, levelId: string): StorySave {
  if (save.challenges.includes(levelId)) return save;
  return { ...save, challenges: [...save.challenges, levelId] };
}

export function hasPath(save: StorySave, levelId: string, pathId: string): boolean {
  return (save.paths[levelId] ?? []).includes(pathId);
}

export function isEmpty(save: StorySave): boolean {
  return !save.challenges.length && !Object.keys(save.paths).length;
}

export function serializeSave(save: StorySave): string {
  return JSON.stringify({ version: VERSION, ...save });
}

/**
 * Lee un guardado. Nunca tira y nunca confía (igual que el del progreso
 * neutral): uno viejo, roto o editado a mano no puede dejar el juego en un
 * estado imposible. Lo que no se reconoce se descarta y el resto se conserva.
 */
export function parseSave(raw: string | null, shape: SaveShape): StorySave {
  if (!raw) return EMPTY_SAVE;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_SAVE;
  }
  if (!isRecord(data) || data['version'] !== VERSION) return EMPTY_SAVE;

  const paths: Record<string, string[]> = {};
  if (isRecord(data['paths'])) {
    for (const [levelId, walked] of Object.entries(data['paths'])) {
      const valid = shape.paths[levelId];
      if (!valid || !Array.isArray(walked)) continue;
      const known = valid.filter((id) => walked.includes(id));
      if (known.length) paths[levelId] = known;
    }
  }
  const saved = Array.isArray(data['challenges']) ? data['challenges'] : [];
  return { paths, challenges: shape.challenges.filter((id) => saved.includes(id)) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
