/// <reference lib="webworker" />
import { drawClock, ClockPalette } from './offscreen-canvas.worker.logic';

/**
 * Worker del ejemplo 14 (OffscreenCanvas). Recibe el control de un <canvas> vía la transfer
 * list y corre SU PROPIO rendering loop (requestAnimationFrame existe también dentro del
 * worker para OffscreenCanvas). Dibuja el reloj sin tocar el DOM — no tiene document. Por eso
 * la animación sigue fluida aunque el main thread esté bloqueado con JS pesado.
 *
 * Protocolo:
 *   in:  { type: 'init', canvas: OffscreenCanvas, palette }
 *   in:  { type: 'stop' }
 *   out: { type: 'fps', fps: number, frames: number }   // cada ~500ms
 */

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let size = 0;
let palette: ClockPalette | null = null;
let start = 0;
let frames = 0;
let rafId = 0;
let lastReport = 0;
let lastReportFrames = 0;

function frame(): void {
  if (!ctx || !palette) {
    return;
  }
  const now = performance.now();
  frames += 1;
  drawClock(ctx, { elapsedMs: now - start, frames, size }, palette);

  // Reporte de FPS al main cada ~500ms (sin spamear un mensaje por frame).
  if (now - lastReport >= 500) {
    const fps = Math.round(((frames - lastReportFrames) * 1000) / (now - lastReport));
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ type: 'fps', fps, frames });
    lastReport = now;
    lastReportFrames = frames;
  }
  rafId = requestAnimationFrame(frame);
}

addEventListener('message', ({ data }: MessageEvent) => {
  if (data?.type === 'init') {
    const canvas = data.canvas as OffscreenCanvas;
    ctx = canvas.getContext('2d');
    size = canvas.width;
    palette = data.palette as ClockPalette;
    start = performance.now();
    frames = 0;
    lastReport = start;
    lastReportFrames = 0;
    rafId = requestAnimationFrame(frame);
  } else if (data?.type === 'stop') {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    self.close();
  }
});
