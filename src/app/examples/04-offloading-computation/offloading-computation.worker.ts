// Worker para cálculos pesados
console.log('🔧 Worker de cálculo de primos iniciado');

// Función para calcular números primos
function calculatePrimes(max: number): number[] {
  const primes: number[] = [];
  
  for (let i = 2; primes.length < max; i++) {
    let isPrime = true;
    
    // Comprobar si i es primo
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

// Escuchar mensajes del hilo principal
self.onmessage = function(e: MessageEvent<{ count: number }>) {
  const { count } = e.data;
  
  console.log(`🔢 Worker iniciando cálculo de ${count} números primos...`);
  
  // Realizar el cálculo pesado
  // Como esto se ejecuta en un hilo separado, no bloqueará la UI
  const primes = calculatePrimes(count);
  
  console.log(`✅ Worker completó el cálculo de ${primes.length} números primos`);
  console.log(`El primo más grande es: ${primes[primes.length - 1]}`);
  
  // Enviar el resultado de vuelta al hilo principal
  self.postMessage({
    primes: primes,
    count: primes.length
  });
};

