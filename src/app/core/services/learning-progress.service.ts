import { computed, Injectable, signal } from '@angular/core';
import { Category } from '../domain/examples/example.model';
import { findMission, MISSIONS } from '../domain/learning/missions';
import { morph, Segment } from '../domain/learning/morph';
import {
  completePath,
  doneCount,
  EMPTY_PROGRESS,
  isMissionDone,
  isPathDone,
  isRegionDone,
  isRegionOpen,
  parse,
  Progress,
  serialize,
} from '../domain/learning/progress';
import { TermId } from '../domain/learning/vocabulary';
import { readStored, writeStored } from '../utils/safe-storage';

const PROGRESS_STORAGE_KEY = 'wwp-progress';

/**
 * Progreso del alumno en el recorrido como juego, en signals root y persistido.
 * Es el adaptador delgado sobre `domain/learning`: toda la regla vive allá, acá
 * solo se guarda el valor y se lo expone reactivo. Es neutral: cualquier theme
 * puede leerlo (el vocabulario aprendido no es de ninguna presentación).
 */
@Injectable({ providedIn: 'root' })
export class LearningProgressService {
  private readonly progress = signal<Progress>(parse(readStored(PROGRESS_STORAGE_KEY)));

  readonly learned = computed<ReadonlySet<TermId>>(() => new Set(this.progress().learned));
  readonly doneCount = computed(() => doneCount(this.progress()));
  readonly total = MISSIONS.length;

  /** Registra un camino recorrido. Devuelve los términos que entraron recién ahora. */
  completePath(exampleId: string, pathId: string): TermId[] {
    const before = this.learned();
    const next = completePath(this.progress(), exampleId, pathId);
    if (next === this.progress()) {
      return [];
    }
    this.progress.set(next);
    writeStored(PROGRESS_STORAGE_KEY, serialize(next));
    return next.learned.filter((id) => !before.has(id));
  }

  isPathDone(exampleId: string, pathId: string): boolean {
    return isPathDone(this.progress(), exampleId, pathId);
  }

  isMissionDone(exampleId: string): boolean {
    const mission = findMission(exampleId);
    return mission ? isMissionDone(this.progress(), mission) : false;
  }

  isRegionDone(region: Category): boolean {
    return isRegionDone(this.progress(), region);
  }

  isRegionOpen(region: Category): boolean {
    return isRegionOpen(this.progress(), region);
  }

  /** Un texto en el idioma que le corresponde al alumno hoy. */
  morph(text: string): Segment[] {
    return morph(text, this.learned());
  }

  /** Empezar de nuevo: olvida todo lo aprendido y lo recorrido. */
  reset(): void {
    this.progress.set(EMPTY_PROGRESS);
    writeStored(PROGRESS_STORAGE_KEY, serialize(EMPTY_PROGRESS));
  }
}
