import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { BrutalistButton } from '../primitives/brutalist-button.component';
import { BrutalistCard } from '../primitives/brutalist-card.component';
import { BrutalistCodeBlock } from '../primitives/brutalist-code-block.component';
import { BRUTALIST_PROVIDERS } from '../brutalist.providers';

/**
 * Example-layout brutalista — vertical completa del ejemplo, encajada en una
 * grilla expuesta de líneas duras amarillas (header + cards comparten bordes):
 *   1. corre el worker real (ExampleRunnerService);
 *   2. visualiza los hilos resolviendo THREAD_VISUALIZER por DI (§5);
 *   3. muestra el código (snippets del registry) en el code-block del theme.
 */
@Component({
  selector: 'brutalist-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, BrutalistButton, BrutalistCard, BrutalistCodeBlock],
  providers: [BRUTALIST_PROVIDERS],
  template: `
    <section class="b-ex">
      <a class="b-back" routerLink="/t/brutalist">← INDEX</a>

      @if (example(); as ex) {
        <div class="b-frame">
          <header class="b-head">
            <span class="b-order">{{ ex.order.toString().padStart(2, '0') }}</span>
            <div class="b-head-text">
              <h1>{{ ex.id }}</h1>
              <span class="b-badge">{{ ex.category }}</span>
            </div>
          </header>

          @if (ex.workerFactory) {
            <brutalist-card title="Hilos">
              <div class="b-controls">
                <brutalist-button variant="solid" [disabled]="running()" (pressed)="start()">Start</brutalist-button>
                <brutalist-button [disabled]="!running()" (pressed)="stop()">Stop</brutalist-button>
                <span class="b-status" [class.is-running]="running()">
                  {{ running() ? '● RUNNING' : '○ IDLE' }} · TICK {{ lastTick() }}
                </span>
              </div>
              <ng-container
                *ngComponentOutlet="visualizer; inputs: { lanes: lanes(), elapsedMs: elapsedMs() }"
              />
            </brutalist-card>

            @if (snippets().length) {
              <brutalist-card title="Código">
                <div class="b-code-stack">
                  @for (snip of snippets(); track snip.label) {
                    <brutalist-code-block [label]="snip.label" [code]="snip.code" />
                  }
                </div>
              </brutalist-card>
            }
          } @else {
            <div class="b-empty">Este ejemplo todavía no expone un worker neutral.</div>
          }
        </div>
      } @else {
        <p class="b-note">Ejemplo no encontrado.</p>
      }
    </section>
  `,
  styles: [
    `
      .b-ex {
        max-width: 940px;
        margin: 0 auto;
      }
      .b-back {
        display: inline-block;
        margin-bottom: 18px;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.06em;
        color: var(--accent);
        text-decoration: none;
      }

      /* Grilla expuesta: el contenedor pone borde top/left, cada celda right/bottom.
         Las líneas duras (3px amarillas) quedan compartidas, sin dobles ni gaps. */
      .b-frame {
        border-top: var(--border-width) solid var(--border);
        border-left: var(--border-width) solid var(--border);
      }
      .b-frame > * {
        display: block;
        border-right: var(--border-width) solid var(--border);
        border-bottom: var(--border-width) solid var(--border);
      }

      .b-head {
        display: flex;
        align-items: stretch;
        gap: 18px;
        background: var(--surface-raised);
      }
      .b-order {
        display: flex;
        align-items: center;
        padding: 0 20px;
        background: var(--accent);
        color: var(--surface);
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(36px, 7vw, 64px);
        line-height: 1;
      }
      .b-head-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 16px 8px;
        min-width: 0;
      }
      .b-head-text h1 {
        margin: 0;
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(20px, 3.5vw, 34px);
        line-height: 0.95;
        letter-spacing: -0.02em;
        text-transform: uppercase;
        color: var(--ink);
        word-break: break-all;
      }
      /* Badge invertido: texto sobre bloque sólido de acento. */
      .b-badge {
        align-self: flex-start;
        padding: 3px 10px;
        background: var(--accent);
        color: var(--surface);
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .b-controls {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .b-status {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.04em;
        color: var(--ink-muted);
      }
      .b-status.is-running {
        color: var(--accent);
      }

      /* Code-blocks encajados: colapsan sus bordes 3px en una sola línea. */
      .b-code-stack > brutalist-code-block {
        display: block;
      }
      .b-code-stack > brutalist-code-block + brutalist-code-block {
        margin-top: calc(-1 * var(--border-width));
      }

      .b-empty,
      .b-note {
        padding: 20px;
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
    `,
  ],
})
export class BrutalistExampleLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly runner = inject(ExampleRunnerService);
  private readonly monitor = inject(ThreadMonitorService);

  /** Implementación del ThreadVisualizer del theme activo, resuelta por DI. */
  protected readonly visualizer = inject(THREAD_VISUALIZER);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly example = computed(() => findExample(this.id()));
  protected readonly snippets = computed(() =>
    Object.entries(this.example()?.snippets ?? {}).map(([label, code]) => ({ label, code })),
  );
  protected readonly lanes = this.monitor.lanes;
  protected readonly elapsedMs = this.monitor.elapsedMs;
  protected readonly lastTick = this.runner.lastTick;
  protected readonly running = computed(() => this.runner.runningId() === this.example()?.id);

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
