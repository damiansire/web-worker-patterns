import { laneElapsed } from './example-layout.controller';
import { ThreadLane } from '../domain/thread-lane';

describe('laneElapsed', () => {
  it('devuelve 0 sin lanes (null o vacío)', () => {
    expect(laneElapsed(null)).toBe(0);
    expect(laneElapsed([])).toBe(0);
  });

  it('devuelve el mayor endMs entre todos los segmentos de todos los carriles', () => {
    const lanes: ThreadLane[] = [
      {
        id: 'worker',
        label: 'worker',
        segments: [
          { startMs: 0, endMs: 500, state: 'worker' },
          { startMs: 500, endMs: 2500, state: 'worker' },
        ],
      },
      {
        id: 'main',
        label: 'main',
        segments: [{ startMs: 0, endMs: 1800, state: 'main' }],
      },
    ];
    // El reloj es el fin de la última actividad: 2500 ms (no 0, el bug original).
    expect(laneElapsed(lanes)).toBe(2500);
  });
});
