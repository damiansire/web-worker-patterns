import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BrutalistThreadVisualizer } from './primitives/brutalist-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme brutalist contra su contrato (§5, resuelto por DI). */
export const BRUTALIST_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: BrutalistThreadVisualizer },
];
