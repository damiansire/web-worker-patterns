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
export type SceneId = 'intro' | 'prologue' | 'counter' | 'queue' | 'fan';
/** Las escenas que se juegan con un guion (`SCRIPTS`); el intro tiene su propia pantalla. */
export type ScriptedScene = Exclude<SceneId, 'intro'>;

export interface Chapter {
  key: Category | 'prologue';
  n: number;
  title: string;
}

export interface Level {
  /** Id de ruta: el del ejemplo del registry, `conoce-a-main` o `prologo`. */
  id: string;
  /** Número que se muestra (0 = el de entrada). */
  n: number;
  chapter: Chapter['key'];
  /** Nombre corto, de historia, no de API. */
  title: string;
  scene: SceneId | null;
}

export type LevelState = 'locked' | 'open' | 'done' | 'wip';

export const PROLOGUE_ID = 'prologo';
/**
 * El nivel de entrada: qué es main y de qué se encarga. Va primero, en el
 * capítulo del prólogo (comparte su hito, la casa de main). Es informativo: no
 * traba al prólogo, que se puede jugar aunque no se haya visto.
 */
export const INTRO_ID = 'conoce-a-main';

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
  [INTRO_ID]: 'intro',
  [PROLOGUE_ID]: 'prologue',
  '01-setinterval-counter': 'counter',
  '02-main-thread': 'queue',
  '16-compositor-vs-main': 'fan',
};

export function buildLevels(): Level[] {
  const levels: Level[] = [
    { id: INTRO_ID, n: 0, chapter: 'prologue', title: 'Conocé a main', scene: 'intro' },
    { id: PROLOGUE_ID, n: 1, chapter: 'prologue', title: 'Main y su malabar', scene: 'prologue' },
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

/**
 * Estado de un nivel según cuáles están superados. Lo destraba el anterior con
 * escena; el de entrada no traba a nadie (no hay nada que superar en él).
 */
export function levelState(
  level: Level,
  isDone: (id: string) => boolean,
  levels: readonly Level[] = LEVELS,
): LevelState {
  if (!level.scene) return 'wip';
  if (isDone(level.id)) return 'done';
  const playable = levels.filter((l) => l.scene);
  const i = playable.findIndex((l) => l.id === level.id);
  if (i <= 0) return 'open';
  const prev = playable[i - 1];
  return prev.id === INTRO_ID || isDone(prev.id) ? 'open' : 'locked';
}

/** El nivel que sigue en la historia (con escena o en obra), o null al final. */
export function nextLevel(id: string, levels: readonly Level[] = LEVELS): Level | null {
  const i = levels.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < levels.length ? levels[i + 1] : null;
}

/**
 * Dónde está main en el mapa: el nivel jugable que sigue al último superado
 * (el primero, si no hay ninguno; el último, si están todos). Así, si se jugó
 * el prólogo sin pasar por el de entrada, main no vuelve atrás.
 */
export function currentLevel(
  isDone: (id: string) => boolean,
  levels: readonly Level[] = LEVELS,
): Level {
  const playable = levels.filter((l) => l.scene);
  let last = -1;
  playable.forEach((l, i) => {
    if (isDone(l.id)) last = i;
  });
  return playable[Math.min(last + 1, playable.length - 1)];
}
