import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThreadLane, ThreadSegment } from '../../../core/services/thread-monitor.service';
import { ThreadVisualizerContract } from '../../../ui-contracts/thread-visualizer.contract';

/**
 * ThreadVisualizer brutalista (oscuro). El punto educativo es el CONTRASTE entre
 * hilos: el worker trabaja, el main queda libre. Por eso MAIN se dibuja vacío
 * (celdas idle transparentes sobre track negro) y WORKER con relleno sólido de
 * acento. De un vistazo se ve cuál hilo está activo. Solo tokens semánticos.
 */
@Component({
  selector: 'fb-thread-visualizer',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="b-viz">
      @for (lane of lanes(); track lane.id) {
        <div class="b-lane">
          <span class="b-lane-label" [class.is-active]="isActive(lane)">{{ lane.label }}</span>
          <div class="b-track">
            @for (seg of lane.segments; track $index) {
              <span class="b-cell" [attr.data-state]="seg.state" [style.flexGrow]="grow(seg)"></span>
            }
          </div>
        </div>
      }
      <span class="b-clock">{{ elapsedMs() | number: '1.0-0' }} MS</span>
    </div>
  `,
  styles: [
    `
      .b-viz {
        display: grid;
        gap: 10px;
        font-family: var(--font-mono);
      }
      .b-lane {
        display: grid;
        grid-template-columns: 120px 1fr;
        align-items: stretch;
        gap: 12px;
      }
      .b-lane-label {
        align-self: center;
        font-family: var(--font-display);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ink-muted);
      }
      /* El carril con actividad resalta su etiqueta en acento. */
      .b-lane-label.is-active {
        color: var(--accent);
      }
      .b-track {
        display: flex;
        gap: 2px;
        height: 30px;
        padding: 3px;
        border: var(--border-width) solid var(--border);
        background: var(--surface);
      }
      .b-cell {
        flex: 1 1 0;
        min-width: 3px;
        /* Por defecto vacío: el main (idle) se ve como track negro. */
        background: transparent;
      }
      .b-cell[data-state='worker'] {
        background: var(--thread-worker);
      }
      .b-cell[data-state='blocked'] {
        background: var(--thread-blocked);
      }
      .b-cell[data-state='main'] {
        background: var(--thread-main);
      }
      .b-clock {
        justify-self: end;
        font-family: var(--font-display);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class FullBrutalistThreadVisualizer implements ThreadVisualizerContract {
  readonly lanes = input<ThreadLane[]>([]);
  readonly elapsedMs = input<number>(0);

  protected grow(seg: ThreadSegment): number {
    return Math.max(1, seg.endMs - seg.startMs);
  }

  /** Un carril está "activo" si tiene algún segmento de trabajo (worker/blocked). */
  protected isActive(lane: ThreadLane): boolean {
    return lane.segments.some((s) => s.state === 'worker' || s.state === 'blocked');
  }
}
