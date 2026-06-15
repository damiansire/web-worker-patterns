import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { NarrativeThreadVisualizer } from './primitives/narrative-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme narrative contra su contrato (§5, resuelto por DI). */
export const NARRATIVE_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: NarrativeThreadVisualizer },
];
