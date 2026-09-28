import { Category } from '../examples/example.model';
import { MISSIONS, REGIONS } from './missions';
import { missionsOf } from './progress';
import { TermId } from './vocabulary';

/**
 * Las maestras: una por región, en la salida. Cumplidas las misiones de la región,
 * la maestra plantea tres situaciones y hay que elegir qué pieza de la plataforma
 * la resuelve. Aprobar da el sello de la región y abre el paso a la siguiente.
 *
 * No es un cuestionario suelto: cada situación es un problema de los que el alumno
 * ya vivió en una misión, y las opciones son palabras de SU vocabulario (se leen en
 * el idioma que tenga aprendido). Equivocarse no castiga: la maestra dice con qué
 * vecino repasar.
 *
 * Acá vive la estructura. El texto de cada situación está en i18n
 * (`learning.masters.<región>.<id>`).
 */
export interface Challenge {
  id: string;
  answer: TermId;
  /** Las otras opciones. Tienen que ser plausibles: son términos ya vistos. */
  decoys: readonly [TermId, TermId];
}

export interface Master {
  region: Category;
  challenges: readonly Challenge[];
}

export const MASTERS: readonly Master[] = [
  {
    region: 'understanding',
    challenges: [
      { id: 'heavy', answer: 'new-worker', decoys: ['event-loop', 'compositor'] },
      { id: 'queue', answer: 'event-loop', decoys: ['compositor', 'new-worker'] },
      { id: 'spin', answer: 'compositor', decoys: ['main-thread', 'event-loop'] },
    ],
  },
  {
    region: 'communication',
    challenges: [
      { id: 'talk', answer: 'post-message', decoys: ['shared-worker', 'message-port'] },
      { id: 'function', answer: 'structured-clone', decoys: ['post-message', 'message-port'] },
      { id: 'tabs', answer: 'shared-worker', decoys: ['new-worker', 'message-port'] },
    ],
  },
  {
    region: 'optimization',
    challenges: [
      { id: 'bulk', answer: 'transferable', decoys: ['structured-clone', 'worker-pool'] },
      { id: 'many', answer: 'worker-pool', decoys: ['transferable', 'offscreen-canvas'] },
      { id: 'canvas', answer: 'offscreen-canvas', decoys: ['compositor', 'worker-pool'] },
    ],
  },
  {
    region: 'management',
    challenges: [
      { id: 'failed', answer: 'onerror', decoys: ['onmessage', 'terminate'] },
      { id: 'stale', answer: 'terminate', decoys: ['onerror', 'post-message'] },
      { id: 'howmany', answer: 'hardware-concurrency', decoys: ['worker-pool', 'event-loop'] },
    ],
  },
  {
    region: 'advanced',
    challenges: [
      { id: 'flood', answer: 'backpressure', decoys: ['worker-pool', 'atomics'] },
      { id: 'memory', answer: 'shared-array-buffer', decoys: ['transferable', 'shared-worker'] },
      { id: 'missing', answer: 'feature-detection', decoys: ['terminate', 'onerror'] },
    ],
  },
];

export function findMaster(region: Category): Master | undefined {
  return MASTERS.find((master) => master.region === region);
}

/** Términos que alguna misión de esta región o de una anterior enseña. */
export function termsSeenBy(region: Category): Set<TermId> {
  const upTo = REGIONS.slice(0, REGIONS.indexOf(region) + 1);
  return new Set(
    upTo.flatMap((each) =>
      missionsOf(each).flatMap((mission) => mission.paths.flatMap((path) => path.teaches)),
    ),
  );
}

/** El ejemplo cuya misión enseña un término: a quién ir a repasarlo. */
export function teacherOf(term: TermId): string | undefined {
  return MISSIONS.find((mission) => mission.paths.some((path) => path.teaches.includes(term)))
    ?.exampleId;
}

/**
 * Las tres opciones de una situación, en un orden que no delata la respuesta y
 * que es siempre el mismo para la misma situación (no salta entre un intento y
 * otro, y se puede testear).
 */
export function optionsOf(challenge: Challenge): TermId[] {
  const options: TermId[] = [challenge.answer, ...challenge.decoys];
  const seed = [...challenge.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const shift = seed % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}
