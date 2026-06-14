import { TestBed } from '@angular/core/testing';
import { DEVTOOL_PROVIDERS } from './devtool.providers';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BUTTON } from '../../ui-contracts/button.contract';
import { CODE_BLOCK } from '../../ui-contracts/code-block.contract';
import { DevToolThreadVisualizer } from './primitives/devtool-thread-visualizer.component';
import { DevToolButton } from './primitives/devtool-button.component';
import { DevToolCodeBlock } from './primitives/devtool-code-block.component';

describe('DEVTOOL_PROVIDERS', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [DEVTOOL_PROVIDERS] }));

  it('binds each primitive contract to its dev-tool implementation (§5)', () => {
    expect(TestBed.inject(THREAD_VISUALIZER)).toBe(DevToolThreadVisualizer);
    expect(TestBed.inject(BUTTON)).toBe(DevToolButton);
    expect(TestBed.inject(CODE_BLOCK)).toBe(DevToolCodeBlock);
  });
});
