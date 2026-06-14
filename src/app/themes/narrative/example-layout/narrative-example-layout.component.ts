import { Component, computed, effect, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../../../core/domain/examples/examples.registry';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ExampleContentService } from '../../../core/services/example-content.service';
import { MessageExchangeService } from '../../../core/services/message-exchange.service';
import { ComputeDemoService } from '../../../core/services/compute-demo.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { NarrativeButton } from '../primitives/narrative-button.component';
import { NarrativeCodeBlock } from '../primitives/narrative-code-block.component';
import { NARRATIVE_PROVIDERS } from '../narrative.providers';

/** Example-layout narrative. Hilos como contraste worker-vs-main (#2) + código. */
@Component({
  selector: 'narrative-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, NarrativeButton, NarrativeCodeBlock],
  providers: [NARRATIVE_PROVIDERS],
  template: `
    <article class="n-ex">
      <a class="n-back" routerLink="/t/narrative">← volver al sumario</a>

      @if (example(); as ex) {
        <p class="n-chap">Capítulo {{ ex.order }} · {{ ex.category }}</p>
        <h1>{{ ex.id }}</h1>

        @if (ex.workerFactory) {
          @if (content()?.summary; as summary) {
            <p class="n-lead">{{ summary }}</p>
          }
          @if (content()?.whatToWatch; as ww) {
            <p class="n-watch">{{ ww }}</p>
          }

          @switch (ex.demo) {
            @case ('thread-block') {
              <div class="n-cmp">
                <section class="n-col">
                  <h2>En un Worker</h2>
                  <p class="n-sub">el main queda libre · la UI sigue fluida</p>
                  <narrative-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                    Ejecutar en worker
                  </narrative-button>
                  @if (workerLanes(); as wl) {
                    <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }" />
                    <p class="n-foot">{{ workerTicks() }} ticks · la UI nunca se trabó</p>
                  } @else {
                    <p class="n-hint">Tocá para ver el worker emitir ticks mientras el main queda libre.</p>
                  }
                </section>

                <section class="n-col">
                  <h2>En el Main thread</h2>
                  <p class="n-sub">el main se bloquea · la UI se congela ~2,5s</p>
                  <narrative-button [disabled]="phase() === 'main'" (pressed)="runMain()">Bloquear main</narrative-button>
                  @if (mainLanes(); as ml) {
                    <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                    <p class="n-foot n-danger">se congeló · {{ mainTicks() }} ticks que no se pintaron</p>
                  } @else {
                    <p class="n-hint">Tocá y la página se congela: el contador no actualiza, los clicks mueren.</p>
                  }
                </section>
              </div>
            }

            @case ('message-exchange') {
              <div class="n-send">
                <input
                  #msg
                  class="n-input"
                  value="hola"
                  placeholder="escribí un mensaje…"
                  (keyup.enter)="send(msg.value); msg.value = ''"
                />
                <narrative-button variant="solid" [disabled]="pending()" (pressed)="send(msg.value); msg.value = ''">
                  Enviar
                </narrative-button>
                @if (messages().length) {
                  <narrative-button (pressed)="resetExchange()">Reiniciar</narrative-button>
                }
              </div>
              @if (messages().length) {
                <div class="n-dialogue">
                  @for (m of messages(); track m.direction + m.id) {
                    <div class="n-msg" [attr.data-dir]="m.direction">
                      <p class="n-msg-line">
                        <span class="n-msg-who">{{ m.direction === 'out' ? 'Main →' : '← Worker' }}</span>
                        <span class="n-msg-text">{{ m.text }}</span>
                        @if (m.meta) {
                          <span class="n-msg-meta"> · {{ m.meta }}</span>
                        }
                      </p>
                      @if (m.roundTripMs != null) {
                        <p class="n-msg-rt">ida y vuelta · {{ m.roundTripMs }} ms</p>
                      }
                    </div>
                  }
                  @if (pending()) {
                    <div class="n-msg n-msg-wait" data-dir="in">
                      <p class="n-msg-line"><span class="n-msg-who">← Worker</span> <span class="n-msg-text">procesando…</span></p>
                    </div>
                  }
                </div>
              } @else {
                <p class="n-hint">Enviá un mensaje: viaja al worker (→) y vuelve la respuesta (←) con su round-trip.</p>
              }
            }

            @case ('offload') {
              <div class="n-nrow">
                <label class="n-nlabel" for="n-n">Contar primos hasta N =</label>
                <input #n id="n-n" class="n-input-n" type="number" value="500000" min="10000" step="100000" />
                <span class="n-nhint">subilo y el freeze del main dura más</span>
              </div>
              <div class="n-cmp">
                <section class="n-col">
                  <h2>En un Worker</h2>
                  <p class="n-sub">corre en otro hilo · la UI sigue fluida</p>
                  <narrative-button variant="solid" [disabled]="computePhase() === 'worker'" (pressed)="computeWorker(n.value)">
                    Calcular en worker
                  </narrative-button>
                  @if (computePhase() === 'worker') {
                    <p class="n-foot">calculando… {{ liveMs() }} ms · la UI responde mientras tanto</p>
                  } @else if (workerResult(); as r) {
                    <p class="n-foot n-ok"><span class="n-ok-mark">✓</span> {{ r.count }} primos · {{ r.ms }} ms · la UI nunca se trabó</p>
                  } @else {
                    <p class="n-hint">Tocá: el cálculo corre en otro hilo y el cronómetro sigue subiendo en vivo.</p>
                  }
                </section>

                <section class="n-col">
                  <h2>En el Main thread</h2>
                  <p class="n-sub">bloquea el hilo · la página se congela</p>
                  <narrative-button [disabled]="computePhase() === 'main'" (pressed)="computeMain(n.value)">Calcular en el main</narrative-button>
                  @if (mainResult(); as r) {
                    <p class="n-foot n-danger">{{ r.count }} primos · la página se congeló {{ r.ms }} ms</p>
                  } @else {
                    <p class="n-hint">Tocá y la página entera se congela hasta terminar: no podés ni scrollear.</p>
                  }
                </section>
              </div>
            }
          }

          @if (content()?.takeaways; as tk) {
            <section class="n-take">
              <h2>{{ tk.title }}</h2>
              <ul>
                @for (item of tk.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              @if (tk.tip; as tip) {
                <p class="n-tip">{{ tip }}</p>
              }
            </section>
          }

          @if (content()?.note; as note) {
            <aside class="n-noteedu">{{ note }}</aside>
          }

          @if (snippets().length) {
            <h2 class="n-code-title">El código</h2>
            <div class="n-code">
              @for (snip of snippets(); track snip.label) {
                <narrative-code-block [label]="snip.label" [code]="snip.code" />
              }
            </div>
          }
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
        max-width: 700px;
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
        margin: 0 0 20px;
        word-break: break-all;
      }
      .n-lead {
        font-family: var(--font-body);
        font-size: 19px;
        line-height: 1.7;
        margin: 0 0 14px;
      }
      .n-watch {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 16px;
        line-height: 1.6;
        color: var(--ink-muted);
        margin: 0 0 30px;
      }
      .n-take {
        margin: 8px 0 32px;
      }
      .n-take h2 {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 24px;
        margin: 0 0 12px;
      }
      .n-take ul {
        margin: 0;
        padding-left: 22px;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.8;
      }
      .n-tip {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 16px;
        color: var(--accent);
        margin: 14px 0 0;
      }
      .n-noteedu {
        display: block;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.7;
        color: var(--ink-muted);
        border-left: 3px solid var(--accent);
        padding-left: 16px;
        margin: 0 0 36px;
      }
      .n-cmp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
        margin-bottom: 40px;
      }
      .n-col h2 {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 22px;
        margin: 0 0 2px;
      }
      .n-sub {
        font-family: var(--font-body);
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--ink-muted);
        margin: 0 0 14px;
      }
      .n-col narrative-button {
        display: inline-block;
        margin-bottom: 16px;
      }
      .n-hint {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        line-height: 1.6;
        color: var(--ink-muted);
        border-left: 3px solid var(--border);
        padding: 4px 0 4px 14px;
      }
      .n-foot {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        margin: 12px 0 0;
        color: var(--ink-muted);
      }
      .n-danger {
        color: var(--thread-blocked);
        font-style: normal;
        font-weight: 600;
      }
      .n-ok {
        color: var(--ink);
        font-style: normal;
      }
      .n-ok-mark {
        color: var(--thread-main);
        font-weight: 700;
      }
      .n-code-title {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 24px;
        margin: 0 0 16px;
      }
      .n-code {
        display: grid;
        gap: 16px;
      }

      /* ── message-exchange (ej. 03): diálogo ── */
      .n-send {
        display: flex;
        gap: 14px;
        align-items: stretch;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }
      .n-input {
        flex: 1 1 240px;
        font-family: var(--font-body);
        font-size: 16px;
        padding: 10px 16px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .n-input:focus {
        border-color: var(--accent);
      }
      .n-dialogue {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 40px;
      }
      .n-msg {
        max-width: 76%;
        padding: 12px 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        animation: wwp-seg-in 0.18s ease-out;
      }
      .n-msg[data-dir='out'] {
        margin-right: auto;
      }
      .n-msg[data-dir='in'] {
        margin-left: auto;
        border-color: var(--accent);
      }
      .n-msg-meta {
        color: var(--ink-muted);
        font-style: italic;
      }
      .n-msg-line {
        margin: 0;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.5;
        color: var(--ink);
      }
      .n-msg-who {
        font-family: var(--font-display);
        font-style: italic;
        font-weight: 600;
        color: var(--ink-muted);
        margin-right: 8px;
      }
      .n-msg[data-dir='in'] .n-msg-who {
        color: var(--accent);
      }
      .n-msg-rt {
        margin: 6px 0 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
      }

      /* ── offload (ej. 04): entrada N ── */
      .n-nrow {
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }
      .n-nlabel {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 18px;
      }
      .n-input-n {
        width: 150px;
        font-family: var(--font-body);
        font-size: 16px;
        padding: 9px 14px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .n-input-n:focus {
        border-color: var(--accent);
      }
      .n-nhint {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
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
  private readonly exchange = inject(MessageExchangeService);
  private readonly compute = inject(ComputeDemoService);

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

  // offload (04)
  protected readonly workerResult = this.compute.workerResult;
  protected readonly mainResult = this.compute.mainResult;
  protected readonly liveMs = this.compute.liveMs;
  protected readonly computePhase = this.compute.phase;

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

  computeWorker(value: string): void {
    const ex = this.example();
    if (ex) {
      this.compute.runWorker(ex, this.parseN(value));
    }
  }

  computeMain(value: string): void {
    this.compute.runMain(this.parseN(value));
  }

  private parseN(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 5_000_000) : 500_000;
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
