import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { DefaultThreadVisualizer } from './primitives/default-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme default contra su contrato (§5, resuelto por DI). */
export const DEFAULT_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: DefaultThreadVisualizer },
];
