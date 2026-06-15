import { TestBed } from '@angular/core/testing';
import { BRUTALIST_PROVIDERS } from './brutalist.providers';
import { THREAD_VISUALIZER } from '../../ui-contracts/thread-visualizer.contract';
import { BrutalistThreadVisualizer } from './primitives/brutalist-thread-visualizer.component';

describe('BRUTALIST_PROVIDERS', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [BRUTALIST_PROVIDERS] }));

  it('binds the thread-visualizer contract to its brutalist implementation (§5)', () => {
    expect(TestBed.inject(THREAD_VISUALIZER)).toBe(BrutalistThreadVisualizer);
  });
});
