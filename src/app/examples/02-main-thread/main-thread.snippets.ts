import { code } from '../../core/utils/code-snippet.helper';

export const MAIN_THREAD_SNIPPETS = {
  vanillaCalculatePrimes: code`
function calculatePrimes(max) {
  const primes = [];
  
  for (let i = 2; primes.length < max; i++) {
    let isPrime = true;
    
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    
    if (isPrime) {
      primes.push(i);
    }
  }
  
  return primes;
}
`,
  vanillaExecuteInMain: code`
calculateButton.addEventListener('click', () => {
  // El cálculo se ejecuta directamente en el hilo principal
  const primes = calculatePrimes(50000);
  
  // ⚠️ Durante este cálculo, TODO se congela:
  // - La UI no responde
  // - Los contadores se detienen
  // - Las animaciones se pausan
});
`,
  vanillaProblem: code`
// JavaScript es single-threaded
// Solo hay UN hilo principal que ejecuta:
// 1. Código JavaScript
// 2. Renderizado de la UI
// 3. Eventos del usuario
// 4. Animaciones

// Si el hilo está ocupado calculando,
// NADA MÁS puede ejecutarse

// 💡 Solución: Web Workers
// Los Web Workers ejecutan código en un hilo separado
// y permiten que el main thread siga respondiendo
`,
  angularComponent: code`
calculateInMainThread() {
  const count = this.count();
  this.isLoading.set(true);
  
  // ⚠️ Este cálculo bloquea el hilo principal
  setTimeout(() => {
    const startTime = performance.now();
    const primes = this.calculatePrimes(count);
    const endTime = performance.now();
    
    this.isLoading.set(false);
    this.result.set({
      primes,
      duration: Math.round(endTime - startTime)
    });
  }, 100);
}

private calculatePrimes(max: number): number[] {
  const primes: number[] = [];
  
  for (let i = 2; primes.length < max; i++) {
    let isPrime = true;
    
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    
    if (isPrime) {
      primes.push(i);
    }
  }
  
  return primes;
}
`
};
