/**
 * El nivel de entrada, "Conocé a main": qué es el hilo principal y de qué se
 * encarga, en pasos cortos (un paso, una idea). No hay nada que superar: se
 * mira, se toca y se sigue. Lógica pura (se testea sin TestBed); el dibujo y
 * las animaciones viven en `story-intro.component`.
 *
 * El corazón es una fila de tareas de juguete: lo que llega espera en la fila,
 * main toma la primera, la termina y toma la siguiente (el event loop). Los
 * tiempos están estirados para que se vea; en el navegador un clic tarda menos
 * de un milisegundo. Mientras main hace una tarea larga no toma otra y tampoco
 * pinta: la pantalla queda quieta y los clics se juntan en la fila.
 */

/** Qué puede llegar a la fila de main. */
export type IntroTaskKind = 'click' | 'key' | 'timer' | 'message' | 'long';

export interface IntroTask {
  id: number;
  kind: IntroTaskKind;
  /** Lo que dice la tarjeta en la fila. */
  label: string;
  /** Cuánto tarda main en hacerla, en ms (estirado para que se vea). */
  ms: number;
}

export interface MainLoop {
  /** Lo que espera, en orden de llegada: la primera es la próxima. */
  queue: readonly IntroTask[];
  /** Lo que main está haciendo ahora y cuánto le falta. */
  current: { task: IntroTask; left: number } | null;
  /** Cuántas tareas terminó. */
  done: number;
  nextId: number;
}

/** Cuánto tarda cada tipo de tarea en la fila de juguete. */
export const TASK_MS: Record<IntroTaskKind, number> = {
  click: 420,
  key: 300,
  timer: 560,
  message: 560,
  long: 3200,
};

const LABELS: Record<IntroTaskKind, string> = {
  click: 'clic',
  key: 'tecla',
  timer: 'timer',
  message: 'mensaje',
  long: 'tarea larga',
};

/** Más que esto no entra en la fila dibujada: lo que sobra se cuenta aparte. */
export const QUEUE_SHOWN = 5;

export function emptyLoop(): MainLoop {
  return { queue: [], current: null, done: 0, nextId: 1 };
}

/** Algo llega a la fila de main. */
export function arrive(loop: MainLoop, kind: IntroTaskKind, label = LABELS[kind]): MainLoop {
  const task: IntroTask = { id: loop.nextId, kind, label, ms: TASK_MS[kind] };
  return { ...loop, queue: [...loop.queue, task], nextId: loop.nextId + 1 };
}

export interface LoopStep {
  loop: MainLoop;
  /** Lo que main tomó de la fila en este paso. */
  started: IntroTask[];
  /** Lo que main terminó en este paso. */
  finished: IntroTask[];
}

/**
 * Avanza el reloj `dtMs`. Main termina lo que tiene entre manos y, si le sobra
 * tiempo, toma la próxima de la fila: de a una, nunca dos a la vez. Un paso
 * enorme (la pestaña estuvo dormida) puede vaciar varias.
 */
export function advance(loop: MainLoop, dtMs: number): LoopStep {
  let { queue, current, done } = loop;
  const started: IntroTask[] = [];
  const finished: IntroTask[] = [];
  let budget = Math.max(0, dtMs);
  for (;;) {
    if (!current) {
      if (!queue.length) break;
      current = { task: queue[0], left: queue[0].ms };
      queue = queue.slice(1);
      started.push(current.task);
    }
    if (current.left > budget) {
      current = { ...current, left: current.left - budget };
      break;
    }
    budget -= current.left;
    finished.push(current.task);
    done++;
    current = null;
  }
  return { loop: { ...loop, queue, current, done }, started, finished };
}

/** Main está trabado con algo largo: no atiende la fila ni pinta. */
export function isFrozen(loop: MainLoop): boolean {
  return loop.current?.task.kind === 'long';
}

/** Cuánto lleva de lo que está haciendo, de 0 a 1. */
export function progressOf(loop: MainLoop): number {
  const c = loop.current;
  return c ? 1 - c.left / c.task.ms : 0;
}

