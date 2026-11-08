import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { afterNextPaint } from '../../../core/domain/thread-demo';
import { countPrimesUpTo } from '../../../core/domain/workers/primes.worker.logic';
import { DefaultButton } from '../primitives/default-button.component';
import { createHeroScene, HeroScene } from './journey-hero.scene';

/** Mismo cálculo en los dos lados: el del ejemplo 04 (contar primos). */
const LIMIT = 5_000_000;
const OFFLOAD_ID = '04-offloading-computation';

const IDLE =
  'Este es main, el hilo principal: hace malabares con cada clic, el scroll y las animaciones. Tocalo o arrastralo.';

const fmt = (n: number) => n.toLocaleString('es');

/**
 * Portada interactiva del viaje. Antes de leer nada, se prueba la idea entera:
 * el mismo cálculo pesado, una vez en el hilo principal (la página se congela
 * de verdad, la escena incluida) y otra en un worker real (main sigue jugando).
 * El dibujo y los gags viven en `journey-hero.scene.ts`; acá solo se decide qué
 * corre dónde. Sin encapsulación: la escena crea su SVG por código, y todo el
 * CSS va colgado de `.jh` para no salirse del componente.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'default-journey-hero',
  imports: [DefaultButton],
  template: `
    <div class="jh">
      <div class="jh-stage">
        <div #scene class="jh-scene" aria-hidden="true"></div>
        <div class="jh-vignette"></div>
      </div>
      <div class="jh-controls">
        <p class="jh-task">
          <strong>Tarea pesada:</strong> contar los primos hasta {{ limitLabel }}. ¿Quién la hace?
        </p>
        <div class="jh-buttons">
          <default-button (pressed)="runOnMain()">Main, el hilo principal</default-button>
          <default-button variant="solid" (pressed)="runOnWorker()">Un worker</default-button>
        </div>
        <p class="jh-caption" aria-live="polite">{{ caption() }}</p>
      </div>
    </div>
  `,
  styleUrl: './journey-hero.component.scss',
})
export class JourneyHeroComponent {
  private readonly sceneHost = viewChild.required<ElementRef<HTMLElement>>('scene');
  protected readonly limitLabel = fmt(LIMIT);
  protected readonly caption = signal(IDLE);

  private scene?: HeroScene;
  private busy = false;
  private worker?: Worker;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.scene = createHeroScene(this.sceneHost().nativeElement, calm);
    });
    destroyRef.onDestroy(() => {
      this.worker?.terminate();
      this.scene?.destroy();
    });
  }

  /** En el main: el cálculo bloquea el hilo y todo se congela, la escena también. */
  protected async runOnMain(): Promise<void> {
    const scene = this.scene;
    if (this.busy || !scene) return;
    this.busy = true;
    this.caption.set('Main ya tiene las manos ocupadas, y le cae el cálculo encima…');
    await scene.dropOnMain();
    // Diferido: el golpe tiene que llegar a pintarse antes del congelamiento.
    afterNextPaint(() => {
      const t0 = performance.now();
      const count = countPrimesUpTo(LIMIT); // acá se congela todo
      const ms = Math.round(performance.now() - t0);
      this.caption.set(
        `Contó ${fmt(count)} primos, pero la página quedó congelada ${fmt(ms)} ms, esta escena incluida: mirá el reloj y el pulso. Probá con un worker.`,
      );
      // Libre recién cuando main se recupera: los clics hechos durante el congelamiento
      // quedaron en cola y llegan ahora; no tienen que disparar otro cálculo.
      void scene.thaw().then(() => (this.busy = false));
    });
  }

  /** En un worker real: el cálculo corre en otro hilo y main sigue haciendo malabares. */
  protected async runOnWorker(): Promise<void> {
    const scene = this.scene;
    const factory = EXAMPLES.find((e) => e.id === OFFLOAD_ID)?.workerFactory;
    if (this.busy || !scene || !factory) return;
    this.busy = true;
    this.caption.set('Llega un worker y se lleva el cálculo a su propio hilo…');
    await scene.handToWorker();

    const worker = factory();
    this.worker = worker;
    const t0 = performance.now();
    const done = (reaction: Promise<void>) => {
      worker.terminate();
      this.worker = undefined;
      void reaction.then(() => (this.busy = false));
    };
    this.caption.set(
      'El worker calcula en otro hilo y main sigue con sus malabares. Tocalo mientras tanto.',
    );
    worker.onmessage = ({ data }: MessageEvent<{ type?: string; count?: number }>) => {
      if (data?.type !== 'result') return;
      const ms = Math.round(performance.now() - t0);
      const count = data.count ?? 0;
      this.caption.set(
        `Listo: ${fmt(count)} primos en ${fmt(ms)} ms, y main no soltó nada. Eso es un Web Worker.`,
      );
      done(scene.deliver(`${fmt(count)} primos`));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.caption.set(`El worker falló: ${event.message || 'error desconocido'}.`);
      done(scene.fumble());
    };
    worker.postMessage({ command: 'compute', limit: LIMIT });
  }
}
