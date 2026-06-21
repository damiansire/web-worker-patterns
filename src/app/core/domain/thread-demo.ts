import { ThreadLane, ThreadSegment } from './thread-lane';

/**
 * Helpers neutrales para la demo de contraste worker vs main thread (backlog #2).
 * Construyen los carriles de cada corrida y bloquean el main a propósito. No
 * conocen themes; cada theme dibuja estos `ThreadLane[]` con su ThreadVisualizer.
 */

/** Corrida en un worker: el main queda libre (idle); el worker trabaja por tick. */
export function buildWorkerLanes(ticks: number, intervalMs: number): ThreadLane[] {
  const total = ticks * intervalMs;
  const workerSegments: ThreadSegment[] = [];
  for (let i = 0; i < ticks; i++) {
    workerSegments.push({ startMs: i * intervalMs, endMs: (i + 1) * intervalMs, state: 'worker' });
  }
  return [
    { id: 'main', label: 'Main thread', segments: [{ startMs: 0, endMs: total, state: 'idle' }] },
    { id: 'worker', label: 'Worker', segments: workerSegments },
  ];
}

/** Corrida bloqueando el main: el main está 'blocked' todo el span; sin worker. */
export function buildBlockedLanes(ticks: number, intervalMs: number): ThreadLane[] {
  const total = ticks * intervalMs;
  return [
    {
      id: 'main',
      label: 'Main thread',
      segments: [{ startMs: 0, endMs: total, state: 'blocked' }],
    },
    { id: 'worker', label: 'Worker', segments: [] },
  ];
}

/**
 * Bloquea el hilo de forma SINCRÓNICA durante `durationMs`: un busy-loop real que
 * tapa el event loop, así el navegador no puede repintar (la UI se congela). Es el
 * corazón de la demo. `now` es inyectable para tests (no spinear de verdad).
 */
export function busyBlock(durationMs: number, now: () => number = () => performance.now()): number {
  const start = now();
  let spins = 0;
  while (now() - start < durationMs) {
    spins++;
  }
  return spins;
}
