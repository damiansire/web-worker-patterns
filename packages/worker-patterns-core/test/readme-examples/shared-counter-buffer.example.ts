import { SharedCounterBuffer, isSharedMemorySupported } from '@worker-patterns/core';

const output = document.createElement('output');
const buffer = new SharedCounterBuffer();
buffer.start(
  // Una factory, no un worker: la clase crea uno nuevo en cada arranque.
  isSharedMemorySupported()
    ? () => new Worker(new URL('./counter.worker.js', import.meta.url), { type: 'module' })
    : undefined,
  { target: 50, intervalMs: 60, pollIntervalMs: 30 },
  {
    onValue: (v) => (output.value = String(v)),
    onFinish: (v) => (output.value = `listo: ${v}`),
    onError: () => (output.value = 'el worker productor fallo'),
  },
);
output.value = String(buffer.value); // valor actual
buffer.stop(); // frena timers y termina el worker
