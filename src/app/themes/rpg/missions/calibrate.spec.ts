import { heavyLimit, PROBE_LIMIT } from './calibrate';

describe('calibrate: el freeze del Molinero dura lo mismo en cualquier máquina', () => {
  it('una máquina rápida cuenta más lejos que una lenta', () => {
    const fast = heavyLimit(135);
    const slow = heavyLimit(650);

    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(PROBE_LIMIT);
  });

  it('el trabajo elegido apunta al mismo tiempo de espera', () => {
    // Contar primos por división de prueba cuesta ~n^1.5: con eso se predice el freeze.
    const predicted = (probeMs: number) =>
      probeMs * Math.pow(heavyLimit(probeMs) / PROBE_LIMIT, 1.5);

    for (const probeMs of [90, 135, 300, 650]) {
      expect(predicted(probeMs), `sonda de ${probeMs} ms`).toBeGreaterThan(1900);
      expect(predicted(probeMs), `sonda de ${probeMs} ms`).toBeLessThan(2500);
    }
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
