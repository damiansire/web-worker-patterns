import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { EditorialThreadVisualizer } from './primitives/editorial-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme editorial contra su contrato (§5, resuelto por DI). */
export const EDITORIAL_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: EditorialThreadVisualizer },
];
