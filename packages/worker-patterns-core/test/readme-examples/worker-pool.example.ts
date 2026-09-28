import { WorkerPool } from '@worker-patterns/core';

const log: string[] = [];
const pool = new WorkerPool<number>(
  {
    poolSize: 4,
    tasks: [{ id: 1, payload: 100000 } /* ... */],
    workerFactory: () => new Worker(new URL('./primes.worker.js', import.meta.url)),
    buildMessage: (task) => ({ command: 'compute', limit: task.payload }),
    // Opcional: si el worker manda progreso, solo el resultado cierra la tarea.
    isTaskDone: (data) => (data as { type?: string }).type === 'result',
    stepDelayMs: 0,
  },
  {
    onDispatch: (slot, taskId) => log.push(`slot ${slot} toma T${taskId}`),
    // outcome: 'done' | 'error'; data: el event.data del resultado, o el error
    onTaskSettled: (slot, taskId, outcome, data) =>
      log.push(`T${taskId} ${outcome} en slot ${slot}: ${JSON.stringify(data)}`),
    onSlotIdle: (slot) => log.push(`slot ${slot} libre`),
    onFinish: () => log.push('pool terminado'),
  },
);

pool.start(); // hasta N workers, creados UNA vez, drenan M tareas
pool.reset(); // termina todo y limpia el estado: despues no llega ningun callback
pool.isRunning();
