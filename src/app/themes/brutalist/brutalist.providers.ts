import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { BrutalistThreadVisualizer } from './primitives/brutalist-thread-visualizer.component';
import { BrutalistButton } from './primitives/brutalist-button.component';
import { BrutalistCodeBlock } from './primitives/brutalist-code-block.component';

/** Registra los primitivos del theme brutalist contra sus contratos (§5). */
export const BRUTALIST_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: BrutalistThreadVisualizer },
  { provide: BUTTON, useValue: BrutalistButton },
  { provide: CODE_BLOCK, useValue: BrutalistCodeBlock },
];