/** Lo que espera y no entra en la fila dibujada. */
export function hiddenInQueue(loop: MainLoop): number {
  return Math.max(0, loop.queue.length - QUEUE_SHOWN);
}

/**
 * Pintar, en tres pasos: el estilo (qué color y tamaño le toca a cada cosa),
 * el layout (dónde va y cuánto ocupa) y el paint (llenar los píxeles).
 */
export type PaintPhase = 'style' | 'layout' | 'paint';
export const PAINT_PHASES: readonly PaintPhase[] = ['style', 'layout', 'paint'];
/** Cuánto se muestra cada paso de pintar (estirado para que se vea). */
export const PHASE_MS = 900;

/**
 * En qué paso de pintar va, `elapsedMs` después de que algo cambió. Null antes
 * de empezar y después de terminar (la pantalla ya muestra lo nuevo).
 */
export function paintPhaseAt(elapsedMs: number, phaseMs = PHASE_MS): PaintPhase | null {
  if (elapsedMs < 0) return null;
  return PAINT_PHASES[Math.floor(elapsedMs / phaseMs)] ?? null;
}

/** Un paso del nivel: una sola idea, en pocas palabras. */
export interface IntroStep {
  id: 'hello' | 'code' | 'loop' | 'paint' | 'input' | 'freeze' | 'recap';
  /** Corto: el título del paso. */
  title: string;
  /** Lo que dice main, en una o dos frases. */
  lines: readonly string[];
  /** Qué se puede hacer en la escena. */
  hint: string;
}

export const INTRO_STEPS: readonly IntroStep[] = [
  {
    id: 'hello',
    title: 'Este es main',
    lines: ['Soy el hilo principal de la página.', 'Hago casi todo, de a una cosa por vez.'],
    hint: 'Tocalo para saludarlo.',
  },
  {
    id: 'code',
    title: 'Corre tu JavaScript',
    lines: ['Leo tu código línea por línea.', 'Hasta no terminar una, no empiezo otra.'],
    hint: 'Arrastrá el código hasta main, o tocalo.',
  },
  {
    id: 'loop',
    title: 'La fila de tareas',
    lines: ['Lo que llega espera en una fila.', 'Tomo una, la termino y tomo la siguiente.'],
    hint: 'Mandale tareas y mirá la fila.',
  },
  {
    id: 'paint',
    title: 'Pinta la pantalla',
    lines: [
      'Cuando algo cambia, vuelvo a pintar.',
      'Primero el estilo, después el lugar, y el color.',
    ],
    hint: 'Cambiá la caja y mirá los tres pasos.',
  },
  {
    id: 'input',
    title: 'Atiende clics y teclas',
    lines: ['Cada clic y cada tecla es una tarea.', 'Si estoy libre, respondo enseguida.'],
    hint: 'Tocá el corazón o escribí con el teclado.',
  },
  {
    id: 'freeze',
    title: 'Una tarea larga lo congela',
    lines: [
      'Si una tarea tarda, no hago nada más.',
      'Los clics esperan y la pantalla no se pinta.',
    ],
    hint: 'Dale una tarea larga y tocá el corazón.',
  },
  {
    id: 'recap',
    title: 'Ya conocés a main',
    lines: [
      'Código, fila, pintar y clics: todo pasa por mí.',
      'Por eso lo pesado se lo paso a un worker.',
    ],
    hint: 'Seguí con el prólogo para verlo de verdad.',
  },
];

/** El paso que sigue (o null al final). */
export function nextStep(i: number, steps: readonly IntroStep[] = INTRO_STEPS): number | null {
  return i + 1 < steps.length ? i + 1 : null;
}

/** El paso anterior (o null en el primero). */
export function prevStep(i: number): number | null {
  return i > 0 ? i - 1 : null;
}

/** Un índice de paso válido, venga de donde venga (teclado, URL vieja). */
export function clampStep(i: number, steps: readonly IntroStep[] = INTRO_STEPS): number {
  return Math.min(Math.max(Math.round(i) || 0, 0), steps.length - 1);
}
