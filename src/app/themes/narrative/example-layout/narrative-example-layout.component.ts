import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { NarrativeButton } from '../primitives/narrative-button.component';
import { NARRATIVE_PROVIDERS } from '../narrative.providers';

/** Example-layout narrative. Patrón contrato + DI para el ThreadVisualizer (§5). */
@Component({
  selector: 'narrative-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, NarrativeButton],
  providers: [NARRATIVE_PROVIDERS],
  template: `
    <article class="n-ex">
      <a class="n-back" routerLink="/t/narrative">← volver al sumario</a>

      @if (example(); as ex) {
        <p class="n-chap">Capítulo {{ ex.order }} · {{ ex.category }}</p>
        <h1>{{ ex.id }}</h1>

        @if (ex.workerFactory) {
          <div class="n-controls">
            <narrative-button variant="solid" (pressed)="start()">Ejecutar</narrative-button>
            <narrative-button (pressed)="stop()">Detener</narrative-button>
            <span class="n-tick">tick {{ lastTick() }}</span>
          </div>

          <ng-container
            *ngComponentOutlet="visualizer; inputs: { lanes: lanes(), elapsedMs: elapsedMs() }"
          />
        } @else {
          <p class="n-note">Este ejemplo todavía no expone un worker neutral.</p>
        }
      } @else {
        <p class="n-note">Ejemplo no encontrado.</p>
      }
    </article>
  `,
  styles: [
    `
      .n-ex {
        max-width: 680px;
        margin: 0 auto;
      }
      .n-back {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        color: var(--ink-muted);
        text-decoration: none;
      }
      .n-chap {
        font-family: var(--font-display);
        font-style: italic;
        color: var(--accent);
        margin: 20px 0 4px;
      }
      h1 {
        font-family: var(--font-mono);
        font-size: clamp(22px, 4vw, 32px);
        margin: 0 0 28px;
        word-break: break-all;
      }
      .n-controls {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 34px;
      }
      .n-tick {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
      .n-note {
        font-family: var(--font-display);
        font-style: italic;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class NarrativeExampleLayoutComponent {
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
