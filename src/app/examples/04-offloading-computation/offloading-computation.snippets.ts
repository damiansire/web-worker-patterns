import { code } from '../../core/utils/code-snippet.helper';

export const OFFLOADING_COMPUTATION_SNIPPETS = {
  vanillaCreateWorker: code`
const worker = new Worker('worker.js');
`,
  vanillaSendTask: code`
const count = 50000;
worker.postMessage({ count });
`,
  vanillaProcessInWorker: code`
self.onmessage = function (e) {
  const { count } = e.data;
  const primes = calculatePrimes(count);
  self.postMessage({ primes });
};
`,
  vanillaReceiveResult: code`
worker.onmessage = function (e) {
  const primes = e.data.primes;
  console.log('Cálculo completo:', primes);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
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
  this.worker.postMessage({ count });
}
`,
  workerTsFile: code`
/// offloading-computation.worker.ts
addEventListener('message', (event: MessageEvent<{ count: number }>) => {
  const primes = calculatePrimes(event.data.count);
  postMessage({ primes, count: primes.length });
});
`
};
