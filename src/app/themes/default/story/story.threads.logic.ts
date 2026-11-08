/**
 * Lo que muestra el panel "Hilos del navegador" de cada nivel: qué hizo cada
 * hilo (main, el worker) y qué esperó en la fila de tareas de main. Es un
 * registro inmutable (cada cambio devuelve uno nuevo, para guardarlo en un
 * signal) y la cuenta de dónde cae cada cosa en la cinta del tiempo.
 *
 * La cinta mide `SPAN_MS` de ancho y "ahora" está en `NOW_AT`: a la izquierda
 * el pasado, a la derecha el lugar donde crece la tarea que está corriendo.
 * Todos los tiempos son de `performance.now()` (los mismos que `event.timeStamp`).
 */

export type Lane = 'main' | 'worker';
/** Qué es la tarea: las tres pelotas del malabar, un trabajo largo, un tic o un mensaje. */
export type TaskKind = 'click' | 'scroll' | 'frame' | 'long' | 'tick' | 'message';

export interface ThreadTask {
  id: number;
  lane: Lane;
  kind: TaskKind;
  label: string;
  start: number;
  /** null mientras corre. */
  end: number | null;
}

/** Algo que esperó en la fila de main: cuándo llegó y cuándo main lo tomó. */
export interface QueuedTask {
  id: number;
  kind: TaskKind;
  arrived: number;
  taken: number | null;
}

export interface ThreadLog {
  tasks: readonly ThreadTask[];
  queue: readonly QueuedTask[];
  nextId: number;
}

export const SPAN_MS = 8000;
export const NOW_AT = 0.62;
/** Lo que se ve de una tarea corta: las reales duran microsegundos y no se verían. */
export const SHORT_MS = 160;

export const emptyLog = (): ThreadLog => ({ tasks: [], queue: [], nextId: 1 });

/** Empieza una tarea larga (sin fin todavía). */
export function startTask(
  log: ThreadLog,
  lane: Lane,
  kind: TaskKind,
  label: string,
  at: number,
): { log: ThreadLog; id: number } {
  const id = log.nextId;
  const task: ThreadTask = { id, lane, kind, label, start: at, end: null };
  return { log: { ...log, tasks: [...log.tasks, task], nextId: id + 1 }, id };
}

export function endTask(log: ThreadLog, id: number, at: number): ThreadLog {
  return {
    ...log,
    tasks: log.tasks.map((t) => (t.id === id && t.end === null ? { ...t, end: at } : t)),
  };
}

/** Una tarea corta, ya terminada. */
export function blip(
  log: ThreadLog,
  lane: Lane,
  kind: TaskKind,
  label: string,
  at: number,
): ThreadLog {
  const { log: next, id } = startTask(log, lane, kind, label, at);
  return endTask(next, id, at + SHORT_MS);
}

/** Algo entra a la fila de main (un clic que main no pudo atender todavía). */
export function enqueue(
  log: ThreadLog,
  kind: TaskKind,
  arrived: number,
): { log: ThreadLog; id: number } {
  const id = log.nextId;
  const item: QueuedTask = { id, kind, arrived, taken: null };
  return { log: { ...log, queue: [...log.queue, item], nextId: id + 1 }, id };
}

/** Main saca algo de la fila: sale de la fila y pasa a ser una tarea corta de main. */
export function take(log: ThreadLog, queueId: number, label: string, at: number): ThreadLog {
  const item = log.queue.find((q) => q.id === queueId);
  if (!item || item.taken !== null) return log;
  const taken = { ...log, queue: log.queue.map((q) => (q === item ? { ...q, taken: at } : q)) };
  return blip(taken, 'main', item.kind, label, at);
}

/** Cuánto esperó en la fila (o lleva esperando, si main no lo tomó). */
export const waitMs = (q: QueuedTask, now: number): number => (q.taken ?? now) - q.arrived;

/**
 * Saca lo que ya salió de la cinta por la izquierda. Lo que sigue corriendo
 * o esperando no se saca nunca.
 */
export function prune(log: ThreadLog, now: number): ThreadLog {
  const edge = now - SPAN_MS * NOW_AT - SHORT_MS;
  const tasks = log.tasks.filter((t) => t.end === null || t.end > edge);
  const queue = log.queue.filter((q) => q.taken === null || q.taken > edge);
  if (tasks.length === log.tasks.length && queue.length === log.queue.length) return log;
  return { ...log, tasks, queue };
}

/**
 * Dónde cae un instante en la cinta, en fracción de su ancho, contado desde
 * `origin` (la hora en que se armó la cinta). La cinta entera se corre con
 * `tapeOffset`: así lo que ya está dibujado no se vuelve a calcular en cada
 * cuadro, y si main se congela la cinta se frena con él.
 */
export const tapeX = (t: number, origin: number): number => NOW_AT + (t - origin) / SPAN_MS;
export const tapeOffset = (now: number, origin: number): number => -(now - origin) / SPAN_MS;

/**
 * Ancho de una tarea en fracción de la cinta. Mientras corre mide la cinta
 * entera y crece con una animación CSS de `transform` a velocidad real (un
 * ancho de cinta en `SPAN_MS`): la mueve el compositor, así que sigue creciendo
 * aunque main esté congelado. Al terminar queda con su duración real.
 */
export const taskWidth = (task: ThreadTask): number =>
  task.end === null ? 1 : Math.max(task.end - task.start, SHORT_MS) / SPAN_MS;
