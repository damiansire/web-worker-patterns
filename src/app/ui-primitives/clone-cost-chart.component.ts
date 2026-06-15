import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Gráfica neutral de costo de clonación (ejemplo 15). Es un primitivo COMPARTIDO
 * por tokens: a diferencia del ThreadVisualizer (estructuralmente distinto por
 * theme), un scatter de puntos tiene la misma estructura en todos lados y solo
 * cambia el estilo. Por eso vive fuera de `themes/` y se pinta con tokens
 * semánticos (--accent, --ink-muted, --border, --surface, --font-mono).
 *
 * No conoce el dominio: recibe puntos {x, y} ya medidos y los dibuja. El eje X es
 * el tamaño serializado (bytes), el eje Y el round-trip medido (ms).
 */
export interface CloneCostPoint {
  /** Eje X: bytes serializados del payload. */
  x: number;
  /** Eje Y: round-trip medido en ms. */
  y: number;
}

@Component({
  selector: 'wwp-clone-cost-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="cc-chart"
      [attr.viewBox]="'0 0 ' + W + ' ' + H"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- ejes -->
      <line class="cc-axis" [attr.x1]="padL" [attr.y1]="padT" [attr.x2]="padL" [attr.y2]="H - padB" />
      <line
        class="cc-axis"
        [attr.x1]="padL"
        [attr.y1]="H - padB"
        [attr.x2]="W - padR"
        [attr.y2]="H - padB"
      />

      @if (geometry(); as g) {
        <polyline class="cc-line" [attr.points]="g.polyline" />
        @for (d of g.dots; track d.key) {
          <circle class="cc-dot" [attr.cx]="d.cx" [attr.cy]="d.cy" r="3.4" />
        }
        <!-- ticks Y -->
        <text class="cc-tick" [attr.x]="padL - 6" [attr.y]="padT + 4" text-anchor="end">
          {{ g.yMaxLabel }}
        </text>
        <text class="cc-tick" [attr.x]="padL - 6" [attr.y]="H - padB" text-anchor="end">0</text>
        <!-- ticks X -->
        <text class="cc-tick" [attr.x]="padL" [attr.y]="H - padB + 14" text-anchor="start">0</text>
        <text class="cc-tick" [attr.x]="W - padR" [attr.y]="H - padB + 14" text-anchor="end">
          {{ g.xMaxLabel }}
        </text>
      } @else {
        <text class="cc-empty" [attr.x]="W / 2" [attr.y]="H / 2" text-anchor="middle">
          sin datos — medí para ver la curva
        </text>
      }

      <!-- títulos de eje -->
      <text class="cc-axislabel" [attr.x]="midX" [attr.y]="H - 2" text-anchor="middle">
        {{ xLabel() }}
      </text>
      <text class="cc-axislabel" [attr.transform]="yLabelTransform" [attr.x]="11" [attr.y]="midY" text-anchor="middle">
        {{ yLabel() }}
      </text>
    </svg>
  `,
  styles: [
    `
      .cc-chart {
        display: block;
        width: 100%;
        height: auto;
        font-family: var(--font-mono, ui-monospace, monospace);
      }
      .cc-axis {
        stroke: var(--border, rgba(0, 0, 0, 0.3));
        stroke-width: 1;
      }
      .cc-line {
        fill: none;
        stroke: var(--accent, #e63924);
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .cc-dot {
        fill: var(--accent, #e63924);
        stroke: var(--surface, #fff);
        stroke-width: 1.2;
      }
      .cc-tick {
        fill: var(--ink-muted, #666);
        font-size: 9px;
      }
      .cc-axislabel {
        fill: var(--ink-muted, #666);
        font-size: 9px;
        letter-spacing: 0.03em;
      }
      .cc-empty {
        fill: var(--ink-muted, #999);
        font-size: 11px;
      }
    `,
  ],
})
export class CloneCostChartComponent {
  readonly points = input<CloneCostPoint[]>([]);
  readonly xLabel = input('bytes serializados →');
  readonly yLabel = input('round-trip (ms) →');

  protected readonly W = 360;
  protected readonly H = 220;
  protected readonly padL = 46;
  protected readonly padR = 16;
  protected readonly padT = 14;
  protected readonly padB = 32;

  protected readonly midX = (this.padL + (this.W - this.padR)) / 2;
  protected readonly midY = (this.padT + (this.H - this.padB)) / 2;
  protected readonly yLabelTransform = `rotate(-90 11 ${this.midY})`;

  protected readonly ariaLabel = computed(() => {
    const pts = this.points();
    if (!pts.length) {
      return 'Gráfica de costo de clonación, sin datos';
    }
    const last = [...pts].sort((a, b) => a.x - b.x).at(-1)!;
    return `Costo de clonación: ${pts.length} mediciones; el payload más grande (${Math.round(last.x)} bytes) tardó ${last.y.toFixed(1)} ms`;
  });

  protected readonly geometry = computed(() => {
    const pts = [...this.points()].sort((a, b) => a.x - b.x);
    if (!pts.length) {
      return null;
    }
    const xMax = Math.max(...pts.map((p) => p.x), 1);
    const yMax = Math.max(...pts.map((p) => p.y), 1);
    const plotW = this.W - this.padL - this.padR;
    const plotH = this.H - this.padT - this.padB;
    const sx = (x: number) => this.padL + (x / xMax) * plotW;
    const sy = (y: number) => this.H - this.padB - (y / yMax) * plotH;

    const dots = pts.map((p, i) => ({
      key: `${i}:${p.x}`,
      cx: +sx(p.x).toFixed(1),
      cy: +sy(p.y).toFixed(1),
    }));
    return {
      dots,
      polyline: dots.map((d) => `${d.cx},${d.cy}`).join(' '),
      xMaxLabel: formatBytes(xMax),
      yMaxLabel: `${yMax.toFixed(yMax < 10 ? 1 : 0)} ms`,
    };
  });
}

/** Formatea bytes a B/KB/MB. Compartido por el chart y los layouts (pie de medición). */
export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (n >= 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${Math.round(n)} B`;
}
