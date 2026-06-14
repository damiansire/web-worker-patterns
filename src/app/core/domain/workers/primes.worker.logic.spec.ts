import { countPrimesUpTo } from './primes.worker.logic';

describe('primes worker logic', () => {
  it('counts primes up to a limit (inclusive)', () => {
    expect(countPrimesUpTo(10)).toBe(4); // 2, 3, 5, 7
    expect(countPrimesUpTo(2)).toBe(1); // 2
    expect(countPrimesUpTo(13)).toBe(6); // 2,3,5,7,11,13
  });

  it('returns 0 below the first prime', () => {
    expect(countPrimesUpTo(1)).toBe(0);
    expect(countPrimesUpTo(0)).toBe(0);
  });
});
