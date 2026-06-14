import { TestBed } from '@angular/core/testing';
import { BRUTALIST_PROVIDERS } from './brutalist.providers';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { BrutalistThreadVisualizer } from './primitives/brutalist-thread-visualizer.component';
import { BrutalistButton } from './primitives/brutalist-button.component';
import { BrutalistCodeBlock } from './primitives/brutalist-code-block.component';

describe('BRUTALIST_PROVIDERS', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [BRUTALIST_PROVIDERS] }));

  it('binds each primitive contract to its brutalist implementation (§5)', () => {
    expect(TestBed.inject(THREAD_VISUALIZER)).toBe(BrutalistThreadVisualizer);
    expect(TestBed.inject(BUTTON)).toBe(BrutalistButton);
    expect(TestBed.inject(CODE_BLOCK)).toBe(BrutalistCodeBlock);
  });
});
