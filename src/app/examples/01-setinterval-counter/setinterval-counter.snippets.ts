import { code } from '../../core/utils/code-snippet.helper';

export const SETINTERVAL_COUNTER_SNIPPETS = {
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
