import { inject, Injectable, signal } from '@angular/core';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { PROLOGUE_ID } from './story.levels';

const PROLOGUE_KEY = 'wwp-story-prologue';

/**
 * Por ahora el juego no guarda el progreso: cada recarga arranca de cero, para
 * poder probarlo de punta a punta muchas veces. Dentro de la misma carga sí se
 * acuerda (los niveles se van abriendo). Para volver a guardar, pasarlo a `true`.
 */
const KEEP_PROGRESS = false;

/**
 * Qué niveles de la historia están superados. Los del registry usan el progreso
 * neutral (`LearningProgressService`: una misión se cumple al recorrer sus
 * caminos `pattern`); el prólogo no es un ejemplo, así que guarda su marca aparte.
 * Todo es signal: el mapa y la pantalla de nivel se actualizan solos.
 */
@Injectable({ providedIn: 'root' })
export class StoryProgress {
  private readonly learning = inject(LearningProgressService);
  private readonly prologue = signal(KEEP_PROGRESS && readStored(PROLOGUE_KEY) === '1');

  constructor() {
    if (!KEEP_PROGRESS) this.learning.reset();
  }

  isDone(levelId: string): boolean {
    return levelId === PROLOGUE_ID ? this.prologue() : this.learning.isMissionDone(levelId);
  }

  isPathDone(levelId: string, pathId: string): boolean {
    return levelId === PROLOGUE_ID
      ? pathId === 'worker' && this.prologue()
      : this.learning.isPathDone(levelId, pathId);
  }

  /** Registra un camino recorrido. En el prólogo solo cuenta el del worker. */
  completePath(levelId: string, pathId: string): void {
    if (levelId !== PROLOGUE_ID) {
      this.learning.completePath(levelId, pathId);
    } else if (pathId === 'worker') {
      this.prologue.set(true);
      if (KEEP_PROGRESS) writeStored(PROLOGUE_KEY, '1');
    }
  }
}
