import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { DevToolButton } from '../primitives/devtool-button.component';
import { DEVTOOL_PROVIDERS } from '../devtool.providers';

/**
 * Example-layout dev-tool. Mismo patrón contrato + DI que brutalist: resuelve el
 * ThreadVisualizer por token y lo monta con ngComponentOutlet (§5). Render IDE.
 */
@Component({
  selector: 'devtool-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, DevToolButton],
  providers: [DEVTOOL_PROVIDERS],
  template: `
    <section class="dt-ex">
      <a class="dt-back" routerLink="/t/dev-tool">← ../</a>

      @if (example(); as ex) {
        <h1>
          <span class="dt-order">{{ ex.order.toString().padStart(2, '0') }}</span> {{ ex.id }}
        </h1>
        <p class="dt-cat">{{ ex.category }}</p>

        @if (ex.workerFactory) {
          <div class="dt-controls">
            <devtool-button variant="solid" (pressed)="start()">▶ run</devtool-button>
            <devtool-button (pressed)="stop()">■ stop</devtool-button>
            <span class="dt-tick">tick={{ lastTick() }}</span>
          </div>

          <ng-container
            *ngComponentOutlet="visualizer; inputs: { lanes: lanes(), elapsedMs: elapsedMs() }"
          />
        } @else {
          <p class="dt-note">// este ejemplo todavía no expone un worker neutral</p>
        }
      } @else {
        <p class="dt-note">// ejemplo no encontrado</p>
      }
    </section>
  `,
  styles: [
    `
      .dt-ex {
        max-width: 860px;
        margin: 0 auto;
        font-family: var(--font-body);
      }
      .dt-back {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        text-decoration: none;
      }
      h1 {
        font-family: var(--font-mono);
        font-size: 18px;
        margin: 12px 0 2px;
        word-break: break-all;
      }
      .dt-order {
        color: var(--accent);
      }
      .dt-cat {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        text-transform: uppercase;
        margin: 0 0 20px;
      }
      .dt-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
      }
      .dt-tick {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
      }
      .dt-note {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
    `,
  ],
})
export class DevToolExampleLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly runner = inject(ExampleRunnerService);
  private readonly monitor = inject(ThreadMonitorService);

  protected readonly visualizer = inject(THREAD_VISUALIZER);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly example = computed(() => findExample(this.id()));
  protected readonly lanes = this.monitor.lanes;
  protected readonly elapsedMs = this.monitor.elapsedMs;
  protected readonly lastTick = this.runner.lastTick;

  start(): void {
    const ex = this.example();
    if (ex) {
      this.runner.start(ex, { intervalMs: 500 });
    }
  }

  stop(): void {
    this.runner.stop();
  }
}
