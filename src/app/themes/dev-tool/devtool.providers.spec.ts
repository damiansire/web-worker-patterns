import { TestBed } from '@angular/core/testing';
import { DEVTOOL_PROVIDERS } from './devtool.providers';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { DevToolThreadVisualizer } from './primitives/devtool-thread-visualizer.component';

describe('DEVTOOL_PROVIDERS', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [DEVTOOL_PROVIDERS] }));

  it('binds the thread-visualizer contract to its dev-tool implementation (§5)', () => {
    expect(TestBed.inject(THREAD_VISUALIZER)).toBe(DevToolThreadVisualizer);
  });
});
