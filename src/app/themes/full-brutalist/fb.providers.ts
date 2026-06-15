import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { FullBrutalistThreadVisualizer } from './primitives/fb-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme full-brutalist contra su contrato (§5, resuelto por DI). */
export const FULL_BRUTALIST_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: FullBrutalistThreadVisualizer },
];
