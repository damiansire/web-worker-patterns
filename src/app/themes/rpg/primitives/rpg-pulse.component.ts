import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

/**
 * El pulso de Main en el HUD del juego. Late mientras el hilo principal está
 * libre y se aplana en rojo si se bloqueó. No simula nada: el trazo lo dibuja un
 * `requestAnimationFrame` que vive en el main, así que cuando el main se congela
 * el pulso se congela con él, y al volver pinta plano todo lo que se perdió.
 *
 * Es la única animación ambiente del juego y se frena con la pestaña oculta.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rpg-pulse',
  template: `<canvas
    #cv
    class="p"
    width="336"
    height="56"
    role="img"
    [attr.aria-label]="label()"
  ></canvas>`,
  styles: `
    .p {
      display: block;
      width: 168px;
      height: 28px;
      border-radius: 5px;
      background: #0b0e0b;
    }
  `,
})
export class RpgPulseComponent {
  readonly label = input.required<string>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const cv = this.canvas().nativeElement;
      const ctx = cv.getContext('2d');
      if (!ctx) return;

      const W = cv.width;
      const H = cv.height;
      const STEP = 2;
      const points: { y: number; dead: boolean }[] = [];
      let last = performance.now();
      let beat = 0;
      let raf = 0;

      const push = (y: number, dead: boolean) => {
        points.push({ y, dead });
        if (points.length > W / STEP) points.shift();
      };

      const frame = (now: number) => {
        const gap = now - last;
        last = now;
        // Un hueco grande entre frames = el main estuvo bloqueado todo ese tiempo.
        if (gap > 250) {
          for (let i = 0; i < Math.min(W / STEP, gap / 16); i++) push(0, true);
        }
        beat += Math.min(gap, 50);
        const phase = beat % 900;
        push(phase < 40 ? -0.5 : phase < 80 ? 1 : phase < 120 ? -0.3 : 0, false);

        ctx.clearRect(0, 0, W, H);
        ctx.lineWidth = 3;
        for (let i = 1; i < points.length; i++) {
          ctx.strokeStyle = points[i].dead ? '#ff6b6f' : '#35c97f';
          ctx.beginPath();
          ctx.moveTo((i - 1) * STEP, H / 2 - points[i - 1].y * 18);
          ctx.lineTo(i * STEP, H / 2 - points[i].y * 18);
          ctx.stroke();
        }
        raf = requestAnimationFrame(frame);
      };

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) {
          // Volver de una pestaña oculta no es un freeze: no se pinta como tal.
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      onVisibility();

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', onVisibility);
      });
    });
  }
}
