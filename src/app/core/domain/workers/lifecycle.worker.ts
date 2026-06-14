/// <reference lib="webworker" />

/**
 * Worker de ciclo de vida (ejemplo 06): simula una tarea larga que avanza por
 * pasos y va emitiendo su progreso. No termina al instante: justamente por eso
 * sirve para mostrar qué pasa cuando el main la corta a mitad con
 * `worker.terminate()` (el setTimeout en curso muere con el worker y el trabajo
 * pendiente se pierde) frente a dejarla completar (el worker se cierra solo con
 * `self.close()`).
 *
 * Protocolo neutral:
 *   in:  { command: 'start', steps: number }
 *   out: { type: 'progress', step: number, steps: number }   // por cada paso
 *   out: { type: 'done', steps: number }                     // al completar
 */
const STEP_MS = 350;

addEventListener('message', ({ data }: MessageEvent) => {
  if (data?.command !== 'start') {
    return;
  }
  const steps = Math.max(1, Number(data.steps) || 10);
  let step = 0;

  const tick = (): void => {
    step += 1;
    postMessage({ type: 'progress', step, steps });
    if (step >= steps) {
      postMessage({ type: 'done', steps });
      self.close(); // el worker se cierra a sí mismo al terminar su trabajo
      return;
    }
    setTimeout(tick, STEP_MS);
  };

  setTimeout(tick, STEP_MS);
});
