import { describe, expect, it } from 'vitest';
import {
  advance,
  arrive,
  clampStep,
  emptyLoop,
  emptyTrace,
  formatMs,
  hiddenInQueue,
  INTRO_STEPS,
  isFrozen,
  nextStep,
  paintPhaseAt,
  PHASE_MS,
  progressOf,
  QUEUE_SHOWN,
  spanMs,
  TASK_MS,
  TRACE_NOW_AT,
  TRACE_SPAN_MS,
  traceEnd,
  tracePrune,
  traceStart,
  traceStop,
} from './story.intro.logic';

describe('la línea de main', () => {
  it('cada cosa es un tramo con su comienzo y su fin', () => {
    let { trace, id } = traceStart(emptyTrace(), 'click', 'clic', 100);
    expect(trace.spans).toEqual([{ id, kind: 'click', label: 'clic', start: 100, end: null }]);
    expect(spanMs(trace.spans[0], 400)).toBe(300);
    trace = traceEnd(trace, id, 520);
    expect(trace.spans[0].end).toBe(520);
    expect(spanMs(trace.spans[0], 9999)).toBe(420);
    // Terminar dos veces no lo corre.
    expect(traceEnd(trace, id, 900).spans[0].end).toBe(520);
  });

  it('main hace de a una: empezar algo corta lo que corría', () => {
    const a = traceStart(emptyTrace(), 'code', 'línea 1', 0);
    const b = traceStart(a.trace, 'code', 'línea 2', 650);
    expect(b.trace.spans.map((s) => [s.label, s.start, s.end])).toEqual([
      ['línea 1', 0, 650],
      ['línea 2', 650, null],
    ]);
    expect(b.id).not.toBe(a.id);
  });

  it('parar corta lo que corre y no inventa un fin antes del comienzo', () => {
    const { trace } = traceStart(emptyTrace(), 'long', 'tarea larga', 500);
    expect(traceStop(trace, 2000).spans[0].end).toBe(2000);
    expect(traceStop(trace, 100).spans[0].end).toBe(500);
    const quiet = traceStop(trace, 2000);
    expect(traceStop(quiet, 3000)).toBe(quiet);
  });

  it('lo que salió por la izquierda se va; lo que corre se queda', () => {
    let { trace, id } = traceStart(emptyTrace(), 'click', 'clic', 0);
    trace = traceEnd(trace, id, 100);
    trace = traceStart(trace, 'long', 'tarea larga', 200).trace;
    const later = 100 + TRACE_SPAN_MS * TRACE_NOW_AT + 1;
    expect(tracePrune(trace, later).spans.map((s) => s.kind)).toEqual(['long']);
    expect(tracePrune(trace, 150)).toBe(trace);
  });

  it('los tiempos se leen de un vistazo', () => {
    expect(formatMs(420.4)).toBe('420 ms');
    expect(formatMs(3200)).toBe('3,2 s');
    expect(formatMs(-5)).toBe('0 ms');
  });
});

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
    expect(hiddenInQueue(mid.loop, 3)).toBe(4);
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

  it('hay un paso siguiente hasta el último, y el índice no se sale', () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(INTRO_STEPS.length - 1)).toBeNull();
    expect(clampStep(-4)).toBe(0);
    expect(clampStep(99)).toBe(INTRO_STEPS.length - 1);
    expect(clampStep(Number.NaN)).toBe(0);
  });
});
