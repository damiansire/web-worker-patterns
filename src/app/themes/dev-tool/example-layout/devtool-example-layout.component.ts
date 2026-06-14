import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { DevToolButton } from '../primitives/devtool-button.component';
import { DevToolCodeBlock } from '../primitives/devtool-code-block.component';
import { DEVTOOL_PROVIDERS } from '../devtool.providers';

/**
 * Example-layout dev-tool. Hilos como contraste worker-vs-main (backlog #2) en
 * paneles tipo IDE; ThreadVisualizer por DI (§5) y código en el code-block del theme.
 */
@Component({
  selector: 'devtool-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, DevToolButton, DevToolCodeBlock],
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
          <section class="dt-panel">
            <header class="dt-panel-h">// worker vs main thread</header>
            <div class="dt-panel-b dt-cmp">
              <div class="dt-col">
                <h3>en un worker</h3>
                <p class="dt-sub">main libre · UI fluida</p>
                <devtool-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                  ▶ correr en worker
                </devtool-button>
                @if (workerLanes(); as wl) {
                  <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }" />
                  <p class="dt-ok">✓ {{ workerTicks() }} ticks · sin jank</p>
                } @else {
                  <p class="dt-hint">// tocá para correr en worker; el main queda libre</p>
                }
              </div>
              <div class="dt-col">
                <h3>en el main thread</h3>
                <p class="dt-sub">main bloqueado · UI congelada</p>
                <devtool-button [disabled]="phase() === 'main'" (pressed)="runMain()">▶ bloquear main</devtool-button>
                @if (mainLanes(); as ml) {
                  <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                  <p class="dt-bad">✗ congelado · {{ mainTicks() }} ticks perdidos</p>
                } @else {
                  <p class="dt-hint">// tocá: la UI se congela ~2,5s, los clicks mueren</p>
                }
              </div>
            </div>
          </section>

          @if (snippets().length) {
            <section class="dt-panel">
              <header class="dt-panel-h">// código</header>
              <div class="dt-panel-b dt-code">
                @for (snip of snippets(); track snip.label) {
                  <devtool-code-block [label]="snip.label" [code]="snip.code" />
                }
              </div>
            </section>
          }
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
        max-width: 900px;
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
      .dt-panel {
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 16px;
        overflow: hidden;
      }
      .dt-panel-h {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        padding: 8px 14px;
        background: var(--surface-raised);
        border-bottom: var(--border-width) solid var(--border);
      }
      .dt-panel-b {
        padding: 16px;
      }
      .dt-cmp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        padding: 0;
      }
      .dt-col {
        padding: 16px;
      }
      .dt-col + .dt-col {
        border-left: var(--border-width) solid var(--border);
      }
      .dt-col h3 {
        font-family: var(--font-mono);
        font-size: 13px;
        margin: 0 0 2px;
        color: var(--ink);
      }
      .dt-sub {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        margin: 0 0 12px;
      }
      .dt-col devtool-button {
        display: inline-block;
        margin-bottom: 14px;
      }
      .dt-hint {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink-muted);
      }
      .dt-ok,
      .dt-bad {
        font-family: var(--font-mono);
        font-size: 12px;
        margin: 10px 0 0;
      }
      .dt-ok {
        color: var(--accent);
      }
      .dt-bad {
        color: var(--thread-blocked);
      }
      .dt-code {
        display: grid;
        gap: 12px;
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

  protected readonly visualizer = inject(THREAD_VISUALIZER);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly example = computed(() => findExample(this.id()));
  protected readonly snippets = computed(() =>
    Object.entries(this.example()?.snippets ?? {}).map(([label, code]) => ({ label, code })),
  );

  protected readonly workerLanes = this.runner.workerLanes;
  protected readonly mainLanes = this.runner.mainLanes;
  protected readonly workerTicks = this.runner.workerTicks;
  protected readonly mainTicks = this.runner.mainTicks;
  protected readonly phase = this.runner.phase;

  runWorker(): void {
    const ex = this.example();
    if (ex) {
      this.runner.runWorkerDemo(ex);
    }
  }

  runMain(): void {
    this.runner.runMainBlockingDemo();
  }
}
