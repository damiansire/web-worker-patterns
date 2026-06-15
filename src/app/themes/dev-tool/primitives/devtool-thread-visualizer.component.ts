import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThreadLane, ThreadSegment } from '../../../core/services/thread-monitor.service';
import { ThreadVisualizerContract } from '../../../ui-contracts/thread-visualizer.contract';

/**
 * ThreadVisualizer dev-tool: timeline tipo profiler/terminal. Carriles finos con
 * segmentos coloreados por estado y un eje de tiempo. Lee solo tokens semánticos.
 */
@Component({
  selector: 'devtool-thread-visualizer',
  imports: [DecimalPipe],
  template: `
    <div class="dt-viz">
      @for (lane of lanes(); track lane.id) {
        <div class="dt-lane">
          <span class="dt-lane-label">{{ lane.label }}</span>
          <div class="dt-track">
            @for (seg of lane.segments; track $index) {
              <span class="dt-seg" [attr.data-state]="seg.state" [style.flexGrow]="grow(seg)"></span>
            }
          </div>
        </div>
      }
      <div class="dt-axis">
        <span>0</span>
        <span>{{ elapsedMs() | number: '1.0-0' }}ms</span>
      </div>
    </div>
  `,
  styles: [
    `
      .dt-viz {
        font-family: var(--font-mono);
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        padding: 12px;
        display: grid;
        gap: 6px;
      }
      .dt-lane {
        display: grid;
        grid-template-columns: 80px 1fr;
        align-items: center;
        gap: 10px;
      }
      .dt-lane-label {
        font-size: 11px;
        color: var(--ink-muted);
      }
      .dt-track {
        display: flex;
        gap: 1px;
        height: 14px;
        background: var(--thread-idle);
        border-radius: 2px;
        overflow: hidden;
      }
      .dt-seg {
        flex: 1 1 0;
        min-width: 2px;
        background: var(--thread-idle);
        animation: wwp-seg-in 0.18s ease-out;
        transform-origin: center;
      }
      .dt-seg[data-state='main'] {
        background: var(--thread-main);
      }
      .dt-seg[data-state='worker'] {
        background: var(--thread-worker);
      }
      .dt-seg[data-state='blocked'] {
        background: var(--thread-blocked);
      }
      .dt-axis {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: var(--ink-muted);
        padding-left: 90px;
      }
    `,
  ],
})
export class DevToolThreadVisualizer implements ThreadVisualizerContract {
  readonly lanes = input<ThreadLane[]>([]);
  readonly elapsedMs = input<number>(0);

  protected grow(seg: ThreadSegment): number {
    return Math.max(1, seg.endMs - seg.startMs);
  }
}
