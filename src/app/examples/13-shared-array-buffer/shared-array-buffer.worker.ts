/// <reference lib="webworker" />
console.log('🔧 SharedArrayBuffer worker started');

self.onmessage = function(e: MessageEvent<{
  action: string;
  sharedBuffer: SharedArrayBuffer;
  workerId: number;
  iterations: number;
}>) {
  const { action, sharedBuffer, workerId, iterations } = e.data;

  if (action === 'increment') {
    const view = new Int32Array(sharedBuffer);
    // Index 0: shared counter (all workers increment this)
    // Index 1+workerId: per-worker local counter
    for (let i = 0; i < iterations; i++) {
      // Atomic increment — safe even with concurrent access
      Atomics.add(view, 0, 1);
      // Non-atomic write to per-worker slot (no contention)
      view[1 + workerId] = i + 1;
    }

    // Signal completion
    self.postMessage({
      action: 'done',
      workerId,
      localCount: iterations,
      sharedCount: Atomics.load(view, 0)
    });
  }

  if (action === 'race-unsafe') {
    const view = new Int32Array(sharedBuffer);
    for (let i = 0; i < iterations; i++) {
      // ❌ NON-ATOMIC: read-modify-write — will lose increments under contention!
      const current = view[0];
      view[0] = current + 1;
    }
    self.postMessage({
      action: 'done',
      workerId,
      localCount: iterations,
      sharedCount: view[0]
    });
  }
};
