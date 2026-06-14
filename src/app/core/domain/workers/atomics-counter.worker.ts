/// <reference lib="webworker" />

/**
 * Worker de memoria compartida (ejemplo 12). Recibe un SharedArrayBuffer (la
 * MISMA memoria que tiene el main, no una copia) y va incrementando el entero
 * en el índice 0 con `Atomics.add`. No le manda NADA al main por postMessage:
 * el main lee esa misma memoria por su cuenta. Al llegar al target, se cierra.
 *
 * Protocolo neutral:
 *   in: { command: 'start', sab: SharedArrayBuffer, target: number, intervalMs: number }
 *   (no hay 'out': la comunicación es la memoria compartida, no mensajes)
 */
addEventListener('message', ({ data }: MessageEvent) => {
  if (data?.command !== 'start') {
    return;
  }
  const view = new Int32Array(data.sab as SharedArrayBuffer);
  const target = Number(data.target) || 100;
  const intervalMs = Number(data.intervalMs) || 60;

  const step = (): void => {
    const next = Atomics.add(view, 0, 1) + 1; // escribe en la memoria compartida
    if (next >= target) {
      self.close();
      return;
    }
    setTimeout(step, intervalMs);
  };
  setTimeout(step, intervalMs);
});
