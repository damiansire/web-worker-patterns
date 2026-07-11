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
 * Electro del main thread (firma del theme `default`, ver dirección visual del
 * repo). Corre un loop de `requestAnimationFrame` en el hilo principal y dibuja
 * un pulso. La clave: como VIVE en el main, cuando el main se bloquea de verdad
 * (cómputo síncrono), su propio rAF se frena y el trazo se aplana solo — el
 * demo *es* el fenómeno, no una simulación. Un gap de frame grande se pinta
 * como flatline rojo; el latido normal es verde. Lee los colores de los tokens
 * (`--thread-worker` = vivo, `--thread-blocked` = flatline) para respetar el
 * theme activo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-pulse-monitor',
  template: `<canvas
    #cv
    class="pm"
    width="720"
    height="120"
    role="img"
    [attr.aria-label]="ariaLabel()"
  ></canvas>`,
  styles: [
    `
      .pm {
        display: block;
        width: 100%;
        height: 120px;
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: calc(var(--radius) - 4px);
      }
    `,
  ],
})
export class DefaultPulseMonitor {
  /** Etiqueta accesible del monitor. */
  readonly ariaLabel = input(
    'Pulso del hilo principal: late mientras la UI responde, se aplana si se bloquea',
  );

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const cv = this.canvas().nativeElement;
      const ctx = cv.getContext('2d');
      if (!ctx) return;

      const W = cv.width;
      const H = cv.height;
      const mid = H * 0.55;
      const samples: number[] = new Array(W).fill(mid);
      const css = getComputedStyle(this.host.nativeElement);
      const live = css.getPropertyValue('--thread-worker').trim() || '#16a860';
      const dead = css.getPropertyValue('--thread-blocked').trim() || '#e5484d';
      const baseline = css.getPropertyValue('--thread-idle').trim() || 'rgba(0,0,0,0.08)';

      let last = performance.now();
      let beat = 0;
      let raf = 0;

      const push = (y: number) => {
        samples.push(y);
        if (samples.length > W) samples.shift();
      };

      const frame = (now: number) => {
        const gap = now - last;
        last = now;
        // Un gap grande = el main estuvo bloqueado: rellenamos plano (flatline).
        const froze = gap > 60;
        if (froze) {
          const n = Math.min(W, Math.round(gap / 16));
          for (let k = 0; k < n; k++) push(mid);
        }
        // Pulso periódico (pico + rebote) salvo que venga de un freeze.
        beat += gap;
        const phase = beat % 750;
        const y = phase < 40 ? mid - 36 : phase < 80 ? mid + 18 : mid + (Math.random() * 2 - 1);
        push(y);

        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = baseline;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(W, mid);
        ctx.stroke();

        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < samples.length; i++) {
          if (i === 0) ctx.moveTo(i, samples[i]);
          else ctx.lineTo(i, samples[i]);
        }
        ctx.strokeStyle = froze ? dead : live;
        ctx.stroke();

        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      destroyRef.onDestroy(() => cancelAnimationFrame(raf));
    });
  }
}
