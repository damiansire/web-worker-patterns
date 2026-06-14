import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThreadLane, ThreadSegment } from '../../../core/services/thread-monitor.service';
import { ThreadVisualizerContract } from '../../../ui-contracts/thread-visualizer.contract';

/**
 * ThreadVisualizer narrative: cintas redondeadas suaves, una por hilo, con
 * leyenda. Estilo revista/scrollytelling. Lee solo tokens semánticos.
 */
@Component({
  selector: 'narrative-thread-visualizer',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="n-viz">
      @for (lane of lanes(); track lane.id) {
        <figure class="n-lane">
          <figcaption>{{ lane.label }}</figcaption>
          <div class="n-ribbon">
            @for (seg of lane.segments; track $index) {
              <span class="n-seg" [attr.data-state]="seg.state" [style.flexGrow]="grow(seg)"></span>
            }
          </div>
        </figure>
      }
      <p class="n-clock">{{ elapsedMs() | number: '1.0-0' }} ms transcurridos</p>
    </div>
  `,
  styles: [
    `
      .n-viz {
        display: grid;
        gap: 16px;
      }
      .n-lane {
        margin: 0;
      }
      figcaption {
        font-family: var(--font-body);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ink-muted);
        margin-bottom: 6px;
      }
      .n-ribbon {
        display: flex;
        gap: 3px;
        height: 22px;
        padding: 3px;
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: 999px;
        overflow: hidden;
      }
      .n-seg {
        flex: 1 1 0;
        min-width: 3px;
        background: var(--thread-idle);
        border-radius: 999px;
      }
      .n-seg[data-state='main'] {
        background: var(--thread-main);
      }
      .n-seg[data-state='worker'] {
        background: var(--thread-worker);
      }
      .n-seg[data-state='blocked'] {
        background: var(--thread-blocked);
      }
      .n-clock {
        font-family: var(--font-display);
        font-size: 14px;
        color: var(--ink-muted);
        margin: 0;
      }
    `,
  ],
})
export class NarrativeThreadVisualizer implements ThreadVisualizerContract {
  readonly lanes = input<ThreadLane[]>([]);
  readonly elapsedMs = input<number>(0);

  protected grow(seg: ThreadSegment): number {
    return Math.max(1, seg.endMs - seg.startMs);
  }
}
