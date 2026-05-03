export const SHARED_BUFFER_SNIPPETS: Record<string, any> = {
  en: {
    vanillaCreateBuffer: `// Create a SharedArrayBuffer — ALL workers see the SAME memory
const sharedBuffer = new SharedArrayBuffer(1024); // 1KB shared
const view = new Int32Array(sharedBuffer);

// Send to workers — NOT transferred, SHARED
worker1.postMessage({ buffer: sharedBuffer }); // worker1 can read/write
worker2.postMessage({ buffer: sharedBuffer }); // worker2 sees the SAME bytes
// main thread can STILL access sharedBuffer (unlike Transferable!)`,
    vanillaAtomics: `// ✅ SAFE: Atomic operations prevent race conditions
// Worker code:
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);

  for (let i = 0; i < 100000; i++) {
    // Atomics.add is an atomic read-modify-write — thread-safe!
    Atomics.add(view, 0, 1);
  }

  // Read the shared counter atomically
  const current = Atomics.load(view, 0);
  self.postMessage({ done: true, count: current });
};

// Key Atomics operations:
// Atomics.add(view, index, value)   — atomic increment
// Atomics.sub(view, index, value)   — atomic decrement
// Atomics.load(view, index)         — atomic read
// Atomics.store(view, index, value) — atomic write
// Atomics.wait(view, index, value)  — block until value changes
// Atomics.notify(view, index)       — wake waiting threads`,
    vanillaRace: `// ❌ UNSAFE: Non-atomic read-modify-write — RACE CONDITION!
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);

  for (let i = 0; i < 100000; i++) {
    // This is THREE operations, not one:
    const current = view[0];  // 1. READ
    // ← another thread can write here!
    view[0] = current + 1;    // 2. WRITE (may overwrite other thread's work)
  }
  // Result: far less than expected — updates are LOST
};

// With 4 workers × 100,000 iterations = expected 400,000
// Actual result with race: ~120,000-250,000 (unpredictable!)`
  },
  es: {
    vanillaCreateBuffer: `// Crear un SharedArrayBuffer — TODOS los workers ven la MISMA memoria
const sharedBuffer = new SharedArrayBuffer(1024); // 1KB compartido
const view = new Int32Array(sharedBuffer);

// Enviar a workers — NO se transfiere, se COMPARTE
worker1.postMessage({ buffer: sharedBuffer }); // worker1 puede leer/escribir
worker2.postMessage({ buffer: sharedBuffer }); // worker2 ve los MISMOS bytes
// ¡el main thread SIGUE pudiendo acceder a sharedBuffer (a diferencia de Transferable!)`,
    vanillaAtomics: `// ✅ SEGURO: Las operaciones atómicas previenen race conditions
// Código del Worker:
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);

  for (let i = 0; i < 100000; i++) {
    // Atomics.add es una lectura-modificación-escritura atómica — ¡thread-safe!
    Atomics.add(view, 0, 1);
  }

  const current = Atomics.load(view, 0);
  self.postMessage({ done: true, count: current });
};

// Operaciones clave de Atomics:
// Atomics.add(view, index, value)   — incremento atómico
// Atomics.load(view, index)         — lectura atómica
// Atomics.store(view, index, value) — escritura atómica
// Atomics.wait(view, index, value)  — bloquear hasta que cambie
// Atomics.notify(view, index)       — despertar threads esperando`,
    vanillaRace: `// ❌ INSEGURO: Lectura-modificación-escritura no atómica — ¡RACE CONDITION!
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);

  for (let i = 0; i < 100000; i++) {
    // Esto son TRES operaciones, no una:
    const current = view[0];  // 1. LEER
    // ← ¡otro thread puede escribir aquí!
    view[0] = current + 1;    // 2. ESCRIBIR (puede sobrescribir el trabajo del otro thread)
  }
  // Resultado: mucho menos de lo esperado — se PIERDEN actualizaciones
};

// Con 4 workers × 100,000 iteraciones = esperado 400,000
// Resultado real con race: ~120,000-250,000 (¡impredecible!)`
  },
  pt: {
    vanillaCreateBuffer: `// Criar um SharedArrayBuffer — TODOS os workers veem a MESMA memória
const sharedBuffer = new SharedArrayBuffer(1024);
const view = new Int32Array(sharedBuffer);

worker1.postMessage({ buffer: sharedBuffer }); // worker1 pode ler/escrever
worker2.postMessage({ buffer: sharedBuffer }); // worker2 vê os MESMOS bytes`,
    vanillaAtomics: `// ✅ SEGURO: Operações atômicas previnem race conditions
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);
  for (let i = 0; i < 100000; i++) {
    Atomics.add(view, 0, 1); // Atômico — thread-safe!
  }
  const current = Atomics.load(view, 0);
  self.postMessage({ done: true, count: current });
};`,
    vanillaRace: `// ❌ INSEGURO: Race condition!
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);
  for (let i = 0; i < 100000; i++) {
    const current = view[0];  // LEITURA
    view[0] = current + 1;    // ESCRITA (outro thread pode ter escrito entre as duas!)
  }
};`
  }
};
