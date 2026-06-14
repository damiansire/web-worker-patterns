import { buildBlockedLanes, buildWorkerLanes, busyBlock } from './thread-demo';

describe('thread-demo', () => {
  it('buildWorkerLanes: main idle the whole span, one worker segment per tick', () => {
    const lanes = buildWorkerLanes(3, 500);
    const main = lanes.find((l) => l.id === 'main')!;
    const worker = lanes.find((l) => l.id === 'worker')!;

    expect(main.segments).toEqual([{ startMs: 0, endMs: 1500, state: 'idle' }]);
    expect(worker.segments).toHaveLength(3);
    expect(worker.segments.every((s) => s.state === 'worker')).toBe(true);
    expect(worker.segments[2]).toEqual({ startMs: 1000, endMs: 1500, state: 'worker' });
  });

  it('buildBlockedLanes: main blocked the whole span, no worker activity', () => {
    const lanes = buildBlockedLanes(4, 500);
    expect(lanes.find((l) => l.id === 'main')!.segments).toEqual([
      { startMs: 0, endMs: 2000, state: 'blocked' },
    ]);
    expect(lanes.find((l) => l.id === 'worker')!.segments).toEqual([]);
  });

  it('busyBlock spins until the injected clock passes durationMs', () => {
    let t = 0;
    const spins = busyBlock(10, () => (t += 5));
    expect(t).toBeGreaterThanOrEqual(10);
    expect(spins).toBeGreaterThanOrEqual(1);
  });
});
