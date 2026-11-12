import { computed, inject, Injectable, signal } from '@angular/core';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { INTRO_ID, Level, LEVELS, PROLOGUE_ID, ScriptedScene } from './story.levels';
import {
  EMPTY_SAVE,
  hasPath,
  isEmpty,
  parseSave,
  SaveShape,
  serializeSave,
  StorySave,
  withChallenge,
  withPath,
} from './story.save';
import { countStars, GOALS, LevelGoals, Star, STAR_IDS, starsOf } from './story.stars';

const SAVE_KEY = 'wwp-story';
/** Las marcas sueltas de antes del guardado único: se leen una vez, para no perder lo jugado. */
const LEGACY_KEYS: Record<string, string> = {
  [PROLOGUE_ID]: 'wwp-story-prologue',
  [INTRO_ID]: 'wwp-story-intro',
};

/**
 * Los niveles que no son ejemplos del registry guardan sus caminos acá. `goal`
 * es el que cuenta para superarlo: el del worker en el prólogo; verlo entero
 * en el de entrada.
 */
const OWN: Record<string, { paths: readonly string[]; goal: string }> = {
  [PROLOGUE_ID]: { paths: GOALS.prologue.paths, goal: 'worker' },
  [INTRO_ID]: { paths: ['seen'], goal: 'seen' },
};

/** Las metas (caminos y reto) de un nivel, si se juega con guion; el de entrada y los en obra no tienen. */
export function goalsOf(level: Level): LevelGoals | null {
  return level.scene && level.scene !== 'intro' ? GOALS[level.scene as ScriptedScene] : null;
}

/** Los niveles que dan estrellas. */
const SCORED = LEVELS.filter((l) => goalsOf(l));

const SHAPE: SaveShape = {
  paths: Object.fromEntries(Object.entries(OWN).map(([id, own]) => [id, own.paths])),
  challenges: SCORED.map((l) => l.id),
};

function load(): StorySave {
  const raw = readStored(SAVE_KEY);
  if (raw) return parseSave(raw, SHAPE);
  return Object.keys(LEGACY_KEYS)
    .filter((id) => readStored(LEGACY_KEYS[id]) === '1')
    .reduce((save, id) => withPath(save, id, OWN[id].goal), EMPTY_SAVE);
}

/**
 * El progreso de la historia: qué niveles están superados, qué caminos se
 * recorrieron y cuántas estrellas hay. Se guarda en el navegador, así el mapa
 * espera como se lo dejó; `reset` lo borra para jugar de cero.
 *
 * Los niveles del registry usan el progreso neutral (`LearningProgressService`:
 * una misión se cumple al recorrer sus caminos `pattern`). Lo que es propio de
 * este juego (los caminos del prólogo y del nivel de entrada, y los retos) va
 * en su guardado (`story.save.ts`). Las reglas son lógica pura; acá solo se
 * guarda el valor y se lo expone como signals: el mapa y la pantalla de nivel
 * se actualizan solos.
 */
@Injectable({ providedIn: 'root' })
export class StoryProgress {
  private readonly learning = inject(LearningProgressService);
  private readonly save = signal<StorySave>(load());

  /** Estrellas ganadas en total y cuántas hay para ganar. */
  readonly stars = computed(() =>
    SCORED.reduce((total, level) => total + countStars(this.starsOf(level) ?? []), 0),
  );
  readonly maxStars = SCORED.length * STAR_IDS.length;
  /** Si ya se jugó algo: recién entonces tiene sentido ofrecer empezar de cero. */
  readonly started = computed(
    () =>
      !isEmpty(this.save()) ||
      SCORED.some((level) => goalsOf(level)!.paths.some((id) => this.isPathDone(level.id, id))),
  );

  isDone(levelId: string): boolean {
    const own = OWN[levelId];
    return own ? hasPath(this.save(), levelId, own.goal) : this.learning.isMissionDone(levelId);
  }

  isPathDone(levelId: string, pathId: string): boolean {
    return levelId in OWN
      ? hasPath(this.save(), levelId, pathId)
      : this.learning.isPathDone(levelId, pathId);
  }

  /** Registra un camino recorrido. En los niveles propios solo valen sus caminos. */
  completePath(levelId: string, pathId: string): void {
    const own = OWN[levelId];
    if (!own) this.learning.completePath(levelId, pathId);
    else if (own.paths.includes(pathId)) this.store(withPath(this.save(), levelId, pathId));
  }

  isChallengeDone(levelId: string): boolean {
    return this.save().challenges.includes(levelId);
  }

  /** Registra el reto de un nivel. Devuelve si se cumplió recién ahora. */
  completeChallenge(levelId: string): boolean {
    if (!SHAPE.challenges.includes(levelId) || this.isChallengeDone(levelId)) return false;
    this.store(withChallenge(this.save(), levelId));
    return true;
  }

  /** Las tres estrellas de un nivel (ganadas o no), o null si el nivel no da estrellas. */
  starsOf(level: Level): Star[] | null {
    const goals = goalsOf(level);
    if (!goals) return null;
    return starsOf(goals, {
      solved: this.isDone(level.id),
      walked: (pathId) => this.isPathDone(level.id, pathId),
      challenge: this.isChallengeDone(level.id),
    });
  }

  /** Empezar de cero: olvida todo lo jugado, acá y en el progreso neutral. */
  reset(): void {
    this.store(EMPTY_SAVE);
    this.learning.reset();
  }

  private store(save: StorySave): void {
    if (save === this.save()) return;
    this.save.set(save);
    writeStored(SAVE_KEY, serializeSave(save));
  }
}
