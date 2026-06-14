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
import { BRUTALIST_PROVIDERS } from '../brutalist.providers';

/**
 * Example-layout brutalista. Resuelve el ThreadVisualizer por el token
 * `THREAD_VISUALIZER` (provisto por BRUTALIST_PROVIDERS) y lo monta con
 * `ngComponentOutlet`, pasándole los `lanes`/`elapsedMs` neutrales del monitor:
 * exactamente el patrón contrato + DI de la §5. Corre el worker vía el runner.
 */
@Component({
  selector: 'brutalist-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, BrutalistButton],
  providers: [BRUTALIST_PROVIDERS],
  template: `
    <section class="b-ex">
      <a class="b-back" routerLink="/t/brutalist">← INDEX</a>

      @if (example(); as ex) {
        <h1>{{ ex.order }} · {{ ex.id }}</h1>
        <p class="b-cat">{{ ex.category }}</p>

        @if (ex.workerFactory) {
          <div class="b-controls">
            <brutalist-button variant="solid" (pressed)="start()">START</brutalist-button>
            <brutalist-button (pressed)="stop()">STOP</brutalist-button>
            <span class="b-tick">TICK {{ lastTick() }}</span>
          </div>

          <ng-container
            *ngComponentOutlet="visualizer; inputs: { lanes: lanes(), elapsedMs: elapsedMs() }"
          />
        } @else {
          <p class="b-note">Este ejemplo todavía no expone un worker neutral.</p>
        }
      } @else {
        <p class="b-note">Ejemplo no encontrado.</p>
      }
    </section>
  `,
  styles: [
    `
      .b-ex {
        max-width: 900px;
        margin: 0 auto;
      }
      .b-back {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 12px;
        color: var(--ink);
        text-decoration: none;
      }
      h1 {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(22px, 4vw, 36px);
        line-height: 1;
        margin: 14px 0 4px;
        word-break: break-all;
      }
      .b-cat {
        font-family: var(--font-mono);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 24px;
      }
      .b-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }
      .b-tick {
        font-family: var(--font-mono);
        font-weight: 700;
      }
      .b-note {
        font-family: var(--font-mono);
        margin-top: 20px;
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
