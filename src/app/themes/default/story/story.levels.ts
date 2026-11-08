import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { Category } from '../../../core/domain/examples/example.model';

/**
 * La historia por niveles: qué niveles hay, en qué orden, cuáles ya tienen su
 * escena y cuáles se pueden jugar. Lógica pura (se testea sin TestBed); el
 * progreso real lo guarda `LearningProgressService` y el prólogo, `StoryProgress`.
 *
 * Un nivel con `scene` se juega en su propia pantalla, y se destraba al superar
 * el anterior con escena. Los que todavía no tienen escena están "en obra": se
 * pueden abrir siempre, en su versión clásica, hasta que les llegue la suya.
 */
export type SceneId = 'prologue' | 'counter' | 'queue' | 'fan';

export interface Chapter {
  key: Category | 'prologue';
  n: number;
  title: string;
}

export interface Level {
  /** Id de ruta: el del ejemplo del registry, o `prologo`. */
  id: string;
  /** Número que se muestra (0 = prólogo). */
  n: number;
  chapter: Chapter['key'];
  /** Nombre corto, de historia, no de API. */
  title: string;
  scene: SceneId | null;
}

export type LevelState = 'locked' | 'open' | 'done' | 'wip';

export const PROLOGUE_ID = 'prologo';

export const CHAPTERS: readonly Chapter[] = [
  { key: 'prologue', n: 0, title: 'Prólogo' },
  { key: 'understanding', n: 1, title: 'Entender' },
  { key: 'communication', n: 2, title: 'Comunicar' },
  { key: 'optimization', n: 3, title: 'Optimizar' },
  { key: 'management', n: 4, title: 'Gestionar' },
  { key: 'advanced', n: 5, title: 'Avanzar' },
];

const TITLES: Record<string, string> = {
  '01-setinterval-counter': 'Tic, tac',
  '02-main-thread': 'La fila de main',
  '16-compositor-vs-main': 'Lo que no se congela',
  '03-basic-communication': 'Mandar un mensaje',
  '08-shared-worker': 'Un worker compartido',
  '04-offloading-computation': 'Pasarle lo pesado',
  '07-transferable-objects': 'Pasar sin copiar',
  '10-worker-pool': 'Un equipo de workers',
  '14-offscreen-canvas': 'Pintar desde otro hilo',
  '15-clone-cost': 'Lo que cuesta copiar',
  '05-error-handling': 'Cuando algo falla',
  '06-lifecycle-termination': 'Despedir a un worker',
  '09-worker-limits': 'No sobran manos',
  '11-backpressure-scheduling': 'No inundar al worker',
  '12-shared-array-buffer': 'Memoria compartida',
  '13-graceful-degradation': 'Plan B',
};

/** Niveles que ya tienen escena propia (el resto está en obra). */
const SCENES: Record<string, SceneId> = {
  [PROLOGUE_ID]: 'prologue',
  '01-setinterval-counter': 'counter',
  '02-main-thread': 'queue',
  '16-compositor-vs-main': 'fan',
};

export function buildLevels(): Level[] {
  const levels: Level[] = [
    { id: PROLOGUE_ID, n: 0, chapter: 'prologue', title: 'Main y su malabar', scene: 'prologue' },
  ];
  for (const chapter of CHAPTERS) {
    if (chapter.key === 'prologue') continue;
    const examples = EXAMPLES.filter((e) => e.category === chapter.key).sort(
      (a, b) => a.order - b.order,
    );
    for (const e of examples) {
      levels.push({
        id: e.id,
        n: levels.length,
        chapter: chapter.key,
        title: TITLES[e.id] ?? e.id,
        scene: SCENES[e.id] ?? null,
      });
    }
  }
  return levels;
}

export const LEVELS: readonly Level[] = buildLevels();

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

/** Estado de un nivel según cuáles están superados. */
export function levelState(
  level: Level,
  isDone: (id: string) => boolean,
  levels: readonly Level[] = LEVELS,
): LevelState {
  if (!level.scene) return 'wip';
  if (isDone(level.id)) return 'done';
  const playable = levels.filter((l) => l.scene);
  const i = playable.findIndex((l) => l.id === level.id);
  return i <= 0 || isDone(playable[i - 1].id) ? 'open' : 'locked';
}

/** El nivel que sigue en la historia (con escena o en obra), o null al final. */
export function nextLevel(id: string, levels: readonly Level[] = LEVELS): Level | null {
  const i = levels.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < levels.length ? levels[i + 1] : null;
}

/** Dónde está main en el mapa: el primer nivel jugable sin superar (o el último). */
export function currentLevel(
  isDone: (id: string) => boolean,
  levels: readonly Level[] = LEVELS,
): Level {
  const playable = levels.filter((l) => l.scene);
  return playable.find((l) => !isDone(l.id)) ?? playable[playable.length - 1];
}

/**
 * Posiciones del camino del mapa en serpentina: filas de `cols` que van y
 * vuelven, para que el recorrido se lea de corrido sin saltos.
 */
export function serpentine(
  count: number,
  cols: number,
  cell: { w: number; h: number },
  origin: { x: number; y: number },
): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const k = i % cols;
    const col = row % 2 === 0 ? k : cols - 1 - k;
    return { x: origin.x + col * cell.w, y: origin.y + row * cell.h };
  });
}
