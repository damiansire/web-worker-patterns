import { Component, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ExampleContentService } from '../../../core/services/example-content.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { BrutalistButton } from '../primitives/brutalist-button.component';
import { BrutalistCard } from '../primitives/brutalist-card.component';
import { BrutalistCodeBlock } from '../primitives/brutalist-code-block.component';
import { BRUTALIST_PROVIDERS } from '../brutalist.providers';

/**
 * Example-layout brutalista. Sección de hilos como CONTRASTE lado a lado
 * (backlog #2): la misma cuenta corriendo en un worker (UI fluida) vs en el main
 * thread (UI congelada). Cada columna monta el ThreadVisualizer por DI (§5).
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
        <h1>{{ ex.order }} · {{ ex.id }}</h1>
        <p class="b-cat">{{ ex.category }}</p>

        @if (content()?.summary; as summary) {
          <p class="b-summary">{{ summary }}</p>
        }

        @if (ex.workerFactory) {
          <brutalist-card title="Worker vs Main thread">
            <p class="b-lead">
              {{ content()?.whatToWatch ?? 'Mismo contador, dos hilos. Corré los dos y mirá la diferencia.' }}
            </p>
            <div class="b-cmp">
              <div class="b-col">
                <h3>En un Worker</h3>
                <p class="b-col-sub">el main queda libre · la UI sigue fluida</p>
                <brutalist-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                  Correr en worker
                </brutalist-button>
                @if (workerLanes(); as wl) {
                  <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }" />
                  <p class="b-foot">✓ {{ workerTicks() }} ticks · la UI nunca se trabó</p>
                } @else {
                  <p class="b-hint">Tocá para ver el worker emitir ticks mientras el main queda libre.</p>
                }
              </div>

              <div class="b-col">
                <h3>En el Main thread</h3>
                <p class="b-col-sub">el main se bloquea · la UI se congela ~2,5s</p>
                <brutalist-button [disabled]="phase() === 'main'" (pressed)="runMain()">
                  Bloquear main
                </brutalist-button>
                @if (mainLanes(); as ml) {
                  <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                  <p class="b-foot b-danger">✗ se congeló · {{ mainTicks() }} ticks que no se pintaron</p>
                } @else {
                  <p class="b-hint">Tocá y la página se congela: el contador no actualiza, los clicks mueren.</p>
                }
              </div>
            </div>
          </brutalist-card>

          @if (content()?.takeaways; as tk) {
            <brutalist-card [title]="tk.title">
              <ul class="b-take">
                @for (item of tk.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              @if (tk.tip; as tip) {
                <p class="b-tip">→ {{ tip }}</p>
              }
            </brutalist-card>
          }

          @if (content()?.note; as note) {
            <brutalist-card title="Nota">
              <p class="b-noteedu">{{ note }}</p>
            </brutalist-card>
          }

          @if (snippets().length) {
            <brutalist-card title="Código">
              @for (snip of snippets(); track snip.label) {
                <div class="b-snippet">
                  <brutalist-code-block [label]="snip.label" [code]="snip.code" />
                </div>
              }
            </brutalist-card>
          }
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
        max-width: 940px;
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
      .b-summary {
        font-family: var(--font-mono);
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 24px;
        max-width: 70ch;
      }
      .b-lead {
        font-family: var(--font-mono);
        font-size: 13px;
        margin: 0 0 18px;
      }
      .b-take {
        margin: 0;
        padding-left: 20px;
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.7;
      }
      .b-tip {
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 700;
        margin: 14px 0 0;
        padding-top: 12px;
        border-top: var(--border-width) solid var(--border);
      }
      .b-noteedu {
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
      }
      .b-cmp {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .b-col {
        padding: 4px 18px;
      }
      .b-col:first-child {
        padding-left: 0;
      }
      .b-col + .b-col {
        border-left: var(--border-width) solid var(--border);
      }
      .b-col h3 {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        margin: 0 0 2px;
      }
      .b-col-sub {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        margin: 0 0 12px;
      }
      .b-col brutalist-button {
        display: inline-block;
        margin-bottom: 14px;
      }
      .b-hint {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink-muted);
        border: var(--border-width) dashed var(--border);
        padding: 12px;
      }
      .b-foot {
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
        margin: 10px 0 0;
      }
      .b-danger {
        color: var(--thread-blocked);
      }
      .b-snippet + .b-snippet {
        margin-top: 14px;
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
  private readonly contentSvc = inject(ExampleContentService);

  /** ThreadVisualizer del theme activo, resuelto por DI (§5). */
  protected readonly visualizer = inject(THREAD_VISUALIZER);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly example = computed(() => findExample(this.id()));
  /** Contenido educativo neutral (i18n), reactivo al idioma activo. */
  protected readonly content = this.contentSvc.contentFor(this.id);
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
