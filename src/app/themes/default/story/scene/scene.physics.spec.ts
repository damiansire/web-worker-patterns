import { jugglePoint, MAX_STEP, seeded, spring, stepSprings } from './scene.physics';

describe('scene physics', () => {
  it('un resorte golpeado oscila y vuelve a su objetivo', () => {
    const s = spring(0, 180, 12);
    s.v = 400;
    let crossedBack = false;
    for (let i = 0; i < 400; i++) {
      stepSprings([s], 1 / 60);
      if (s.x < 0) crossedBack = true;
    }
    expect(crossedBack).toBe(true);
    expect(Math.abs(s.x)).toBeLessThan(0.01);
    expect(Math.abs(s.v)).toBeLessThan(0.1);
  });

  it('un delta enorme (hilo congelado) no lo hace explotar', () => {
    const big = spring(0);
    big.v = 50;
    stepSprings([big], 3);
    const small = spring(0);
    small.v = 50;
    stepSprings([small], MAX_STEP);
    expect(big.x).toBeCloseTo(small.x, 10);
  });

  it('el pseudoazar es determinista y queda en [0, 1)', () => {
    for (let k = 0; k < 200; k++) {
      const v = seeded(k);
      expect(v).toBe(seeded(k));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(seeded(1)).not.toBe(seeded(2));
  });

  it('la pelota pasa por arriba en la primera mitad y vuelve continua', () => {
    expect(jugglePoint(0.25).y).toBeLessThan(-150);
    expect(jugglePoint(0.75).y).toBeGreaterThan(0);
    const a = jugglePoint(0.4999);
    const b = jugglePoint(0.5001);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1);
    const end = jugglePoint(0.9999);
    const start = jugglePoint(1.0001);
    expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeLessThan(1);
  });
});
