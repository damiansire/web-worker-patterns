import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThreadLane, ThreadSegment } from '../../../core/services/thread-monitor.service';
import { ThreadVisualizerContract } from '../../../ui-contracts/thread-visualizer.contract';

/**
 * ThreadVisualizer editorial: barras diagonales tipo póster (skew), un carril
 * por hilo, paleta cálida. Lee solo tokens semánticos.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'editorial-thread-visualizer',
  imports: [DecimalPipe],
  template: `
    <div class="e-viz">
      @for (lane of lanes(); track lane.id) {
        <div class="e-lane">
          <span class="e-lane-label">{{ lane.label }}</span>
          <div class="e-track">
            @for (seg of lane.segments; track $index) {
              <span class="e-seg" [attr.data-state]="seg.state" [style.flexGrow]="grow(seg)"></span>
            }
          </div>
        </div>
      }
      <p class="e-clock">elapsed · {{ elapsedMs() | number: '1.0-0' }} ms</p>
    </div>
  `,
  styles: [
    `
      .e-viz {
        display: grid;
        gap: 12px;
      }
      .e-lane {
        display: grid;
        grid-template-columns: 100px 1fr;
        align-items: center;
        gap: 16px;
      }
      .e-lane-label {
        font-family: var(--font-display);
        font-size: 13px;
        color: var(--ink-muted);
      }
      .e-track {
        display: flex;
        gap: 4px;
        height: 28px;
        transform: skewX(-12deg);
      }
      .e-seg {
        flex: 1 1 0;
        min-width: 3px;
        background: var(--thread-idle);
        border-radius: 2px;
        animation: wwp-seg-in 0.18s ease-out;
        transform-origin: center;
      }
      .e-seg[data-state='main'] {
        background: var(--thread-main);
      }
      .e-seg[data-state='worker'] {
        background: var(--thread-worker);
      }
      .e-seg[data-state='blocked'] {
        background: var(--thread-blocked);
      }
      .e-clock {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
        margin: 0;
      }
    `,
  ],
})
export class EditorialThreadVisualizer implements ThreadVisualizerContract {
  readonly lanes = input<ThreadLane[]>([]);
  readonly elapsedMs = input<number>(0);

  protected grow(seg: ThreadSegment): number {
    return Math.max(1, seg.endMs - seg.startMs);
  }
}
