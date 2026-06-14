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
import { EditorialButton } from '../primitives/editorial-button.component';
import { EditorialCodeBlock } from '../primitives/editorial-code-block.component';
import { EDITORIAL_PROVIDERS } from '../editorial.providers';

/** Example-layout editorial. Hilos como contraste worker-vs-main (#2) + código. */
@Component({
  selector: 'editorial-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, EditorialButton, EditorialCodeBlock],
  providers: [EDITORIAL_PROVIDERS],
  template: `
    <article class="e-ex">
      <a class="e-back" routerLink="/t/editorial">← índice</a>

      @if (example(); as ex) {
        <p class="e-kicker">{{ ex.category }} · nº {{ ex.order.toString().padStart(2, '0') }}</p>
        <h1>{{ ex.id }}</h1>

        @if (ex.workerFactory) {
          @if (content()?.summary; as summary) {
            <p class="e-lead">{{ summary }}</p>
          }
          @if (content()?.whatToWatch; as ww) {
            <p class="e-watch">{{ ww }}</p>
          }

          @switch (ex.demo) {
            @case ('thread-block') {
              <div class="e-cmp">
                <section class="e-col">
                  <h2>En un Worker</h2>
                  <p class="e-sub">el main queda libre · la UI sigue fluida</p>
                  <editorial-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                    Ejecutar en worker
                  </editorial-button>
                  @if (workerLanes(); as wl) {
                    <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }" />
                    <p class="e-foot">{{ workerTicks() }} ticks · la UI nunca se trabó</p>
                  } @else {
                    <p class="e-hint">Tocá para ver el worker emitir ticks mientras el main queda libre.</p>
                  }
                </section>

                <section class="e-col">
                  <h2>En el Main thread</h2>
                  <p class="e-sub">el main se bloquea · la UI se congela ~2,5s</p>
                  <editorial-button [disabled]="phase() === 'main'" (pressed)="runMain()">Bloquear main</editorial-button>
                  @if (mainLanes(); as ml) {
                    <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                    <p class="e-foot e-danger">se congeló · {{ mainTicks() }} ticks que no se pintaron</p>
                  } @else {
                    <p class="e-hint">Tocá y la página se congela: el contador no actualiza, los clicks mueren.</p>
                  }
                </section>
              </div>
            }

            @case ('message-exchange') {
              <div class="e-send">
                <input
                  #msg
                  class="e-input"
                  value="hola"
                  placeholder="escribí un mensaje…"
                  (keyup.enter)="send(msg.value); msg.value = ''"
                />
                <editorial-button variant="solid" [disabled]="pending()" (pressed)="send(msg.value); msg.value = ''">
                  Enviar
                </editorial-button>
                @if (messages().length) {
                  <editorial-button (pressed)="resetExchange()">Reiniciar</editorial-button>
                }
              </div>
              @if (messages().length) {
                <div class="e-dialogue">
                  @for (m of messages(); track m.direction + m.id) {
                    <div class="e-msg" [attr.data-dir]="m.direction">
                      <p class="e-msg-line">
                        <span class="e-msg-who">{{ m.direction === 'out' ? 'Main →' : '← Worker' }}</span>
                        <span class="e-msg-text">{{ m.text }}</span>
                        @if (m.meta) {
                          <span class="e-msg-meta"> · {{ m.meta }}</span>
                        }
                      </p>
                      @if (m.roundTripMs != null) {
                        <p class="e-msg-rt">ida y vuelta · {{ m.roundTripMs }} ms</p>
                      }
                    </div>
                  }
                  @if (pending()) {
                    <div class="e-msg e-msg-wait" data-dir="in">
                      <p class="e-msg-line"><span class="e-msg-who">← Worker</span> <span class="e-msg-text">procesando…</span></p>
                    </div>
                  }
                </div>
              } @else {
                <p class="e-hint">Enviá un mensaje: viaja al worker (→) y vuelve la respuesta (←) con su round-trip.</p>
              }
            }
          }

          @if (content()?.takeaways; as tk) {
            <section class="e-take">
              <h2>{{ tk.title }}</h2>
              <ul>
                @for (item of tk.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              @if (tk.tip; as tip) {
                <p class="e-tip">{{ tip }}</p>
              }
            </section>
          }

          @if (content()?.note; as note) {
            <aside class="e-noteedu">{{ note }}</aside>
          }

          @if (snippets().length) {
            <h2 class="e-code-title">El código</h2>
            <div class="e-code">
              @for (snip of snippets(); track snip.label) {
                <editorial-code-block [label]="snip.label" [code]="snip.code" />
              }
            </div>
          }
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
      }
      h1 {
        font-family: var(--font-mono);
        font-size: clamp(22px, 4vw, 34px);
        margin: 0 0 20px;
        word-break: break-all;
      }
      .e-lead {
        font-family: var(--font-body);
        font-size: 19px;
        line-height: 1.6;
        margin: 0 0 14px;
        max-width: 62ch;
      }
      .e-watch {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        line-height: 1.6;
        color: var(--ink-muted);
        margin: 0 0 28px;
        max-width: 62ch;
      }
      .e-take {
        margin: 8px 0 32px;
      }
      .e-take h2 {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 22px;
        margin: 0 0 12px;
      }
      .e-take ul {
        margin: 0;
        padding-left: 22px;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.7;
      }
      .e-tip {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        color: var(--accent);
        margin: 14px 0 0;
      }
      .e-noteedu {
        display: block;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.6;
        color: var(--ink-muted);
        border-left: 3px solid var(--accent);
        padding-left: 16px;
        margin: 0 0 36px;
        max-width: 62ch;
      }
      .e-cmp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 40px;
      }
      .e-col h2 {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 20px;
        margin: 0 0 2px;
      }
      .e-sub {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
        margin: 0 0 14px;
      }
      .e-col editorial-button {
        display: inline-block;
        margin-bottom: 16px;
      }
      .e-hint {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        line-height: 1.6;
        color: var(--ink-muted);
        border-left: 3px solid var(--border);
        padding: 4px 0 4px 14px;
      }
      .e-foot {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        margin: 12px 0 0;
        color: var(--ink-muted);
      }
      .e-danger {
        color: var(--thread-blocked);
        font-style: normal;
        font-weight: 600;
      }
      .e-code-title {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 22px;
        margin: 0 0 16px;
      }
      .e-code {
        display: grid;
        gap: 16px;
      }

      /* ── message-exchange (ej. 03): correspondencia ── */
      .e-send {
        display: flex;
        gap: 14px;
        align-items: stretch;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }
      .e-input {
        flex: 1 1 240px;
        font-family: var(--font-body);
        font-size: 16px;
        padding: 11px 16px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .e-input:focus {
        border-color: var(--accent);
      }
      .e-dialogue {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 40px;
      }
      .e-msg {
        max-width: 76%;
        padding: 12px 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        animation: wwp-seg-in 0.18s ease-out;
      }
      .e-msg[data-dir='out'] {
        margin-right: auto;
      }
      .e-msg[data-dir='in'] {
        margin-left: auto;
        border-color: var(--accent);
      }
      .e-msg-meta {
        color: var(--ink-muted);
        font-style: italic;
      }
      .e-msg-line {
        margin: 0;
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.5;
        color: var(--ink);
      }
      .e-msg-who {
        font-family: var(--font-display);
        font-style: italic;
        font-weight: 600;
        color: var(--ink-muted);
        margin-right: 8px;
      }
      .e-msg[data-dir='in'] .e-msg-who {
        color: var(--accent);
      }
      .e-msg-rt {
        margin: 6px 0 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
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
  private readonly exchange = inject(MessageExchangeService);

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
