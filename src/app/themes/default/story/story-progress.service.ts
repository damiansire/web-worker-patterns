import { inject, Injectable, signal } from '@angular/core';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { INTRO_ID, PROLOGUE_ID } from './story.levels';

/** Dónde guarda su marca cada nivel que no es un ejemplo del registry. */
const OWN_KEYS: Record<string, string> = {
  [PROLOGUE_ID]: 'wwp-story-prologue',
  [INTRO_ID]: 'wwp-story-intro',
};
/** El camino que cuenta en cada uno: el del worker en el prólogo; verlo entero en el de entrada. */
const OWN_PATH: Record<string, string> = {
  [PROLOGUE_ID]: 'worker',
  [INTRO_ID]: 'seen',
};

/**
 * Por ahora el juego no guarda el progreso: cada recarga arranca de cero, para
 * poder probarlo de punta a punta muchas veces. Dentro de la misma carga sí se
 * acuerda (los niveles se van abriendo). Para volver a guardar, pasarlo a `true`.
 */
const KEEP_PROGRESS = false;

/**
 * Qué niveles de la historia están superados. Los del registry usan el progreso
 * neutral (`LearningProgressService`: una misión se cumple al recorrer sus
 * caminos `pattern`); el prólogo y el de entrada no son ejemplos, así que
 * guardan su marca aparte (un solo camino cada uno).
 * Todo es signal: el mapa y la pantalla de nivel se actualizan solos.
 */
@Injectable({ providedIn: 'root' })
export class StoryProgress {
  private readonly learning = inject(LearningProgressService);
  private readonly own = signal<ReadonlySet<string>>(
    new Set(
      Object.keys(OWN_KEYS).filter((id) => KEEP_PROGRESS && readStored(OWN_KEYS[id]) === '1'),
    ),
  );

  constructor() {
    if (!KEEP_PROGRESS) this.learning.reset();
  }

  isDone(levelId: string): boolean {
    return levelId in OWN_KEYS ? this.own().has(levelId) : this.learning.isMissionDone(levelId);
  }

  isPathDone(levelId: string, pathId: string): boolean {
    return levelId in OWN_KEYS
      ? pathId === OWN_PATH[levelId] && this.own().has(levelId)
      : this.learning.isPathDone(levelId, pathId);
  }

  /** Registra un camino recorrido. En los niveles propios solo cuenta su camino. */
  completePath(levelId: string, pathId: string): void {
    if (!(levelId in OWN_KEYS)) {
      this.learning.completePath(levelId, pathId);
    } else if (pathId === OWN_PATH[levelId]) {
      this.own.update((done) => new Set(done).add(levelId));
      if (KEEP_PROGRESS) writeStored(OWN_KEYS[levelId], '1');
    }
  }
}
