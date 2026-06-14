import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { CARD } from '../../ui-contracts/card.contract';
import { FullBrutalistThreadVisualizer } from './primitives/fb-thread-visualizer.component';
import { FullBrutalistButton } from './primitives/fb-button.component';
import { FullBrutalistCodeBlock } from './primitives/fb-code-block.component';
import { FullBrutalistCard } from './primitives/fb-card.component';

/** Registra los primitivos del theme brutalist contra sus contratos (§5). */
export const FULL_BRUTALIST_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: FullBrutalistThreadVisualizer },
  { provide: BUTTON, useValue: FullBrutalistButton },
  { provide: CODE_BLOCK, useValue: FullBrutalistCodeBlock },
  { provide: CARD, useValue: FullBrutalistCard },
];
