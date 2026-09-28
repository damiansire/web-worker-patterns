import { Category } from '../examples/example.model';
import { TermId } from './vocabulary';

/**
 * Las misiones del recorrido como juego: una por ejemplo del registry.
 *
 * Una misión no explica el patrón, lo hace vivir. Por eso casi todas ofrecen dos
 * caminos y el "malo" se puede elegir: bloquear el main, inundar al worker, mandar
 * algo que no se puede clonar. La consecuencia es la lección.
 *
 *   - `naive`:   el camino que duele. Enseña por lo que rompe.
 *   - `pattern`: el camino que aplica el patrón.
 *
 * Una misión queda cumplida cuando se recorrieron todos sus caminos `pattern`.
 * Qué hace cada camino (qué servicio dispara) lo decide la presentación; acá solo
 * vive la estructura, que es neutral.
 */
export type PathKind = 'naive' | 'pattern';

export interface MissionPath {
  id: string;
  kind: PathKind;
  /** Términos que entran al vocabulario al terminar este camino. */
  teaches: readonly TermId[];
}

export interface Mission {
  /** Id del ejemplo del registry que esta misión hace jugar. */
  exampleId: string;
  paths: readonly MissionPath[];
}

export const MISSIONS: readonly Mission[] = [
  {
    exampleId: '01-setinterval-counter',
    paths: [
      { id: 'main', kind: 'naive', teaches: ['main-thread'] },
      { id: 'worker', kind: 'pattern', teaches: ['worker', 'new-worker'] },
    ],
  },
  {
    exampleId: '02-main-thread',
    paths: [{ id: 'block', kind: 'pattern', teaches: ['event-loop'] }],
  },
  {
    exampleId: '16-compositor-vs-main',
    paths: [
      { id: 'main', kind: 'naive', teaches: ['compositor'] },
      { id: 'worker', kind: 'pattern', teaches: [] },
    ],
  },
  {
    exampleId: '03-basic-communication',
    paths: [
      { id: 'function', kind: 'naive', teaches: ['structured-clone'] },
      { id: 'message', kind: 'pattern', teaches: ['post-message'] },
    ],
  },
  {
    exampleId: '08-shared-worker',
    paths: [{ id: 'share', kind: 'pattern', teaches: ['shared-worker', 'message-port'] }],
  },
  {
    exampleId: '04-offloading-computation',
    paths: [
      { id: 'main', kind: 'naive', teaches: [] },
      { id: 'worker', kind: 'pattern', teaches: ['onmessage'] },
    ],
  },
  {
    exampleId: '07-transferable-objects',
    paths: [
      { id: 'clone', kind: 'naive', teaches: [] },
      { id: 'transfer', kind: 'pattern', teaches: ['transferable'] },
    ],
  },
  {
    exampleId: '10-worker-pool',
    paths: [{ id: 'pool', kind: 'pattern', teaches: ['worker-pool'] }],
  },
  {
    exampleId: '14-offscreen-canvas',
    paths: [{ id: 'block', kind: 'pattern', teaches: ['offscreen-canvas'] }],
  },
  {
    exampleId: '15-clone-cost',
    paths: [{ id: 'measure', kind: 'pattern', teaches: [] }],
  },
  {
    exampleId: '05-error-handling',
    paths: [{ id: 'broken', kind: 'pattern', teaches: ['onerror'] }],
  },
  {
    exampleId: '06-lifecycle-termination',
    paths: [{ id: 'cut', kind: 'pattern', teaches: ['terminate'] }],
  },
  {
    exampleId: '09-worker-limits',
    paths: [{ id: 'scale', kind: 'pattern', teaches: ['hardware-concurrency'] }],
  },
  {
    exampleId: '11-backpressure-scheduling',
    paths: [
      { id: 'flood', kind: 'naive', teaches: [] },
      { id: 'window', kind: 'pattern', teaches: ['backpressure'] },
    ],
  },
  {
    exampleId: '12-shared-array-buffer',
    paths: [{ id: 'share', kind: 'pattern', teaches: ['shared-array-buffer', 'atomics'] }],
  },
  {
    exampleId: '13-graceful-degradation',
    paths: [
      { id: 'fallback', kind: 'pattern', teaches: ['feature-detection'] },
      { id: 'worker', kind: 'pattern', teaches: [] },
    ],
  },
];

/**
 * Las regiones del mundo son los capítulos que ya existían, en orden pedagógico.
 * Una región se abre cuando la anterior quedó cumplida.
 */
export const REGIONS: readonly Category[] = [
  'understanding',
  'communication',
  'optimization',
  'management',
  'advanced',
];

const BY_EXAMPLE = new Map(MISSIONS.map((mission) => [mission.exampleId, mission]));

export function findMission(exampleId: string): Mission | undefined {
  return BY_EXAMPLE.get(exampleId);
}
