import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import {
  drawClock,
  ClockPalette,
  observedFrameBudgetMs,
  skippedFrames,
} from '../domain/workers/offscreen-canvas.worker.logic';
import { WorkerLike } from '../domain/workers/worker-like';

/**
 * Demo de OffscreenCanvas (ejemplo 14). Dos relojes gemelos:
 *   - worker: el <canvas> cede su control con transferControlToOffscreen() y el worker lo
 *     anima con su propio rendering loop (sigue fluido aunque el main esté bloqueado);
 *   - main: el MISMO reloj, dibujado por un requestAnimationFrame en el main thread.
 * Al bloquear el main con JS sincrónico, el reloj del main se congela y el del worker no.
 *
 * Si OffscreenCanvas no está soportado, corre los dos en el main (fallback honesto: sin
 * worker, bloquear el main congela los dos). Estado en signals root.
 */
@Injectable({ providedIn: 'root' })
export class OffscreenCanvasDemoService {
  /** Reloj inyectable para tests. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  readonly supported = signal(
    typeof HTMLCanvasElement !== 'undefined' &&
      'transferControlToOffscreen' in HTMLCanvasElement.prototype,
  );
  readonly running = signal(false);
  readonly mainBlocked = signal(false);
  readonly workerFps = signal(0);
  readonly mainFps = signal(0);
  readonly workerFrames = signal(0);
  readonly mainFrames = signal(0);
  /** Frames que el main "saltó" de golpe al volver de un bloqueo (la evidencia del congelamiento). */
  readonly skippedFrames = signal(0);

  private worker?: WorkerLike;
  private mainCtx?: CanvasRenderingContext2D | null;
  private mainPalette?: ClockPalette;
  private mainStart = 0;
  private mainFrameCount = 0;
  private rafId = 0;
  private lastReport = 0;
  private lastReportFrames = 0;
  /** En fallback, el "worker" también se dibuja en el main. */
  private fallbackCtx?: CanvasRenderingContext2D | null;
  private fallbackPalette?: ClockPalette;

  /**
   * Arranca la animación. Recibe los dos <canvas> reales del layout. Idempotente: si ya
   * estaba corriendo (p.ej. el layout se re-montó al cambiar de theme), reinicia sobre los
   * canvas nuevos.
   */
  start(
    example: WorkerExample,
    workerCanvas: HTMLCanvasElement,
    mainCanvas: HTMLCanvasElement,
  ): void {
    if (this.supported() && !example.workerFactory) {
      return;
    }
    this.teardown();

    this.mainPalette = readPalette(mainCanvas, 'main');
    this.mainCtx = mainCanvas.getContext('2d');
    this.mainStart = this.clock();
    this.mainFrameCount = 0;
    this.lastReport = this.mainStart;
    this.lastReportFrames = 0;

    if (this.supported()) {
      // El worker toma el control del canvas y lo anima en su propio hilo.
      // transferControlToOffscreen() es de una sola vez por <canvas>: si el nodo ya se
      // transfirió (re-arranque sobre el mismo elemento) tira InvalidStateError. Lo absorbemos
      // y seguimos: el reloj del main corre igual, no recreamos el worker sobre un canvas muerto.
      let offscreen: OffscreenCanvas | null = null;
      try {
        offscreen = workerCanvas.transferControlToOffscreen();
      } catch {
        offscreen = null;
      }
      if (offscreen) {
        const worker = example.workerFactory!() as unknown as WorkerLike;
        this.worker = worker;
        worker.onmessage = (event: MessageEvent) => {
          const d = event.data as { type?: string; fps?: number; frames?: number };
          if (d?.type === 'fps') {
            this.workerFps.set(d.fps ?? 0);
            this.workerFrames.set(d.frames ?? 0);
          }
        };
        worker.postMessage(
          { type: 'init', canvas: offscreen, palette: readPalette(workerCanvas, 'worker') },
          [offscreen as unknown as Transferable],
        );
      }
    } else {
      // Sin OffscreenCanvas: el "worker" también lo dibuja el main.
      this.fallbackCtx = workerCanvas.getContext('2d');
      this.fallbackPalette = readPalette(workerCanvas, 'worker');
    }

    this.running.set(true);
    this.mainBlocked.set(false);
    this.skippedFrames.set(0);
    this.rafId = requestAnimationFrame(() => this.mainFrame());
  }

