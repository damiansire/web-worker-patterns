export const DEGRADATION_SNIPPETS: Record<string, any> = {
  en: {
    vanillaDetection: `// Feature detection — know what's available before choosing a strategy
function detectCapabilities() {
  return {
    workers: typeof Worker !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    atomics: typeof Atomics !== 'undefined',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    wasmSupport: typeof WebAssembly !== 'undefined',
  };
}

// Many WASM-based projects use this exact pattern:
// moduleArg = {
//   pthreadCount: globalThis.navigator?.hardwareConcurrency ?? 4,
//   sharedMemEnabled: true, // falls back if SAB unavailable
// };`,
    vanillaBlobWorker: `// Blob URL Worker — create a worker from inline code, no separate file needed!
// This technique is used in production to bypass CORS restrictions
// when loading workers as modules or from CDNs.

const workerCode = \`
  self.onmessage = function(e) {
    let result = 0;
    for (let i = 0; i < e.data.iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    self.postMessage({ result });
  };
\`;

// 1. Create a Blob with the worker code
const blob = new Blob([workerCode], { type: 'application/javascript' });

// 2. Create a URL pointing to the blob
const blobUrl = URL.createObjectURL(blob);

// 3. Create the worker from the blob URL
const worker = new Worker(blobUrl);

// 4. Clean up when done — important to free memory!
worker.onmessage = (e) => {
  URL.revokeObjectURL(blobUrl); // ← free the blob URL
  worker.terminate();
  console.log('Result:', e.data.result);
};

worker.postMessage({ iterations: 5_000_000 });`,
    vanillaAutoResolve: `// Auto-resolve: pick the best available execution mode
// This is a common pattern in WASM projects:
//   if (threading supported) { createThreadedInstance() }
//   else { createSingleThreadInstance() }

function resolveExecutionMode(capabilities) {
  if (capabilities.sharedArrayBuffer && capabilities.workers) {
    return 'shared-memory-workers'; // Best: shared memory threading
  }
  if (capabilities.workers) {
    return 'message-passing-workers'; // Good: workers with postMessage
  }
  return 'main-thread'; // Fallback: synchronous on main thread
}

async function compute(data) {
  const mode = resolveExecutionMode(detectCapabilities());

  try {
    switch (mode) {
      case 'shared-memory-workers':
        return await computeWithSharedMemory(data);
      case 'message-passing-workers':
        return await computeWithWorker(data);
      case 'main-thread':
        return computeSync(data);
    }
  } catch (err) {
    // Automatic fallback on any worker error
    console.warn('Worker failed, falling back to main thread:', err);
    return computeSync(data);
  }
}`
  },
  es: {
    vanillaDetection: `// Detección de capacidades — saber qué está disponible antes de elegir estrategia
function detectCapabilities() {
  return {
    workers: typeof Worker !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    atomics: typeof Atomics !== 'undefined',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    wasmSupport: typeof WebAssembly !== 'undefined',
  };
}

// Muchos proyectos WASM usan exactamente este patrón:
// moduleArg = {
//   pthreadCount: globalThis.navigator?.hardwareConcurrency ?? 4,
//   sharedMemEnabled: true, // degrada si SAB no está disponible
// };`,
    vanillaBlobWorker: `// Blob URL Worker — crear un worker desde código inline, ¡sin archivo separado!
// Esta técnica se usa en producción para evitar restricciones CORS
// al cargar workers como módulos o desde CDNs.

const workerCode = \`
  self.onmessage = function(e) {
    let result = 0;
    for (let i = 0; i < e.data.iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    self.postMessage({ result });
  };
\`;

// 1. Crear un Blob con el código del worker
const blob = new Blob([workerCode], { type: 'application/javascript' });

// 2. Crear una URL apuntando al blob
const blobUrl = URL.createObjectURL(blob);

// 3. Crear el worker desde la blob URL
const worker = new Worker(blobUrl);

// 4. Limpiar al terminar — ¡importante para liberar memoria!
worker.onmessage = (e) => {
  URL.revokeObjectURL(blobUrl); // ← liberar la blob URL
  worker.terminate();
  console.log('Resultado:', e.data.result);
};

worker.postMessage({ iterations: 5_000_000 });`,
    vanillaAutoResolve: `// Auto-resolver: elegir el mejor modo de ejecución disponible
// Este es un patrón común en proyectos WASM:
//   if (threading soportado) { crearInstanciaThreaded() }
//   else { crearInstanciaSingleThread() }

function resolveExecutionMode(capabilities) {
  if (capabilities.sharedArrayBuffer && capabilities.workers) {
    return 'shared-memory-workers'; // Mejor: threading con memoria compartida
  }
  if (capabilities.workers) {
    return 'message-passing-workers'; // Bueno: workers con postMessage
  }
  return 'main-thread'; // Fallback: síncrono en main thread
}

async function compute(data) {
  const mode = resolveExecutionMode(detectCapabilities());

  try {
    switch (mode) {
      case 'shared-memory-workers':
        return await computeWithSharedMemory(data);
      case 'message-passing-workers':
        return await computeWithWorker(data);
      case 'main-thread':
        return computeSync(data);
    }
  } catch (err) {
    // Fallback automático ante cualquier error del worker
    console.warn('Worker falló, cayendo a main thread:', err);
    return computeSync(data);
  }
}`
  },
  pt: {
    vanillaDetection: `// Detecção de capacidades
function detectCapabilities() {
  return {
    workers: typeof Worker !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    atomics: typeof Atomics !== 'undefined',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    wasmSupport: typeof WebAssembly !== 'undefined',
  };
}`,
    vanillaBlobWorker: `// Blob URL Worker — criar um worker a partir de código inline
const workerCode = \`
  self.onmessage = function(e) {
    let result = 0;
    for (let i = 0; i < e.data.iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    self.postMessage({ result });
  };
\`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const blobUrl = URL.createObjectURL(blob);
const worker = new Worker(blobUrl);

worker.onmessage = (e) => {
  URL.revokeObjectURL(blobUrl); // ← liberar memória
  worker.terminate();
};
worker.postMessage({ iterations: 5_000_000 });`,
    vanillaAutoResolve: `// Auto-resolver: escolher o melhor modo disponível
function resolveExecutionMode(capabilities) {
  if (capabilities.sharedArrayBuffer && capabilities.workers) {
    return 'shared-memory-workers';
  }
  if (capabilities.workers) {
    return 'message-passing-workers';
  }
  return 'main-thread';
}`
  }
};
