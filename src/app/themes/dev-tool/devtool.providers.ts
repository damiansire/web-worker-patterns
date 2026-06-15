import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { DevToolThreadVisualizer } from './primitives/devtool-thread-visualizer.component';

/** Registra el ThreadVisualizer del theme dev-tool contra su contrato (§5, resuelto por DI). */
export const DEVTOOL_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: DevToolThreadVisualizer },
];
