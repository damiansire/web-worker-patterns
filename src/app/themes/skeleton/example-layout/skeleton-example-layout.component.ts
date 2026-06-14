import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';

/**
 * Example-layout neutral del theme skeleton. Corre el worker del ejemplo vía el
 * ExampleRunnerService y dibuja los carriles del ThreadMonitorService como
 * barras, leyendo SOLO tokens semánticos (--thread-*). Es la validación viva del
 * pipeline worker -> runner -> monitor -> tokens (el embrión del ThreadVisualizer
 * que cada theme implementará en serio en las fases 5-7).
 */
@Component({
  selector: 'skeleton-example-layout',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sk-ex">
      <a class="sk-back" routerLink="..">← back</a>

      @if (example(); as ex) {
        <h1>{{ ex.order }}. {{ ex.id }}</h1>
        <p class="sk-cat">{{ ex.category }}</p>

        @if (ex.workerFactory) {
          <div class="sk-controls">
            <button type="button" (click)="start()">start</button>
            <button type="button" (click)="stop()">stop</button>
            <span class="sk-tick">tick: {{ lastTick() }}</span>
          </div>

          <div class="sk-monitor">
            @for (lane of lanes(); track lane.id) {
              <div class="sk-lane">
                <span class="sk-lane-label">{{ lane.label }}</span>
                <div class="sk-track">
                  @for (seg of lane.segments; track $index) {
                    <span
                      class="sk-seg"
                      [class.is-worker]="seg.state === 'worker'"
                      [class.is-blocked]="seg.state === 'blocked'"
                      [class.is-idle]="seg.state === 'idle'"
                    ></span>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="sk-note">Este ejemplo todavía no expone un worker neutral.</p>
        }
      } @else {
        <p class="sk-note">Ejemplo no encontrado.</p>
      }
    </section>
  `,
  styles: [
    `
      .sk-ex {
        max-width: 820px;
        margin: 0 auto;
        padding: 24px 20px;
        color: var(--ink);
        font-family: var(--font-body);
      }
      .sk-back {
        color: var(--ink-muted);
        text-decoration: none;
        font-family: var(--font-mono);
        font-size: 13px;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 22px;
        margin: 12px 0 2px;
        word-break: break-all;
      }
      .sk-cat {
        color: var(--ink-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 12px;
        margin: 0 0 20px;
      }
      .sk-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .sk-controls button {
        font-family: var(--font-mono);
        padding: 6px 14px;
        background: var(--accent);
        color: var(--surface-raised);
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
      }
      .sk-tick {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
      .sk-monitor {
        display: grid;
        gap: 8px;
      }
      .sk-lane {
        display: grid;
        grid-template-columns: 90px 1fr;
        align-items: center;
        gap: 12px;
      }
      .sk-lane-label {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
      }
      .sk-track {
        display: flex;
        gap: 2px;
        height: 18px;
        padding: 2px;
        background: var(--thread-idle);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .sk-seg {
        width: 10px;
        background: var(--thread-main);
        border-radius: 1px;
      }
      .sk-seg.is-worker {
        background: var(--thread-worker);
      }
      .sk-seg.is-blocked {
        background: var(--thread-blocked);
      }
      .sk-seg.is-idle {
        background: var(--thread-idle);
      }
      .sk-note {
        color: var(--ink-muted);
        margin-top: 20px;
      }
    `,
  ],
})
export class SkeletonExampleLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly runner = inject(ExampleRunnerService);
  private readonly monitor = inject(ThreadMonitorService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );
  protected readonly example = computed(() => findExample(this.id()));
  protected readonly lanes = this.monitor.lanes;
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
