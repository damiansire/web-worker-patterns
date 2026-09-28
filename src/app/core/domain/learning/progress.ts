import { Category } from '../examples/example.model';
import { EXAMPLES } from '../examples/examples.registry';
import { findMission, Mission, MISSIONS, REGIONS } from './missions';
import { isTermId, TermId } from './vocabulary';

/**
 * Progreso del alumno: qué palabras aprendió y qué caminos recorrió. Es un valor
 * inmutable y cada operación devuelve uno nuevo, así se puede guardar, comparar y
 * testear sin framework.
 */
export interface Progress {
  learned: readonly TermId[];
  /** Caminos recorridos por misión: { '04-offloading-computation': ['main', 'worker'] }. */
  paths: Readonly<Record<string, readonly string[]>>;
}

export const EMPTY_PROGRESS: Progress = { learned: [], paths: {} };

/** Recorrer un camino lo registra y suma sus términos al vocabulario. */
export function completePath(progress: Progress, exampleId: string, pathId: string): Progress {
  const path = findMission(exampleId)?.paths.find((candidate) => candidate.id === pathId);
  if (!path) {
    return progress;
  }
  const walked = progress.paths[exampleId] ?? [];
  return {
    learned: [...new Set([...progress.learned, ...path.teaches])],
    paths: walked.includes(pathId)
      ? progress.paths
      : { ...progress.paths, [exampleId]: [...walked, pathId] },
  };
}

export function isPathDone(progress: Progress, exampleId: string, pathId: string): boolean {
  return (progress.paths[exampleId] ?? []).includes(pathId);
}

/** Cumplida = se recorrieron todos los caminos que aplican el patrón. */
export function isMissionDone(progress: Progress, mission: Mission): boolean {
  return mission.paths
    .filter((path) => path.kind === 'pattern')
    .every((path) => isPathDone(progress, mission.exampleId, path.id));
}

export function missionsOf(region: Category): Mission[] {
  return EXAMPLES.filter((example) => example.category === region)
    .sort((a, b) => a.order - b.order)
    .map((example) => findMission(example.id))
    .filter((mission): mission is Mission => mission !== undefined);
}

export function isRegionDone(progress: Progress, region: Category): boolean {
  return missionsOf(region).every((mission) => isMissionDone(progress, mission));
}

/** Una región está abierta si es la primera o si la anterior quedó cumplida. */
export function isRegionOpen(progress: Progress, region: Category): boolean {
  const index = REGIONS.indexOf(region);
  return index <= 0 || isRegionDone(progress, REGIONS[index - 1]);
}

export function doneCount(progress: Progress): number {
  return MISSIONS.filter((mission) => isMissionDone(progress, mission)).length;
}

/* ── guardado ── */

const VERSION = 1;

export function serialize(progress: Progress): string {
  return JSON.stringify({ version: VERSION, learned: progress.learned, paths: progress.paths });
}

/**
 * Lee un guardado. Nunca tira y nunca confía: un guardado viejo, roto o editado a
 * mano no puede dejar el juego en un estado imposible. Lo que no se reconoce (un
 * término retirado, un camino que ya no existe) se descarta y el resto se conserva.
 */
export function parse(raw: string | null): Progress {
  if (!raw) {
    return EMPTY_PROGRESS;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (!isRecord(data) || data['version'] !== VERSION) {
    return EMPTY_PROGRESS;
  }

  const learned = Array.isArray(data['learned']) ? data['learned'].filter(isTermId) : [];
  const paths: Record<string, string[]> = {};
  if (isRecord(data['paths'])) {
    for (const [exampleId, walked] of Object.entries(data['paths'])) {
      const mission = findMission(exampleId);
      if (!mission || !Array.isArray(walked)) {
        continue;
      }
      const known = walked.filter((id) => mission.paths.some((path) => path.id === id));
      if (known.length > 0) {
        paths[exampleId] = [...new Set(known)];
      }
    }
  }
  return { learned: [...new Set(learned)], paths };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
