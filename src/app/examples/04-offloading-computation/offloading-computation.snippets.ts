import { code } from '../../core/utils/code-snippet.helper';

export const OFFLOADING_COMPUTATION_SNIPPETS = {
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
  console.log('Cálculo completo:', primes);
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
