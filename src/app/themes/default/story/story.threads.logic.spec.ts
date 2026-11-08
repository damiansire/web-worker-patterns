import { describe, expect, it } from 'vitest';
import {
  blip,
  emptyLog,
  endTask,
  enqueue,
  NOW_AT,
  prune,
  SHORT_MS,
  SPAN_MS,
  startTask,
  take,
  taskWidth,
  tapeOffset,
  tapeX,
  waitMs,
} from './story.threads.logic';

describe('story.threads.logic', () => {
  it('una tarea larga corre sin fin y al terminar queda con su duración real', () => {
    const { log, id } = startTask(emptyLog(), 'main', 'long', 'bucle', 1000);
    expect(log.tasks[0].end).toBeNull();
    expect(taskWidth(log.tasks[0])).toBe(1);

    const done = endTask(log, id, 3500);
    expect(done.tasks[0].end).toBe(3500);
    expect(taskWidth(done.tasks[0])).toBeCloseTo(2500 / SPAN_MS);
    // Terminar dos veces no la estira.
    expect(endTask(done, id, 9000).tasks[0].end).toBe(3500);
  });

  it('una tarea corta se ve aunque dure casi nada', () => {
    const log = blip(emptyLog(), 'main', 'click', 'clic', 100);
    expect(log.tasks[0]).toEqual(
      expect.objectContaining({ lane: 'main', start: 100, end: 100 + SHORT_MS }),
    );
    expect(taskWidth(log.tasks[0])).toBeCloseTo(SHORT_MS / SPAN_MS);
  });

  it('lo que espera en la fila pasa a main al tomarlo, con lo que esperó', () => {
    const { log, id } = enqueue(emptyLog(), 'click', 1200);
    expect(waitMs(log.queue[0], 2000)).toBe(800);

    const taken = take(log, id, 'clic', 3700);
    expect(taken.queue[0].taken).toBe(3700);
    expect(waitMs(taken.queue[0], 9999)).toBe(2500);
    expect(taken.tasks).toEqual([
      expect.objectContaining({ lane: 'main', kind: 'click', start: 3700 }),
    ]);
    // Tomarlo dos veces no duplica la tarea.
    expect(take(taken, id, 'clic', 4000).tasks.length).toBe(1);
  });

  it('los ids no se repiten entre tareas y fila', () => {
    const a = startTask(emptyLog(), 'worker', 'long', 'primos', 0);
    const b = enqueue(a.log, 'click', 10);
    expect(b.id).not.toBe(a.id);
  });

  it('saca lo que ya salió por la izquierda, nunca lo que sigue corriendo o esperando', () => {
    let log = blip(emptyLog(), 'main', 'frame', '', 0);
    log = startTask(log, 'main', 'long', 'bucle', 0).log;
    log = enqueue(log, 'click', 0).log;
    const later = prune(log, 100_000);
    expect(later.tasks.map((t) => t.kind)).toEqual(['long']);
    expect(later.queue.length).toBe(1);
    // Sin cambios, el mismo registro (el signal no avisa de gusto).
    expect(prune(later, 100_000)).toBe(later);
  });

  it('"ahora" cae siempre en el mismo lugar de la pantalla', () => {
    const origin = 5000;
    for (const now of [5000, 7300, 20_000]) {
      expect(tapeX(now, origin) + tapeOffset(now, origin)).toBeCloseTo(NOW_AT);
    }
    // Un segundo antes, un segundo de cinta más a la izquierda.
    expect(tapeX(6000, origin) - tapeX(7000, origin)).toBeCloseTo(-1000 / SPAN_MS);
  });
});
