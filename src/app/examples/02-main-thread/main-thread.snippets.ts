import { code } from '../../core/utils/code-snippet.helper';

const BASE = {
  vanillaCalculatePrimes: code`
function calculatePrimes(max) {
  const primes = [];
  for (let i = 2; primes.length < max; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) { isPrime = false; break; }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}
`,
  vanillaExecuteInMain: code`
calculateButton.addEventListener('click', () => {
  const primes = calculatePrimes(50000);
});
`,
  vanillaProblem: code`
// Single-threaded: one main thread runs JS, UI, events.
// If the thread is busy, nothing else runs. Solution: Web Workers.
`,
  angularComponent: code`
calculateInMainThread() {
  const count = this.count();
  this.isLoading.set(true);
  setTimeout(() => {
    const startTime = performance.now();
    const primes = this.calculatePrimes(count);
    this.isLoading.set(false);
    this.result.set({ primes, duration: Math.round(performance.now() - startTime) });
  }, 100);
}
private calculatePrimes(max: number): number[] {
  const primes: number[] = [];
  for (let i = 2; primes.length < max; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) { isPrime = false; break; }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}
`
};

const SNIPPETS_ES = {
  ...BASE,
  vanillaExecuteInMain: code`
calculateButton.addEventListener('click', () => {
  // El cálculo se ejecuta directamente en el hilo principal
  const primes = calculatePrimes(50000);
  // ⚠️ Durante este cálculo, la UI se congela
});
`,
  vanillaProblem: code`
// JavaScript es single-threaded. Un solo hilo ejecuta JS, UI y eventos.
// Si el hilo está ocupado, nada más puede ejecutarse. Solución: Web Workers.
`
};

const SNIPPETS_EN = {
  ...BASE,
  vanillaExecuteInMain: code`
calculateButton.addEventListener('click', () => {
  // Calculation runs directly on the main thread
  const primes = calculatePrimes(50000);
  // ⚠️ During this calculation, the UI freezes
});
`,
  vanillaProblem: code`
// JavaScript is single-threaded. One thread runs JS, UI, and events.
// If the thread is busy, nothing else can run. Solution: Web Workers.
`
};

const SNIPPETS_PT = {
  ...BASE,
  vanillaExecuteInMain: code`
calculateButton.addEventListener('click', () => {
  // O cálculo executa diretamente na thread principal
  const primes = calculatePrimes(50000);
  // ⚠️ Durante este cálculo, a UI congela
});
`,
  vanillaProblem: code`
// JavaScript é single-threaded. Uma thread executa JS, UI e eventos.
// Se a thread estiver ocupada, nada mais pode executar. Solução: Web Workers.
`
};

export const MAIN_THREAD_SNIPPETS = { es: SNIPPETS_ES, en: SNIPPETS_EN, pt: SNIPPETS_PT };
