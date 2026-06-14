import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { EditorialThreadVisualizer } from './primitives/editorial-thread-visualizer.component';
import { EditorialButton } from './primitives/editorial-button.component';
import { EditorialCodeBlock } from './primitives/editorial-code-block.component';

/** Registra los primitivos del theme editorial contra sus contratos (§5). */
export const EDITORIAL_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: EditorialThreadVisualizer },
  { provide: BUTTON, useValue: EditorialButton },
  { provide: CODE_BLOCK, useValue: EditorialCodeBlock },
];
