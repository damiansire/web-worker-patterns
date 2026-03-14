import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
  vanillaCreateWorker: code`
// El worker corre en un hilo separado; el principal queda libre para la UI
const worker = new Worker('worker.js');
`,
  vanillaSendTask: code`
// Descarga trabajo pesado: si esto corriera en el hilo principal, bloquearía la UI
const count = 50000;
worker.postMessage({ count });
`,
  vanillaProcessInWorker: code`
// La computación pesada corre aquí; el hilo principal sigue respondiendo
self.onmessage = function (e) {
  const { count } = e.data;
  const primes = calculatePrimes(count);
  self.postMessage({ primes });
};
`,
  vanillaReceiveResult: code`
// El resultado se serializa de vuelta al hilo principal; los workers no comparten memoria
worker.onmessage = function (e) {
  const primes = e.data.primes;
  console.log('Cálculo completo:', primes);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    // Hilo separado: el trabajo pesado no congela la UI
    this.worker = new Worker(
      new URL('./offloading-computation.worker', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<{ primes: number[]; count: number }>) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - (this.startTime || 0));
      this.isLoading.set(false);
      this.result.set({ primes: event.data.primes, duration, method: 'worker' });
    };

    this.worker.onerror = (error: ErrorEvent) => {
      console.error(error);
      this.isLoading.set(false);
    };
  }
}

calculateWithWorker() {
  if (!this.worker) { return; }
  const count = this.count();
  this.isLoading.set(true);
  this.result.set(null);
  this.startTime = performance.now();
  // Los datos se clonan al worker; el resultado se serializa al terminar
  this.worker.postMessage({ count });
}
`,
  workerTsFile: code`
/// offloading-computation.worker.ts
// Se ejecuta fuera del hilo principal; bloquear aquí NO bloquea la UI
addEventListener('message', (event: MessageEvent<{ count: number }>) => {
  const primes = calculatePrimes(event.data.count);
  postMessage({ primes, count: primes.length });
});
`
};

const S_en = {
  vanillaCreateWorker: code`
// Worker runs in a separate thread—main thread stays free for UI updates
const worker = new Worker('worker.js');
`,
  vanillaSendTask: code`
// Offload heavy work: if this ran on main thread, it would block the UI
const count = 50000;
worker.postMessage({ count });
`,
  vanillaProcessInWorker: code`
// Heavy computation runs here—main thread remains responsive for animations/input
self.onmessage = function (e) {
  const { count } = e.data;
  const primes = calculatePrimes(count);
  self.postMessage({ primes });
};
`,
  vanillaReceiveResult: code`
// Result is serialized back to main thread—workers can't share memory directly
worker.onmessage = function (e) {
  const primes = e.data.primes;
  console.log('Calculation complete:', primes);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    // Separate thread: CPU-heavy work won't freeze the UI
    this.worker = new Worker(
      new URL('./offloading-computation.worker', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<{ primes: number[]; count: number }>) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - (this.startTime || 0));
      this.isLoading.set(false);
      this.result.set({ primes: event.data.primes, duration, method: 'worker' });
    };

    this.worker.onerror = (error: ErrorEvent) => {
      console.error(error);
      this.isLoading.set(false);
    };
  }
}

calculateWithWorker() {
  if (!this.worker) { return; }
  const count = this.count();
  this.isLoading.set(true);
  this.result.set(null);
  this.startTime = performance.now();
  // Data is cloned to worker; result will be serialized back when done
  this.worker.postMessage({ count });
}
`,
  workerTsFile: code`
/// offloading-computation.worker.ts
// Runs off main thread—blocking here does NOT block the UI
addEventListener('message', (event: MessageEvent<{ count: number }>) => {
  const primes = calculatePrimes(event.data.count);
  postMessage({ primes, count: primes.length });
});
`
};

const S_pt = {
  vanillaCreateWorker: code`
// O worker roda em uma thread separada; a principal fica livre para a UI
const worker = new Worker('worker.js');
`,
  vanillaSendTask: code`
// Descarregar trabalho pesado: se rodasse na thread principal, bloquearia a UI
const count = 50000;
worker.postMessage({ count });
`,
  vanillaProcessInWorker: code`
// O cálculo pesado roda aqui; a thread principal continua responsiva
self.onmessage = function (e) {
  const { count } = e.data;
  const primes = calculatePrimes(count);
  self.postMessage({ primes });
};
`,
  vanillaReceiveResult: code`
// O resultado é serializado de volta para a thread principal; workers não compartilham memória
worker.onmessage = function (e) {
  const primes = e.data.primes;
  console.log('Cálculo completo:', primes);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    // Thread separada: trabalho pesado não congela a UI
    this.worker = new Worker(
      new URL('./offloading-computation.worker', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<{ primes: number[]; count: number }>) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - (this.startTime || 0));
      this.isLoading.set(false);
      this.result.set({ primes: event.data.primes, duration, method: 'worker' });
    };

    this.worker.onerror = (error: ErrorEvent) => {
      console.error(error);
      this.isLoading.set(false);
    };
  }
}

calculateWithWorker() {
  if (!this.worker) { return; }
  const count = this.count();
  this.isLoading.set(true);
  this.result.set(null);
  this.startTime = performance.now();
  // Os dados são clonados para o worker; o resultado é serializado ao terminar
  this.worker.postMessage({ count });
}
`,
  workerTsFile: code`
/// offloading-computation.worker.ts
// Roda fora da thread principal; bloquear aqui NÃO bloqueia a UI
addEventListener('message', (event: MessageEvent<{ count: number }>) => {
  const primes = calculatePrimes(event.data.count);
  postMessage({ primes, count: primes.length });
});
`
};

export const OFFLOADING_COMPUTATION_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
