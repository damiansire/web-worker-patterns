import { Provider } from '@angular/core';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { NarrativeThreadVisualizer } from './primitives/narrative-thread-visualizer.component';
import { NarrativeButton } from './primitives/narrative-button.component';
import { NarrativeCodeBlock } from './primitives/narrative-code-block.component';

/** Registra los primitivos del theme narrative contra sus contratos (§5). */
export const NARRATIVE_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: NarrativeThreadVisualizer },
  { provide: BUTTON, useValue: NarrativeButton },
  { provide: CODE_BLOCK, useValue: NarrativeCodeBlock },
];
