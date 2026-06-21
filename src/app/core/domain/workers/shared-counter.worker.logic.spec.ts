import { incrementShared, readShared, reachedTarget } from './shared-counter.worker.logic';

describe('shared-counter.worker.logic (Atomics)', () => {
  function freshView(): Int32Array {
    // SharedArrayBuffer real: Node lo soporta, así ejercitamos Atomics de verdad
    // (no un mock). Es justo la capa que el FakeWorker del servicio esquivaba.
    return new Int32Array(new SharedArrayBuffer(4));
  }

  it('incrementShared hace un read-modify-write atómico y devuelve el NUEVO valor', () => {
    const view = freshView();
    expect(incrementShared(view)).toBe(1);
    expect(incrementShared(view)).toBe(2);
    expect(incrementShared(view)).toBe(3);
  });

  it('escribe en la celda 0 de la memoria compartida y readShared la lee coherente', () => {
    const view = freshView();
    incrementShared(view);
    incrementShared(view);
    expect(readShared(view)).toBe(2);
    expect(Atomics.load(view, 0)).toBe(2);
  });

  it('N incrementos sobre la MISMA vista dan exactamente N (sin pérdidas por carrera)', () => {
    const view = freshView();
    const N = 1000;
    for (let i = 0; i < N; i++) {
      incrementShared(view);
    }
    expect(readShared(view)).toBe(N);
  });

  it('dos vistas sobre el MISMO buffer ven la misma memoria (no una copia)', () => {
    const sab = new SharedArrayBuffer(4);
    const a = new Int32Array(sab);
    const b = new Int32Array(sab);
    incrementShared(a);
    // b NO se incrementó, pero comparte el backing store con a.
    expect(readShared(b)).toBe(1);
  });

  it('reachedTarget corta exactamente al alcanzar el target', () => {
    expect(reachedTarget(49, 50)).toBe(false);
    expect(reachedTarget(50, 50)).toBe(true);
    expect(reachedTarget(51, 50)).toBe(true);
  });
});
