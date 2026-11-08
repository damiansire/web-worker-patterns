import { describe, expect, it } from 'vitest';
import { LOOP_STEPS, midiToHz, notesAt, resume } from './story.music.logic';

const voices = (step: number, mood: Parameters<typeof notesAt>[1]) =>
  notesAt(step, mood).map((n) => n.voice);

describe('música de los niveles', () => {
  it('la4 es 440 Hz y una octava duplica', () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880);
  });

  it('el worker solo suena cuando un worker trabaja (dos hilos, dos voces)', () => {
    for (let s = 0; s < LOOP_STEPS; s++) {
      expect(voices(s, 'main')).not.toContain('worker');
      expect(voices(s, 'worker')).toContain('worker');
    }
  });

  it('main sigue con su melodía y su bajo aunque el worker se sume', () => {
    for (let s = 0; s < LOOP_STEPS; s++) {
      const solo = notesAt(s, 'main');
      const both = notesAt(s, 'worker').filter((n) => n.voice !== 'worker');
      expect(both).toEqual(solo);
    }
  });

  it('todo está en Do mayor (sin notas que choquen)', () => {
    const scale = new Set([0, 2, 4, 5, 7, 9, 11]);
    for (let s = 0; s < LOOP_STEPS; s++) {
      for (const n of notesAt(s, 'won')) {
        if (n.voice !== 'shaker') expect(scale.has(n.midi % 12), `paso ${s}`).toBe(true);
      }
    }
  });

  it('el bajo marca cada negra y la vuelta se repite', () => {
    for (let s = 0; s < LOOP_STEPS; s += 4) expect(voices(s, 'main')).toContain('bass');
    expect(notesAt(LOOP_STEPS + 5, 'worker')).toEqual(notesAt(5, 'worker'));
  });

  it('la campanita es solo del festejo, al empezar cada compás', () => {
    const bells = (mood: 'main' | 'won') =>
      Array.from({ length: LOOP_STEPS }, (_, s) => s).filter((s) =>
        voices(s, mood).includes('bell'),
      );
    expect(bells('main')).toEqual([]);
    expect(bells('won')).toEqual([0, 16, 32, 48, 64, 80, 96, 112]);
  });

  it('después de un congelamiento salta a ahora en vez de amontonar notas', () => {
    expect(resume(10, 12)).toBe(12.05);
    expect(resume(12.1, 12)).toBe(12.1);
  });
});
