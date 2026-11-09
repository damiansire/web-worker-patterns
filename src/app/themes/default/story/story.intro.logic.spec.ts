import { describe, expect, it } from 'vitest';
import {
  advance,
  arrive,
  clampStep,
  emptyLoop,
  hiddenInQueue,
  INTRO_STEPS,
  isFrozen,
  nextStep,
  paintPhaseAt,
  PHASE_MS,
  prevStep,
  progressOf,
  QUEUE_SHOWN,
  TASK_MS,
} from './story.intro.logic';

describe('story.intro.logic', () => {
  it('lo que llega espera en la fila, en orden de llegada', () => {
    let loop = arrive(arrive(emptyLoop(), 'click'), 'timer');
    expect(loop.queue.map((t) => t.kind)).toEqual(['click', 'timer']);
    expect(loop.queue.map((t) => t.id)).toEqual([1, 2]);
    expect(loop.current).toBeNull();
    loop = arrive(loop, 'key', 'a');
    expect(loop.queue[2].label).toBe('a');
  });

  it('main toma la primera y no la suelta hasta terminarla', () => {
    const loop = arrive(arrive(emptyLoop(), 'click'), 'timer');
    const a = advance(loop, 10);
    expect(a.started.map((t) => t.kind)).toEqual(['click']);
    expect(a.finished).toEqual([]);
    expect(a.loop.current?.task.kind).toBe('click');
    expect(a.loop.queue.map((t) => t.kind)).toEqual(['timer']);
    expect(progressOf(a.loop)).toBeCloseTo(10 / TASK_MS.click);

    const b = advance(a.loop, TASK_MS.click - 10);
    expect(b.finished.map((t) => t.kind)).toEqual(['click']);
    expect(b.loop.done).toBe(1);
    // Al terminar una, toma enseguida la siguiente: el ir y venir del event loop.
    expect(b.started.map((t) => t.kind)).toEqual(['timer']);
    expect(b.loop.current?.left).toBe(TASK_MS.timer);
    expect(b.loop.queue).toEqual([]);
  });

  it('de a una: un paso largo vacía la fila en orden, sin saltear ninguna', () => {
    let loop = emptyLoop();
    for (const k of ['click', 'key', 'message'] as const) loop = arrive(loop, k);
    const all = TASK_MS.click + TASK_MS.key + TASK_MS.message;
    const step = advance(loop, all);
    expect(step.started.map((t) => t.kind)).toEqual(['click', 'key', 'message']);
    expect(step.finished.map((t) => t.kind)).toEqual(['click', 'key', 'message']);
    expect(step.loop.done).toBe(3);
    expect(step.loop.queue).toEqual([]);
  });

  it('una tarea larga congela a main: lo que llega se junta en la fila', () => {
    let loop = advance(arrive(emptyLoop(), 'long'), 100).loop;
    expect(isFrozen(loop)).toBe(true);
    for (let i = 0; i < 7; i++) loop = arrive(loop, 'click');
    const mid = advance(loop, 1000);
    expect(mid.finished).toEqual([]);
    expect(mid.loop.queue.length).toBe(7);
    expect(hiddenInQueue(mid.loop)).toBe(7 - QUEUE_SHOWN);
    // Al terminar la larga, main atiende los clics que esperaban.
    const after = advance(mid.loop, TASK_MS.long - 1100 + 7 * TASK_MS.click);
    expect(isFrozen(after.loop)).toBe(false);
    expect(after.finished.map((t) => t.kind)).toEqual(['long', ...Array(7).fill('click')]);
  });

  it('sin tareas no pasa nada y un tiempo negativo no hace retroceder', () => {
    const idle = advance(emptyLoop(), 500);
    expect(idle.loop).toEqual(emptyLoop());
    const busy = advance(arrive(emptyLoop(), 'click'), 100).loop;
    expect(advance(busy, -50).loop.current?.left).toBe(busy.current?.left);
    expect(isFrozen(emptyLoop())).toBe(false);
    expect(progressOf(emptyLoop())).toBe(0);
  });

  it('pintar va en tres pasos: estilo, layout y paint', () => {
    expect(paintPhaseAt(-1)).toBeNull();
    expect(paintPhaseAt(0)).toBe('style');
    expect(paintPhaseAt(PHASE_MS)).toBe('layout');
    expect(paintPhaseAt(PHASE_MS * 2 + 1)).toBe('paint');
    expect(paintPhaseAt(PHASE_MS * 3)).toBeNull();
    expect(paintPhaseAt(150, 100)).toBe('layout');
  });

  it('los pasos van en orden, una idea por paso, con textos cortos', () => {
    expect(INTRO_STEPS.map((s) => s.id)).toEqual([
      'hello',
      'code',
      'loop',
      'paint',
      'input',
      'freeze',
      'recap',
    ]);
    const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
    for (const s of INTRO_STEPS) {
      expect(words(s.title), s.title).toBeLessThanOrEqual(5);
      expect(s.lines.length, s.id).toBeLessThanOrEqual(2);
      for (const l of s.lines) expect(words(l), l).toBeLessThanOrEqual(10);
      expect(words(s.hint), s.hint).toBeLessThanOrEqual(9);
    }
  });

  it('se avanza y se vuelve de a un paso, sin salirse', () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(INTRO_STEPS.length - 1)).toBeNull();
    expect(prevStep(0)).toBeNull();
    expect(prevStep(3)).toBe(2);
    expect(clampStep(-4)).toBe(0);
    expect(clampStep(99)).toBe(INTRO_STEPS.length - 1);
    expect(clampStep(Number.NaN)).toBe(0);
  });
});
