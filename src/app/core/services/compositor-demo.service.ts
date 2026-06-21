import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { busyBlock } from '../domain/thread-demo';
import { fpsInWindow, trimOldFrames } from '../domain/workers/compositor-demo.logic';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type CompositorMode = 'idle' | 'main' | 'worker';

/**
 * Demo del compositor vs main (ejemplo 16). Corre un bucle de requestAnimationFrame
 * que (a) mide los FPS del MAIN y (b) anima una caja por JS. El mismo cómputo
 * pesado se puede disparar en el main (lo congela: la caja JS y los FPS se frenan)
 * o en un worker (el main sigue libre: todo fluido). La caja animada por CSS
 * `transform` —que vive en el compositor— sigue girando en ambos casos: esa es la
 * evidencia visible de que hay otro hilo.
 *
 * Estado en signals root (sobrevive el cambio de theme). Reloj inyectable para tests.
 */
@Injectable({ providedIn: 'root' })
export class CompositorDemoService {
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  private rafId?: number;
  private fpsTimer?: ReturnType<typeof setInterval>;
  private frames: number[] = [];
  private worker?: WorkerLike;
  /** Elemento de la caja JS: lo animamos por DOM directo (sin signal → sin change detection). */
  private jsBox?: HTMLElement;
  private angle = 0;

  /** FPS del main thread (cae a ~0 cuando el main se bloquea). Publicado ~4 veces/seg. */
  readonly mainFps = signal(0);
  /** Qué se está bloqueando ahora mismo. */
  readonly mode = signal<CompositorMode>('idle');
  /** El medidor está activo. */
  readonly metering = signal(false);

  /** El componente registra el elemento de la caja JS (no es un signal: cero CD). */
  setJsBox(el?: HTMLElement): void {
    this.jsBox = el;
  }

  /**
   * Arranca el medidor. Idempotente. CLAVE (zoneless): el bucle de rAF NO escribe
   * ningún signal — solo apila timestamps y anima la caja JS por DOM directo. Los
   * FPS se publican aparte, con un setInterval ~4 veces/seg. Así el medidor no
   * dispara change detection por frame (que saturaría el main, justo lo que el
   * ejemplo enseña a evitar). El bucle no depende de Angular en su hot path.
   */
  startMeter(): void {
    if (this.metering() || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.metering.set(true);
    this.frames = [];

    const loop = (): void => {
      const t = this.clock();
      this.frames.push(t);
      this.frames = trimOldFrames(this.frames, t);
      this.angle = (this.angle + 6) % 360;
      if (this.jsBox) {
        this.jsBox.style.transform = `rotate(${this.angle}deg)`;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);

    // Publicación de FPS desacoplada del rAF: un signal cada ~250ms, no por frame.
    this.fpsTimer = setInterval(
      () => this.mainFps.set(fpsInWindow(this.frames, this.clock())),
      250,
    );
  }

  stopMeter(): void {
    if (this.rafId !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    if (this.fpsTimer !== undefined) {
      clearInterval(this.fpsTimer);
    }
    this.rafId = undefined;
    this.fpsTimer = undefined;
    this.frames = [];
    this.metering.set(false);
    this.mainFps.set(0);
  }

  /** Bloquea el MAIN con un busy-loop síncrono: la caja JS y los FPS se congelan. */
  blockMain(durationMs = 2500): void {
    this.mode.set('main');
    busyBlock(durationMs, this.clock); // <- congela el main
    this.mode.set('idle');
  }

  /** Manda el MISMO cómputo a un worker: el main queda libre, todo sigue fluido. */
  blockWorker(example: WorkerExample, limit: number): void {
    if (this.mode() !== 'idle' || !example.workerFactory) {
      return;
    }
    this.mode.set('worker');
    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string };
      if (data?.type === 'result') {
        worker.terminate();
        this.worker = undefined;
        this.mode.set('idle');
      }
    };
    // Si el worker falla, volvemos a 'idle' igual: sin esto, mode quedaría en 'worker'
    // para siempre y el guard mode() !== 'idle' bloquearía cualquier re-corrida.
    worker.onerror = () => {
      worker.terminate();
      this.worker = undefined;
      this.mode.set('idle');
    };
    worker.postMessage({ command: 'compute', limit });
  }

  reset(): void {
    this.stopMeter();
    this.worker?.terminate();
    this.worker = undefined;
    this.mode.set('idle');
    this.angle = 0;
  }
}
