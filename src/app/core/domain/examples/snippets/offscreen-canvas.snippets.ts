/**
 * Snippets neutrales del ejemplo 14 (OffscreenCanvas).
 */
export const OFFSCREEN_CANVAS_SNIPPETS: Record<string, string> = {
  'main.ts': `// El <canvas> cede su control al worker: una sola vez e irreversible.
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
// A partir de acá el canvas queda "neutralizado" en el main:
// solo el worker puede dibujarlo.
const worker = new Worker(new URL('./clock.worker', import.meta.url), { type: 'module' });
worker.postMessage({ canvas: offscreen }, [offscreen]); // va en la transfer list`,

  'clock.worker.ts': `// Dentro del worker: su PROPIO rendering loop, sin tocar el DOM.
let ctx, start;
addEventListener('message', ({ data }) => {
  ctx = data.canvas.getContext('2d');
  start = performance.now();
  requestAnimationFrame(frame); // requestAnimationFrame también existe en el worker
});

function frame() {
  const t = performance.now() - start;
  draw(ctx, t);              // el main puede estar bloqueado: a este loop no le importa
  requestAnimationFrame(frame);
}`,
};
