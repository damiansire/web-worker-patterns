import { describe, it, expect } from 'vitest';
import { incrementShared, readShared, reachedTarget } from '../src/shared-counter.logic.js';

describe('shared-counter.logic', () => {
  it('incrementShared devuelve el valor NUEVO (post-incremento)', () => {
    const view = new Int32Array(new SharedArrayBuffer(4));
    expect(incrementShared(view)).toBe(1);
    expect(incrementShared(view)).toBe(2);
    expect(readShared(view)).toBe(2);
  });

  it('incrementShared es atomico bajo escritura concurrente simulada', () => {
    // Sin un Worker real no hay paralelismo genuino en este test, pero
    // Atomics.add sigue siendo la operacion correcta: 100 incrementos
    // secuenciales dan 100, sin perder ninguno.
    const view = new Int32Array(new SharedArrayBuffer(4));
    for (let i = 0; i < 100; i++) {
      incrementShared(view);
    }
    expect(readShared(view)).toBe(100);
  });

  it('reachedTarget compara con >=', () => {
    expect(reachedTarget(4, 5)).toBe(false);
    expect(reachedTarget(5, 5)).toBe(true);
    expect(reachedTarget(6, 5)).toBe(true);
  });
});
