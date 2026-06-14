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
import { FullBrutalistButton } from '../primitives/fb-button.component';
import { FullBrutalistCard } from '../primitives/fb-card.component';
import { FullBrutalistCodeBlock } from '../primitives/fb-code-block.component';
import { FULL_BRUTALIST_PROVIDERS } from '../fb.providers';

/**
 * Example-layout brutalista — vertical completa del ejemplo, encajada en una
 * grilla expuesta de líneas duras amarillas (header + cards comparten bordes):
 *   1. corre el worker real (ExampleRunnerService);
 *   2. visualiza los hilos resolviendo THREAD_VISUALIZER por DI (§5);
 *   3. muestra el código (snippets del registry) en el code-block del theme.
 */
@Component({
  selector: 'fb-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, FullBrutalistButton, FullBrutalistCard, FullBrutalistCodeBlock],
  providers: [FULL_BRUTALIST_PROVIDERS],
  template: `
    <section class="b-ex">
      <a class="b-back" routerLink="/t/full-brutalist">← INDEX</a>

      @if (example(); as ex) {
        <div class="b-frame">
          <header class="b-head">
            <span class="b-order">{{ ex.order.toString().padStart(2, '0') }}</span>
            <div class="b-head-text">
              <h1>{{ ex.id }}</h1>
              <span class="b-badge">{{ ex.category }}</span>
            </div>
          </header>

          @if (content()?.summary; as summary) {
            <p class="b-summary">{{ summary }}</p>
          }

          @if (ex.workerFactory) {
            @switch (ex.demo) {
              @case ('thread-block') {
                <fb-card title="Worker vs Main thread">
                  <p class="b-lead">
                    {{ content()?.whatToWatch ?? 'Mismo contador, dos hilos. Corré los dos y mirá la diferencia.' }}
                  </p>
                  <div class="b-cmp">
                    <div class="b-col">
                      <h3>En un Worker</h3>
                      <p class="b-col-sub">el main queda libre · la UI sigue fluida</p>
                      <fb-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                        Correr en worker
                      </fb-button>
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
                      <fb-button [disabled]="phase() === 'main'" (pressed)="runMain()">Bloquear main</fb-button>
                      @if (mainLanes(); as ml) {
                        <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                        <p class="b-foot b-danger">✗ se congeló · {{ mainTicks() }} ticks que no se pintaron</p>
                      } @else {
                        <p class="b-hint">Tocá y la página se congela: el contador no actualiza, los clicks mueren.</p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('message-exchange') {
                <fb-card title="Ida y vuelta">
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
                    <fb-button variant="solid" [disabled]="pending()" (pressed)="send(msg.value); msg.value = ''">
                      Enviar →
                    </fb-button>
                    @if (messages().length) {
                      <fb-button (pressed)="resetExchange()">Reset</fb-button>
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
                </fb-card>
              }
            }

            @if (content()?.takeaways; as tk) {
              <fb-card [title]="tk.title">
                <ul class="b-take">
                  @for (item of tk.items; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
                @if (tk.tip; as tip) {
                  <p class="b-tip">→ {{ tip }}</p>
                }
              </fb-card>
            }

            @if (content()?.note; as note) {
              <fb-card title="Nota">
                <p class="b-noteedu">{{ note }}</p>
              </fb-card>
            }

            @if (snippets().length) {
              <fb-card title="Código">
                <div class="b-code-stack">
                  @for (snip of snippets(); track snip.label) {
                    <fb-code-block [label]="snip.label" [code]="snip.code" />
                  }
                </div>
              </fb-card>
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

      .b-summary {
        background: var(--surface-raised);
        color: var(--ink);
        font-family: var(--font-mono);
        font-size: 15px;
        line-height: 1.6;
        padding: 18px;
        margin: 0;
      }
      .b-lead {
        font-family: var(--font-mono);
        font-size: 13px;
        margin: 0 0 18px;
        color: var(--ink);
      }
      .b-take {
        margin: 0;
        padding-left: 20px;
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.7;
        color: var(--ink);
      }
      .b-tip {
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 700;
        color: var(--accent);
        margin: 14px 0 0;
        padding-top: 12px;
        border-top: var(--border-width) solid var(--border);
      }
      .b-noteedu {
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.6;
        color: var(--ink);
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
        color: var(--ink);
      }
      .b-col-sub {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        margin: 0 0 12px;
      }
      .b-col fb-button {
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
        color: var(--ink);
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
      .b-input::placeholder {
        color: var(--ink-muted);
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
        color: var(--ink);
        font-family: var(--font-mono);
        font-size: 13px;
        animation: wwp-seg-in 0.18s ease-out;
      }
      .b-msg[data-dir='out'] {
        margin-right: auto;
      }
      .b-msg[data-dir='in'] {
        margin-left: auto;
        background: var(--accent);
        color: var(--surface);
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

      /* Code-blocks encajados: colapsan sus bordes 3px en una sola línea. */
      .b-code-stack > fb-code-block {
        display: block;
      }
      .b-code-stack > fb-code-block + fb-code-block {
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
export class FullBrutalistExampleLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly runner = inject(ExampleRunnerService);
  private readonly exchange = inject(MessageExchangeService);

  /** Implementación del ThreadVisualizer del theme activo, resuelta por DI. */
  protected readonly visualizer = inject(THREAD_VISUALIZER);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly example = computed(() => findExample(this.id()));
  protected readonly snippets = computed(() =>
    Object.entries(this.example()?.snippets ?? {}).map(([label, code]) => ({ label, code })),
  );
  protected readonly content = inject(ExampleContentService).contentFor(this.id);

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
