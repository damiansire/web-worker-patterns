/**
 * Snippets neutrales del ejemplo 16 (compositor vs main). Muestran por qué una
 * animación CSS de transform sobrevive al bloqueo del main: la maneja otro hilo.
 */
export const COMPOSITOR_SNIPPETS: Record<string, string> = {
  'compositor.css': `/* La animación de TRANSFORM la maneja el compositor (otro hilo).
   Sigue fluida a ~60fps aunque el main esté bloqueado con JS. */
.box-compositor {
  animation: girar 2s linear infinite;
}
@keyframes girar {
  to { transform: rotate(360deg); }  /* transform/opacity → compositor */
}`,

  'main-vs-worker.ts': `// MISMO cómputo pesado, dos lugares distintos.

// (a) en el MAIN: bloquea el hilo → la animación por JS y los FPS se congelan.
function bloquearMain(ms) {
  const fin = performance.now() + ms;
  while (performance.now() < fin) { /* busy-loop: nada repinta */ }
}

// (b) en un WORKER: el main queda libre → todo sigue fluido.
const worker = new Worker(new URL('./primes.worker', import.meta.url), { type: 'module' });
worker.postMessage({ command: 'compute', limit: 5_000_000 });`,

  'fps-main.ts': `// Medimos los FPS del MAIN contando frames de requestAnimationFrame.
// Si el main se bloquea, rAF no corre y el número se desploma.
let frames = [];
function loop() {
  const t = performance.now();
  frames.push(t);
  frames = frames.filter((x) => x > t - 1000); // ventana de 1s
  mostrarFps(frames.length);                    // ~60 libre · ~0 bloqueado
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);`,
};
