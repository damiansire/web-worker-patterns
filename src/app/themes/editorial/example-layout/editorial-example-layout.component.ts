import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { EditorialButton } from '../primitives/editorial-button.component';
import { EDITORIAL_PROVIDERS } from '../editorial.providers';

/** Example-layout editorial. Patrón contrato + DI para el ThreadVisualizer (§5). */
@Component({
  selector: 'editorial-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, EditorialButton],
  providers: [EDITORIAL_PROVIDERS],
  template: `
    <article class="e-ex">
      <a class="e-back" routerLink="/t/editorial">← índice</a>

      @if (example(); as ex) {
        <p class="e-kicker">{{ ex.category }} · nº {{ ex.order.toString().padStart(2, '0') }}</p>
        <h1>{{ ex.id }}</h1>

        @if (ex.workerFactory) {
          <div class="e-controls">
            <editorial-button variant="solid" (pressed)="start()">Ejecutar</editorial-button>
            <editorial-button (pressed)="stop()">Detener</editorial-button>
            <span class="e-tick">tick {{ lastTick() }}</span>
          </div>

          <ng-container
            *ngComponentOutlet="visualizer; inputs: { lanes: lanes(), elapsedMs: elapsedMs() }"
          />
        } @else {
          <p class="e-note">Este ejemplo todavía no expone un worker neutral.</p>
        }
      } @else {
        <p class="e-note">Ejemplo no encontrado.</p>
      }
    </article>
  `,
  styles: [
    `
      .e-ex {
        max-width: 760px;
        margin: 0 auto;
      }
      .e-back {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--ink-muted);
        text-decoration: none;
      }
      .e-kicker {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--accent);
        margin: 18px 0 4px;
        text-transform: lowercase;
      }
      h1 {
        font-family: var(--font-mono);
        font-size: clamp(22px, 4vw, 34px);
        margin: 0 0 28px;
        word-break: break-all;
      }
      .e-controls {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 32px;
      }
      .e-tick {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
      .e-note {
        font-family: var(--font-display);
        font-style: italic;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class EditorialExampleLayoutComponent {
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
