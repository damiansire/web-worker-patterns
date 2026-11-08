import { inject, Injectable, signal } from '@angular/core';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { PROLOGUE_ID } from './story.levels';

const PROLOGUE_KEY = 'wwp-story-prologue';

/**
 * Qué niveles de la historia están superados. Los del registry usan el progreso
 * neutral (`LearningProgressService`: una misión se cumple al recorrer sus
 * caminos `pattern`); el prólogo no es un ejemplo, así que guarda su marca aparte.
 * Todo es signal: el mapa y la pantalla de nivel se actualizan solos.
 */
@Injectable({ providedIn: 'root' })
export class StoryProgress {
  private readonly learning = inject(LearningProgressService);
  private readonly prologue = signal(readStored(PROLOGUE_KEY) === '1');

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
      writeStored(PROLOGUE_KEY, '1');
    }
  }
}