  /** Bloquea el main thread con JS sincrónico: su reloj se congela; el del worker sigue. */
  blockMain(ms = 2500): void {
    if (!this.running() || this.mainBlocked()) {
      return;
    }
    this.mainBlocked.set(true);
    // Diferimos el bloqueo un macrotask para que la UI alcance a pintar el estado "bloqueado"
    // antes de que el main se congele (si bloqueáramos sincrónico, nunca se vería).
    setTimeout(() => {
      // El main está por congelarse: el rAF no va a correr durante el busy-wait, así que
      // su reporte de FPS (cada 500ms) no se actualiza y el contador quedaría mostrando el
      // valor viejo (~60) justo en el momento didáctico "main muerto". Lo forzamos a 0 YA.
      // En fallback el "worker" también lo pinta el main, así que también se congela.
      this.mainFps.set(0);
      if (this.fallbackCtx) {
        this.workerFps.set(0);
      }
      const framesBefore = this.mainFrameCount;
      const before = this.clock();
      const end = before + ms;
      while (this.clock() < end) {
        /* busy-wait: acá el main está muerto, no repinta ni responde */
      }
      this.mainBlocked.set(false);
      // Los frames que el main habría pintado durante el bloqueo. NO asumimos 60Hz fijo:
      // derivamos el presupuesto por frame de la cadencia REAL observada antes del bloqueo
      // (≈16.7ms a 60Hz, ≈8.3ms a 120Hz), así no subcontamos en pantallas de alta tasa.
      const frameBudgetMs = observedFrameBudgetMs(before - this.mainStart, framesBefore);
      const blockedMs = this.clock() - before;
      const framesPainted = this.mainFrameCount - framesBefore;
      this.skippedFrames.set(skippedFrames(blockedMs, frameBudgetMs, framesPainted));
    }, 0);
  }

  reset(): void {
    this.teardown();
    this.running.set(false);
    this.mainBlocked.set(false);
    this.workerFps.set(0);
    this.mainFps.set(0);
    this.workerFrames.set(0);
    this.mainFrames.set(0);
    this.skippedFrames.set(0);
  }

  /** Loop de render del main: dibuja el reloj del main (y en fallback, también el del worker). */
  private mainFrame(): void {
    if (!this.running()) {
      return;
    }
    const now = this.clock();
    this.mainFrameCount += 1;
    const state = { elapsedMs: now - this.mainStart, frames: this.mainFrameCount, size: 0 };

    if (this.mainCtx && this.mainPalette) {
      drawClock(this.mainCtx, { ...state, size: this.mainCtx.canvas.width }, this.mainPalette);
    }
    if (this.fallbackCtx && this.fallbackPalette) {
      drawClock(
        this.fallbackCtx,
        { ...state, size: this.fallbackCtx.canvas.width },
        this.fallbackPalette,
      );
    }

    if (now - this.lastReport >= 500) {
      const fps = Math.round(
        ((this.mainFrameCount - this.lastReportFrames) * 1000) / (now - this.lastReport),
      );
      this.mainFps.set(this.mainBlocked() ? 0 : fps);
      this.mainFrames.set(this.mainFrameCount);
      if (this.fallbackCtx) {
        this.workerFps.set(this.mainBlocked() ? 0 : fps);
        this.workerFrames.set(this.mainFrameCount);
      }
      this.lastReport = now;
      this.lastReportFrames = this.mainFrameCount;
    }
    this.rafId = requestAnimationFrame(() => this.mainFrame());
  }

  private teardown(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.worker?.postMessage({ type: 'stop' });
    this.worker?.terminate();
    this.worker = undefined;
    this.mainCtx = undefined;
    this.fallbackCtx = undefined;
  }
}

/** Resuelve los tokens semánticos del theme a colores concretos (el worker no tiene CSS). */
function readPalette(el: HTMLElement, side: 'worker' | 'main'): ClockPalette {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    surface: v('--surface-raised', v('--surface', '#fff')),
    ink: v('--ink', '#111'),
    accent: v('--accent', '#e23'),
    hand:
      side === 'worker'
        ? v('--thread-worker', v('--accent', '#2a7'))
        : v('--thread-main', v('--ink', '#888')),
    label: side === 'worker' ? 'worker' : 'main',
  };
}
