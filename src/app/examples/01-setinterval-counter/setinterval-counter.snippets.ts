import { code } from '../../core/utils/code-snippet.helper';

const SNIPPETS_ES = {
  vanillaCreateCounter: code`
// Variable para almacenar el valor del contador
let contador = 0;
`,
  vanillaSetInterval: code`
// setInterval ejecuta una función cada cierto tiempo (en milisegundos)
const intervalId = setInterval(function() {
  contador++;
  document.getElementById('contador').textContent = contador;
}, 1000); // Cada 1000ms (1 segundo)
`,
  vanillaClearInterval: code`
// Para detener el intervalo, usamos clearInterval
clearInterval(intervalId);
`,
  vanillaWhyImportant: code`
// setInterval ejecuta código en el HILO PRINCIPAL
// Si el hilo principal está ocupado con cálculos pesados,
// el contador se congelará y no se actualizará.
// Esto es exactamente el problema que resuelven los Web Workers.
`,
  angularComponent: code`
counter = signal(0);
intervalId?: ReturnType<typeof setInterval>;

ngOnInit() {
  // Iniciar contador automáticamente
  this.startCounter();
}

startCounter() {
  if (this.intervalId) return;
  this.intervalId = setInterval(() => {
    this.counter.update(c => c + 1);
  }, this.speed());
}

stopCounter() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}

ngOnDestroy() {
  this.stopCounter();
}
`
};

const SNIPPETS_EN = {
  vanillaCreateCounter: code`
// Variable to store the counter value
let counter = 0;
`,
  vanillaSetInterval: code`
// setInterval runs a function every N milliseconds
const intervalId = setInterval(function() {
  counter++;
  document.getElementById('counter').textContent = counter;
}, 1000); // Every 1000ms (1 second)
`,
  vanillaClearInterval: code`
// To stop the interval, we use clearInterval
clearInterval(intervalId);
`,
  vanillaWhyImportant: code`
// setInterval runs code on the MAIN THREAD
// If the main thread is busy with heavy calculations,
// the counter will freeze and not update.
// This is exactly the problem Web Workers solve.
`,
  angularComponent: code`
counter = signal(0);
intervalId?: ReturnType<typeof setInterval>;

ngOnInit() {
  // Start counter automatically
  this.startCounter();
}

startCounter() {
  if (this.intervalId) return;
  this.intervalId = setInterval(() => {
    this.counter.update(c => c + 1);
  }, this.speed());
}

stopCounter() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}

ngOnDestroy() {
  this.stopCounter();
}
`
};

const SNIPPETS_PT = {
  vanillaCreateCounter: code`
// Variável para armazenar o valor do contador
let contador = 0;
`,
  vanillaSetInterval: code`
// setInterval executa uma função a cada N milissegundos
const intervalId = setInterval(function() {
  contador++;
  document.getElementById('contador').textContent = contador;
}, 1000); // A cada 1000ms (1 segundo)
`,
  vanillaClearInterval: code`
// Para parar o intervalo, usamos clearInterval
clearInterval(intervalId);
`,
  vanillaWhyImportant: code`
// setInterval executa código na THREAD PRINCIPAL
// Se a thread principal estiver ocupada com cálculos pesados,
// o contador congelará e não atualizará.
// Este é exatamente o problema que os Web Workers resolvem.
`,
  angularComponent: code`
counter = signal(0);
intervalId?: ReturnType<typeof setInterval>;

ngOnInit() {
  // Iniciar contador automaticamente
  this.startCounter();
}

startCounter() {
  if (this.intervalId) return;
  this.intervalId = setInterval(() => {
    this.counter.update(c => c + 1);
  }, this.speed());
}

stopCounter() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}

ngOnDestroy() {
  this.stopCounter();
}
`
};

export const SETINTERVAL_COUNTER_SNIPPETS = { es: SNIPPETS_ES, en: SNIPPETS_EN, pt: SNIPPETS_PT };
