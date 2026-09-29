import { heavyLimit, PROBE_HALF, PROBE_LIMIT, probeCost } from './calibrate';

/** Lo que tarda de verdad una cuenta: crece como n^1.5, más el arranque del worker. */
const elapsed = (limit: number, costOfProbe: number, startup: number) =>
  startup + costOfProbe * Math.pow(limit / PROBE_LIMIT, 1.5);

describe('calibrate: el freeze del Molinero dura lo mismo en cualquier máquina', () => {
  it('una máquina rápida cuenta más lejos que una lenta', () => {
    const fast = heavyLimit(135);
    const slow = heavyLimit(650);

    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(PROBE_LIMIT);
  });

  it('el trabajo elegido apunta al mismo tiempo de espera', () => {
    for (const cost of [90, 135, 300, 650]) {
      const freeze = elapsed(heavyLimit(cost), cost, 0);

      expect(freeze, `sonda de ${cost} ms`).toBeGreaterThan(1900);
      expect(freeze, `sonda de ${cost} ms`).toBeLessThan(2500);
    }
  });

  it('el arranque del worker no cuenta como trabajo', () => {
    for (const startup of [0, 40, 250]) {
      const half = elapsed(PROBE_HALF, 135, startup);
      const full = elapsed(PROBE_LIMIT, 135, startup);

      expect(probeCost(half, full), `arranque de ${startup} ms`).toBeCloseTo(135, 5);
    }
  });

  it('sin una resta que sirva, usa lo medido de punta a punta', () => {
    expect(probeCost(0, 180)).toBe(180);
    expect(probeCost(200, 180)).toBe(180);
    expect(probeCost(120, 0)).toBe(0);
  });

  it('nunca pide un trabajo absurdo', () => {
    expect(heavyLimit(1)).toBe(12_000_000);
    expect(heavyLimit(60_000)).toBe(1_500_000);
  });

  it('sin una medición que sirva, usa un trabajo razonable', () => {
    expect(heavyLimit(0)).toBe(3_000_000);
    expect(heavyLimit(Number.NaN)).toBe(3_000_000);
  });
});
