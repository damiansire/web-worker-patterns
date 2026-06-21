import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThreadLane, ThreadSegment } from '../../../core/domain/thread-lane';
import { ThreadVisualizerContract } from '../../../ui-contracts/thread-visualizer.contract';

/**
 * ThreadVisualizer brutalista: cada carril es una fila de celdas duras con borde
 * negro grueso; el estado del segmento se distingue por relleno (worker = trama
 * diagonal, blocked = rojo, idle = vacío). Lee solo tokens semánticos.
 * Implementa `ThreadVisualizerContract`: lo monta el example-layout vía DI.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'brutalist-thread-visualizer',
  imports: [DecimalPipe],
  template: `
    <div class="b-viz">
      @for (lane of lanes(); track lane.id) {
        <div class="b-lane">
          <span class="b-lane-label">{{ lane.label }}</span>
          <div class="b-track">
            @for (seg of lane.segments; track $index) {
              <span
                class="b-cell"
                [attr.data-state]="seg.state"
                [style.flexGrow]="grow(seg)"
              ></span>
            }
          </div>
        </div>
      }
      <span class="b-clock">{{ elapsedMs() | number: '1.0-0' }} ms</span>
    </div>
  `,
  styles: [
    `
      .b-viz {
        display: grid;
        gap: 8px;
        font-family: var(--font-mono);
      }
      .b-lane {
        display: grid;
        grid-template-columns: 96px 1fr;
        align-items: stretch;
        gap: 10px;
      }
      .b-lane-label {
        align-self: center;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--ink);
      }
      .b-track {
        display: flex;
        gap: 3px;
        height: 26px;
        padding: 3px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
      }
      .b-cell {
        flex: 1 1 0;
        min-width: 4px;
        background: var(--thread-idle);
        animation: wwp-seg-in 0.18s ease-out;
        transform-origin: center;
      }
      .b-cell[data-state='main'] {
        background: var(--thread-main);
      }
      .b-cell[data-state='worker'] {
        background: repeating-linear-gradient(
          45deg,
          var(--thread-worker),
          var(--thread-worker) 3px,
          var(--surface-raised) 3px,
          var(--surface-raised) 6px
        );
      }
      .b-cell[data-state='blocked'] {
        background: var(--thread-blocked);
      }
      .b-clock {
        justify-self: end;
        font-size: 11px;
        font-weight: 700;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class BrutalistThreadVisualizer implements ThreadVisualizerContract {
  readonly lanes = input<ThreadLane[]>([]);
  readonly elapsedMs = input<number>(0);

  protected grow(seg: ThreadSegment): number {
    return Math.max(1, seg.endMs - seg.startMs);
  }
}
