import { afterEach, beforeEach, vi } from 'vitest';
import { createCounter, CounterTick } from './counter.worker.logic';

describe('counter worker logic', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits incrementing ticks on the requested interval', () => {
    const ticks: CounterTick[] = [];
    let clock = 0;
    const counter = createCounter((t) => ticks.push(t), () => clock);

    counter.start(100);
    clock = 100;
    vi.advanceTimersByTime(100);
    clock = 200;
    vi.advanceTimersByTime(100);

    expect(ticks.map((t) => t.tick)).toEqual([1, 2]);
    expect(ticks[1]).toEqual({ type: 'tick', tick: 2, at: 200 });
  });

  it('stops emitting after stop()', () => {
    const ticks: CounterTick[] = [];
    const counter = createCounter((t) => ticks.push(t), () => 0);

    counter.start(100);
    vi.advanceTimersByTime(100);
    counter.stop();
    vi.advanceTimersByTime(500);

    expect(ticks).toHaveLength(1);
  });

  it('reset() returns the count to zero', () => {
    const ticks: CounterTick[] = [];
    const counter = createCounter((t) => ticks.push(t), () => 0);

    counter.start(100);
    vi.advanceTimersByTime(200); // ticks 1, 2
    counter.reset();
    counter.start(100);
    vi.advanceTimersByTime(100); // tick 1 again

    expect(ticks.map((t) => t.tick)).toEqual([1, 2, 1]);
  });
});
