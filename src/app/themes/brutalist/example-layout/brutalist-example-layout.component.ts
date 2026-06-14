import { Component, computed, effect, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ExampleContentService } from '../../../core/services/example-content.service';
import { MessageExchangeService } from '../../../core/services/message-exchange.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { BrutalistButton } from '../primitives/brutalist-button.component';
import { BrutalistCard } from '../primitives/brutalist-card.component';
import { BrutalistCodeBlock } from '../primitives/brutalist-code-block.component';
import { BRUTALIST_PROVIDERS } from '../brutalist.providers';

/**
 * Example-layout brutalista. La demo se elige por `example.demo`:
 *   - thread-block:     contraste worker vs main bloqueado (ej. 01).
 *   - message-exchange: ida y vuelta de mensajes main <-> worker (ej. 03).
 * El resto (intro, puntos clave, nota, código) es neutral y viene del contenido.
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
          @switch (ex.demo) {
            @case ('thread-block') {
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
            }

            @case ('message-exchange') {
              <brutalist-card title="Ida y vuelta">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'Enviá un mensaje y mirá el ida y vuelta entre el main y el worker.' }}
                </p>

                <div class="b-send">
                  <input
                    #msg
                    type="text"
                    class="b-input"
                    value="hola"
                    placeholder="escribí un mensaje…"
                    (keyup.enter)="send(msg.value); msg.value = ''"
                  />
                  <brutalist-button variant="solid" [disabled]="pending()" (pressed)="send(msg.value); msg.value = ''">
                    Enviar →
                  </brutalist-button>
                  @if (messages().length) {
                    <brutalist-button (pressed)="resetExchange()">Reset</brutalist-button>
                  }
                </div>

                @if (messages().length) {
                  <div class="b-flow">
                    @for (m of messages(); track m.direction + m.id) {
                      <div class="b-msg" [attr.data-dir]="m.direction">
                        <span class="b-msg-tag">{{ m.direction === 'out' ? 'MAIN →' : '← WORKER' }}</span>
                        <span class="b-msg-text">{{ m.text }}</span>
                        @if (m.roundTripMs != null) {
                          <span class="b-msg-rt">{{ m.roundTripMs }} ms</span>
                        }
                      </div>
                    }
                    @if (pending()) {
                      <div class="b-msg b-msg-wait" data-dir="in">
                        <span class="b-msg-tag">← WORKER</span>
                        <span class="b-msg-text">procesando…</span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="b-hint">Escribí un mensaje y enviálo: va al worker (→) y vuelve la respuesta (←) con su round-trip.</p>
                }
              </brutalist-card>
            }
          }

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

      /* ── message-exchange (ej. 03) ── */
      .b-send {
        display: flex;
        gap: 12px;
        align-items: stretch;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .b-input {
        flex: 1 1 220px;
        font-family: var(--font-mono);
        font-size: 14px;
        padding: 10px 14px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .b-input:focus {
        box-shadow: 4px 4px 0 var(--border);
      }
      .b-flow {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .b-msg {
        display: flex;
        align-items: baseline;
        gap: 10px;
        max-width: 80%;
        padding: 8px 12px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        font-family: var(--font-mono);
        font-size: 13px;
        animation: wwp-seg-in 0.18s ease-out;
      }
      /* MAIN → a la izquierda; ← WORKER a la derecha, en acento. */
      .b-msg[data-dir='out'] {
        margin-right: auto;
      }
      .b-msg[data-dir='in'] {
        margin-left: auto;
        background: var(--accent);
        color: var(--surface-raised);
      }
      .b-msg-wait {
        opacity: 0.7;
      }
      .b-msg-tag {
        font-weight: 700;
        white-space: nowrap;
      }
      .b-msg-text {
        word-break: break-word;
      }
      .b-msg-rt {
        margin-left: auto;
        padding-left: 12px;
        font-weight: 700;
        white-space: nowrap;
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
  private readonly exchange = inject(MessageExchangeService);
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

  // thread-block (01)
  protected readonly workerLanes = this.runner.workerLanes;
  protected readonly mainLanes = this.runner.mainLanes;
  protected readonly workerTicks = this.runner.workerTicks;
  protected readonly mainTicks = this.runner.mainTicks;
  protected readonly phase = this.runner.phase;

  // message-exchange (03)
  protected readonly messages = this.exchange.messages;
  protected readonly pending = this.exchange.pending;

  constructor() {
    // Abre el worker de eco para los ejemplos de mensajería (no-op si ya está
    // abierto para el mismo ejemplo → la conversación sobrevive al cambio de theme).
    effect(() => {
      const ex = this.example();
      if (ex?.demo === 'message-exchange') {
        this.exchange.open(ex);
      }
    });
  }

  runWorker(): void {
    const ex = this.example();
    if (ex) {
      this.runner.runWorkerDemo(ex);
    }
  }

  runMain(): void {
    this.runner.runMainBlockingDemo();
  }

  send(text: string): void {
    this.exchange.send(text);
  }

  resetExchange(): void {
    const ex = this.example();
    this.exchange.reset();
    if (ex?.demo === 'message-exchange') {
      this.exchange.open(ex);
    }
  }
}
