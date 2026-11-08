/**
 * Snippets neutrales del ejemplo 02 (el hilo principal). No hay worker: el código
 * muestra la fila de tareas de main y qué le pasa cuando una tarea no termina.
 */
export const MAIN_THREAD_SNIPPETS: Record<string, string> = {
  'bloquear-main.ts': `// Un bucle síncrono ocupa a main hasta que termina. Mientras tanto no
// repinta, no anima y no atiende ni un clic.
function bloquearMain(ms) {
  const fin = performance.now() + ms;
  while (performance.now() < fin) { /* main ocupado */ }
}

bloquearMain(2500); // ← 2,5 s de página congelada`,

  'la-fila.ts': `// Los clics no se pierden: el navegador los pone en la fila de tareas
// (el event loop) y main los atiende recién al terminar lo que estaba haciendo.
document.addEventListener('pointerdown', (e) => {
  const atraso = performance.now() - e.timeStamp; // cuánto esperó en la fila
  console.log(\`clic atendido \${Math.round(atraso)} ms tarde\`);
});

bloquearMain(2500); // los clics de estos 2,5 s quedan esperando`,

  'trocear.ts': `// Si el trabajo tiene que quedarse en main, cortarlo en pedazos deja que la
// fila avance entre uno y otro. Si es pesado de verdad, va a un worker.
async function procesar(items) {
  for (const [i, item] of items.entries()) {
    hacerAlgo(item);
    if (i % 500 === 0) await new Promise((r) => setTimeout(r)); // cede el turno
  }
}`,
};
