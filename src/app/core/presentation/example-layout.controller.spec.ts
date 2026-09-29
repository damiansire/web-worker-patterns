import { computeLimit, laneElapsed } from './example-layout.controller';
import { ThreadLane } from '../domain/thread-lane';

describe('computeLimit', () => {
  it('lo que se escribe a mano se acota: un número enorme no cuelga la página', () => {
    expect(computeLimit('3000000')).toBe(3_000_000);
    expect(computeLimit('90000000')).toBe(5_000_000);
  });

  it('quien mide la máquina antes puede pedir más', () => {
    expect(computeLimit('6400000', 12_000_000)).toBe(6_400_000);
    expect(computeLimit('90000000', 12_000_000)).toBe(12_000_000);
  });

  it('sin un número válido usa un trabajo chico', () => {
    expect(computeLimit('')).toBe(500_000);
    expect(computeLimit('-4')).toBe(500_000);
    expect(computeLimit('muchos')).toBe(500_000);
  });
});

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
