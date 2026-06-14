import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { DevToolThreadVisualizer } from './primitives/devtool-thread-visualizer.component';
import { DevToolButton } from './primitives/devtool-button.component';
import { DevToolCodeBlock } from './primitives/devtool-code-block.component';

/** Registra los primitivos del theme dev-tool contra sus contratos (§5). */
export const DEVTOOL_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: DevToolThreadVisualizer },
  { provide: BUTTON, useValue: DevToolButton },
  { provide: CODE_BLOCK, useValue: DevToolCodeBlock },
];
