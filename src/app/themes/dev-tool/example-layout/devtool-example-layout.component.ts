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
import { ErrorDemoService } from '../../../core/services/error-demo.service';
import { LifecycleDemoService } from '../../../core/services/lifecycle-demo.service';
import { TransferDemoService } from '../../../core/services/transfer-demo.service';
import { SharedWorkerDemoService } from '../../../core/services/shared-worker-demo.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { DevToolButton } from '../primitives/devtool-button.component';
import { DevToolCodeBlock } from '../primitives/devtool-code-block.component';
import { DEVTOOL_PROVIDERS } from '../devtool.providers';

/**
 * Example-layout dev-tool. Hilos como contraste worker-vs-main (backlog #2) en
 * paneles tipo IDE; ThreadVisualizer por DI (§5) y código en el code-block del theme.
 */
@Component({
  selector: 'devtool-example-layout',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, DevToolButton, DevToolCodeBlock],
  providers: [DEVTOOL_PROVIDERS],
  template: `
    <section class="dt-ex">
      <a class="dt-back" routerLink="/t/dev-tool">← ../</a>

      @if (example(); as ex) {
        <h1>
          <span class="dt-order">{{ ex.order.toString().padStart(2, '0') }}</span> {{ content()?.title ?? ex.id }}
        </h1>
        <p class="dt-cat">{{ ex.category }}</p>

        @if (content()?.summary; as summary) {
          <p class="dt-summary">{{ summary }}</p>
        }

        @if (ex.workerFactory || ex.sharedWorkerFactory) {
          @switch (ex.demo) {
            @case ('thread-block') {
              <section class="dt-panel">
                <header class="dt-panel-h">// worker vs main thread</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h3>en un worker</h3>
                    <p class="dt-sub">main libre · UI fluida</p>
                    <devtool-button variant="solid" [disabled]="phase() === 'worker'" (pressed)="runWorker()">
                      ▶ correr en worker
                    </devtool-button>
                    @if (workerLanes(); as wl) {
                      <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }" />
                      <p class="dt-ok">✓ {{ workerTicks() }} ticks · sin jank</p>
                    } @else {
                      <p class="dt-hint">// tocá para correr en worker; el main queda libre</p>
                    }
                  </div>
                  <div class="dt-col">
                    <h3>en el main thread</h3>
                    <p class="dt-sub">main bloqueado · UI congelada</p>
                    <devtool-button [disabled]="phase() === 'main'" (pressed)="runMain()">▶ bloquear main</devtool-button>
                    @if (mainLanes(); as ml) {
                      <ng-container *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }" />
                      <p class="dt-bad">✗ congelado · {{ mainTicks() }} ticks perdidos</p>
                    } @else {
                      <p class="dt-hint">// tocá: la UI se congela ~2,5s, los clicks mueren</p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('message-exchange') {
              <section class="dt-panel">
                <header class="dt-panel-h">// comunicación bidireccional</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <span class="dt-prompt">$</span>
                    <input
                      #msg
                      class="dt-input"
                      value="hola"
                      placeholder="mensaje…"
                      (keyup.enter)="send(msg.value); msg.value = ''"
                    />
                    <devtool-button variant="solid" [disabled]="pending()" (pressed)="send(msg.value); msg.value = ''">
                      ▶ enviar
                    </devtool-button>
                    @if (messages().length) {
                      <devtool-button (pressed)="resetExchange()">clear</devtool-button>
                    }
                  </div>
                  @if (messages().length) {
                    <div class="dt-log">
                      @for (m of messages(); track m.direction + m.id) {
                        <div class="dt-line" [attr.data-dir]="m.direction">
                          <span class="dt-line-tag">{{ m.direction === 'out' ? 'main →' : '← worker' }}</span>
                          <span class="dt-line-text">{{ m.text }}</span>
                          @if (m.meta) {
                            <span class="dt-line-meta">· {{ m.meta }}</span>
                          }
                          @if (m.roundTripMs != null) {
                            <span class="dt-line-rt">{{ m.roundTripMs }}ms</span>
                          }
                        </div>
                      }
                      @if (pending()) {
                        <div class="dt-line" data-dir="in">
                          <span class="dt-line-tag">← worker</span>
                          <span class="dt-line-text">procesando…</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="dt-hint">// escribí un mensaje y enviálo: → va al worker, ← vuelve con su round-trip</p>
                  }
                </div>
              </section>
            }

            @case ('offload') {
              <section class="dt-panel">
                <header class="dt-panel-h">// cómputo pesado · worker vs main thread</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-nrow">
                    <span class="dt-prompt">const N =</span>
                    <input #n class="dt-input-n" type="number" value="500000" min="10000" step="100000" />
                    <span class="dt-nhint">// contar primos hasta N · subilo y el freeze dura más</span>
                  </div>
                </div>
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h3>en un worker</h3>
                    <p class="dt-sub">otro hilo · UI fluida</p>
                    <devtool-button variant="solid" [disabled]="computePhase() === 'worker'" (pressed)="computeWorker(n.value)">
                      ▶ correr en worker
                    </devtool-button>
                    @if (computePhase() === 'worker') {
                      <p class="dt-ok">⏱ {{ liveMs() }} ms · calculando, la UI responde</p>
                    } @else if (workerResult(); as r) {
                      <p class="dt-ok">✓ {{ r.count }} primos · {{ r.ms }} ms · sin jank</p>
                    } @else {
                      <p class="dt-hint">// el cálculo corre en otro hilo; el cronómetro sigue subiendo</p>
                    }
                  </div>
                  <div class="dt-col">
                    <h3>en el main thread</h3>
                    <p class="dt-sub">hilo bloqueado · UI congelada</p>
                    <devtool-button [disabled]="computePhase() === 'main'" (pressed)="computeMain(n.value)">▶ bloquear main</devtool-button>
                    @if (mainResult(); as r) {
                      <p class="dt-bad">✗ {{ r.count }} primos · congelado {{ r.ms }} ms</p>
                    } @else {
                      <p class="dt-hint">// la página entera se congela hasta terminar: ni scroll</p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('error-handling') {
              <section class="dt-panel">
                <header class="dt-panel-h">// errores que no rompen · worker.onerror</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                      ▶ json válido
                    </devtool-button>
                    <devtool-button [disabled]="errorBusy()" (pressed)="sendFail()">▶ json roto</devtool-button>
                    @if (errorEvents().length) {
                      <devtool-button (pressed)="resetErrors()">clear</devtool-button>
                    }
                  </div>
                  @if (errorEvents().length) {
                    <div class="dt-log">
                      @for (ev of errorEvents(); track ev.id) {
                        <div class="dt-evt" [attr.data-status]="ev.status">
                          <span class="dt-evt-mark">{{ ev.status === 'ok' ? '✓' : '✗' }}</span>
                          <span class="dt-evt-in">{{ ev.input }}</span>
                          @if (ev.status === 'ok') {
                            <span class="dt-evt-text">→ {{ ev.keys }} claves</span>
                          } @else {
                            <span class="dt-evt-text">→ {{ ev.message }}</span>
                          }
                        </div>
                      }
                    </div>
                    <p class="dt-ok">// la app sigue viva: el worker no se murió, seguí mandando tareas</p>
                  } @else {
                    <p class="dt-hint">// mandá un json válido (✓ claves) y después uno roto (✗ onerror lo captura). la página no se rompe</p>
                  }
                </div>
              </section>
            }

            @case ('lifecycle') {
              <section class="dt-panel">
                <header class="dt-panel-h">// ciclo de vida · worker.terminate()</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button variant="solid" [disabled]="lifeStatus() === 'running'" (pressed)="startLife()">
                      ▶ iniciar
                    </devtool-button>
                    <devtool-button [disabled]="lifeStatus() !== 'running'" (pressed)="terminateLife()">■ terminate</devtool-button>
                    @if (lifeStatus() !== 'idle') {
                      <devtool-button (pressed)="resetLife()">reset</devtool-button>
                    }
                  </div>

                  <div class="dt-bar" [attr.data-status]="lifeStatus()">
                    <div class="dt-bar-fill" [style.width.%]="lifePct()"></div>
                  </div>
                  <p class="dt-bar-label">paso {{ lifeStep() }} / {{ lifeSteps() || '—' }}</p>

                  @switch (lifeStatus()) {
                    @case ('idle') {
                      <p class="dt-hint">// tocá iniciar y cortá a mitad con terminate: el paso en curso se descarta</p>
                    }
                    @case ('running') {
                      <p class="dt-ok">// running · el worker está vivo emitiendo progreso</p>
                    }
                    @case ('terminated') {
                      <p class="dt-bad">// terminated en paso {{ lifeStep() }}/{{ lifeSteps() }} · trabajo en curso perdido · el worker ya no existe (iniciá → se crea uno nuevo)</p>
                    }
                    @case ('done') {
                      <p class="dt-ok">// done {{ lifeSteps() }}/{{ lifeSteps() }} · el worker se cerró solo (self.close)</p>
                    }
                  }
                </div>
              </section>
            }

            @case ('transferable') {
              <section class="dt-panel">
                <header class="dt-panel-h">// transferir vs clonar · ArrayBuffer ({{ transferMb }} MB)</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h3>transfer (zero-copy)</h3>
                    <p class="dt-sub">cambia de dueño · no copia</p>
                    <devtool-button variant="solid" [disabled]="transferBusy()" (pressed)="runTransfer()">
                      ▶ transferir
                    </devtool-button>
                    @if (transferResult(); as r) {
                      <p class="dt-ok">✓ round-trip {{ r.ms }} ms · instantáneo</p>
                      <p class="dt-bad">⚠ main buffer DETACHED · byteLength 0</p>
                    } @else {
                      <p class="dt-hint">// postMessage(msg, [buf]) · zero-copy, pero el main pierde el buffer</p>
                    }
                  </div>
                  <div class="dt-col">
                    <h3>clone (structured)</h3>
                    <p class="dt-sub">copia byte por byte · el main lo conserva</p>
                    <devtool-button [disabled]="transferBusy()" (pressed)="runClone()">▶ clonar</devtool-button>
                    @if (cloneResult(); as r) {
                      <p class="dt-ok">round-trip {{ r.ms }} ms · copió {{ r.mb }} MB</p>
                      <p class="dt-ok">✓ main conserva su copia ({{ r.mb }} MB)</p>
                    } @else {
                      <p class="dt-hint">// postMessage(msg) · copia el buffer entero (cuesta para datos grandes)</p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('shared-worker') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // shared-worker · {{ swInstanceId() || '…' }} · clients: {{ swClients() }}{{ swSupported() ? '' : ' (simulado)' }}
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  @for (panel of swPanels(); track panel.label) {
                    <div class="dt-col">
                      <h3>conn {{ panel.label }}</h3>
                      <p class="dt-sub">puerto {{ panel.label }} · mismo worker</p>
                      <div class="dt-sw-count">{{ swCount() }}</div>
                      <div class="dt-send">
                        <devtool-button variant="solid" (pressed)="swInc(panel.label)">+1</devtool-button>
                        <devtool-button (pressed)="swReset(panel.label)">reset</devtool-button>
                        @if (swPanels().length > 1) {
                          <devtool-button (pressed)="swClose(panel.label)">close</devtool-button>
                        }
                      </div>
                      @if (panel.logs.length) {
                        <div class="dt-log">
                          @for (log of panel.logs.slice(-4); track log.id) {
                            <div class="dt-evt" data-status="ok">
                              <span class="dt-evt-in">{{ log.by }}</span>
                              <span class="dt-evt-text">++ → {{ log.count }}</span>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="dt-hint">// +1 en un panel salta en TODOS: es la misma variable del worker</p>
                      }
                    </div>
                  }
                </div>
                <div class="dt-panel-b">
                  <devtool-button (pressed)="swAdd()">+ abrir conexión</devtool-button>
                </div>
              </section>
            }
          }

          @if (content()?.takeaways; as tk) {
            <section class="dt-panel">
              <header class="dt-panel-h">// {{ tk.title.toLowerCase() }}</header>
              <div class="dt-panel-b">
                <ul class="dt-take">
                  @for (item of tk.items; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
                @if (tk.tip; as tip) {
                  <p class="dt-tip">→ {{ tip }}</p>
                }
              </div>
            </section>
          }

          @if (content()?.note; as note) {
            <section class="dt-panel">
              <header class="dt-panel-h">// nota</header>
              <p class="dt-panel-b dt-noteedu">{{ note }}</p>
            </section>
          }

          @if (snippets().length) {
            <section class="dt-panel">
              <header class="dt-panel-h">// código</header>
              <div class="dt-panel-b dt-code">
                @for (snip of snippets(); track snip.label) {
                  <devtool-code-block [label]="snip.label" [code]="snip.code" />
                }
              </div>
            </section>
          }
        } @else {
          <p class="dt-note">// este ejemplo todavía no expone un worker neutral</p>
        }
      } @else {
        <p class="dt-note">// ejemplo no encontrado</p>
      }
    </section>
  `,
  styles: [
    `
      .dt-ex {
        max-width: 900px;
        margin: 0 auto;
        font-family: var(--font-body);
      }
      .dt-back {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        text-decoration: none;
      }
      h1 {
        font-family: var(--font-mono);
        font-size: 18px;
        margin: 12px 0 2px;
        word-break: break-all;
      }
      .dt-order {
        color: var(--accent);
      }
      .dt-cat {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        text-transform: uppercase;
        margin: 0 0 20px;
      }
      .dt-summary {
        font-family: var(--font-body);
        font-size: 15px;
        line-height: 1.6;
        color: var(--ink);
        margin: 0 0 20px;
        max-width: 70ch;
      }
      .dt-panel {
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 16px;
        overflow: hidden;
      }
      .dt-watch {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.6;
        color: var(--ink-muted);
        border-bottom: var(--border-width) solid var(--border);
        margin: 0;
      }
      .dt-take {
        margin: 0;
        padding-left: 18px;
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.8;
        color: var(--ink);
      }
      .dt-tip {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--accent);
        margin: 12px 0 0;
      }
      .dt-noteedu {
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink);
        margin: 0;
      }
      .dt-panel-h {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        padding: 8px 14px;
        background: var(--surface-raised);
        border-bottom: var(--border-width) solid var(--border);
      }
      .dt-panel-b {
        padding: 16px;
      }
      .dt-cmp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        padding: 0;
      }
      .dt-col {
        padding: 16px;
      }
      .dt-col + .dt-col {
        border-left: var(--border-width) solid var(--border);
      }
      .dt-col h3 {
        font-family: var(--font-mono);
        font-size: 13px;
        margin: 0 0 2px;
        color: var(--ink);
      }
      .dt-sub {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        margin: 0 0 12px;
      }
      .dt-col devtool-button {
        display: inline-block;
        margin-bottom: 14px;
      }
      .dt-hint {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink-muted);
        border: 1px dashed var(--border);
        border-radius: var(--radius);
        padding: 16px 14px;
        min-height: 48px;
      }
      .dt-ok,
      .dt-bad {
        font-family: var(--font-mono);
        font-size: 12px;
        margin: 10px 0 0;
      }
      .dt-ok {
        color: var(--accent);
      }
      .dt-bad {
        color: var(--thread-blocked);
      }
      .dt-code {
        display: grid;
        gap: 12px;
      }

      /* ── message-exchange (ej. 03): consola/log ── */
      .dt-send {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .dt-prompt {
        font-family: var(--font-mono);
        font-weight: 700;
        color: var(--accent);
      }
      .dt-input {
        flex: 1 1 200px;
        font-family: var(--font-mono);
        font-size: 13px;
        padding: 8px 12px;
        background: var(--surface);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .dt-input::placeholder {
        color: var(--ink-muted);
      }
      .dt-log {
        display: grid;
        gap: 3px;
        font-family: var(--font-mono);
        font-size: 13px;
      }
      .dt-line {
        display: flex;
        gap: 10px;
        align-items: baseline;
        padding: 4px 10px;
        border-left: 2px solid transparent;
        animation: wwp-seg-in 0.18s ease-out;
      }
      .dt-line[data-dir='out'] {
        color: var(--ink);
        border-left-color: var(--ink-muted);
      }
      .dt-line[data-dir='in'] {
        color: var(--accent);
        border-left-color: var(--accent);
        background: var(--surface-raised);
      }
      .dt-line-tag {
        font-weight: 700;
        white-space: nowrap;
      }
      .dt-line-text {
        word-break: break-word;
      }
      .dt-line-meta {
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .dt-line-rt {
        margin-left: auto;
        padding-left: 12px;
        color: var(--ink-muted);
        white-space: nowrap;
      }

      /* ── offload (ej. 04): input N ── */
      .dt-nrow {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-family: var(--font-mono);
      }
      .dt-input-n {
        width: 130px;
        font-family: var(--font-mono);
        font-size: 13px;
        padding: 6px 10px;
        background: var(--surface);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .dt-nhint {
        font-size: 11px;
        color: var(--ink-muted);
      }

      /* ── error-handling (ej. 05): log de eventos ── */
      .dt-evt {
        display: flex;
        gap: 10px;
        align-items: baseline;
        padding: 4px 10px;
        border-left: 2px solid transparent;
        font-family: var(--font-mono);
        font-size: 13px;
        animation: wwp-seg-in 0.18s ease-out;
      }
      .dt-evt[data-status='ok'] {
        border-left-color: var(--accent);
      }
      .dt-evt[data-status='error'] {
        border-left-color: var(--thread-blocked);
        background: var(--surface-raised);
      }
      .dt-evt-mark {
        font-weight: 700;
      }
      .dt-evt[data-status='ok'] .dt-evt-mark {
        color: var(--accent);
      }
      .dt-evt[data-status='error'] .dt-evt-mark {
        color: var(--thread-blocked);
      }
      .dt-evt-in {
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .dt-evt-text {
        word-break: break-word;
      }

      /* ── shared-worker (ej. 08): contador ── */
      .dt-sw-count {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: clamp(40px, 7vw, 64px);
        line-height: 1;
        margin: 6px 0 12px;
        color: var(--accent);
      }

      /* ── lifecycle (ej. 06): barra de progreso ── */
      .dt-bar {
        height: 18px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        overflow: hidden;
        margin-bottom: 6px;
      }
      .dt-bar-fill {
        height: 100%;
        width: 0;
        background: var(--accent);
        transition: width 0.25s ease-out;
      }
      .dt-bar[data-status='terminated'] .dt-bar-fill {
        background: var(--thread-blocked);
      }
      .dt-bar-label {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        margin: 0 0 12px;
      }

      .dt-note {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
    `,
  ],
})
export class DevToolExampleLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly runner = inject(ExampleRunnerService);
  private readonly exchange = inject(MessageExchangeService);
  private readonly compute = inject(ComputeDemoService);
  private readonly errors = inject(ErrorDemoService);
  private readonly lifecycle = inject(LifecycleDemoService);
  private readonly transfer = inject(TransferDemoService);
  private readonly shared = inject(SharedWorkerDemoService);

  /** Payloads de muestra para la demo de manejo de errores (ej. 05). */
  private readonly VALID_PAYLOAD = '{"user":"ada","role":"admin"}';
  private readonly BROKEN_PAYLOAD = '{user: ada, role}';
  /** Pasos de la tarea larga del ejemplo 06. */
  private readonly LIFECYCLE_STEPS = 12;
  /** Tamaño del buffer de prueba del ejemplo 07. */
  protected readonly transferMb = 64;

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

  // error-handling (05)
  protected readonly errorEvents = this.errors.events;
  protected readonly errorBusy = this.errors.busy;

  // lifecycle (06)
  protected readonly lifeStatus = this.lifecycle.status;
  protected readonly lifeStep = this.lifecycle.step;
  protected readonly lifeSteps = this.lifecycle.steps;
  protected readonly lifePct = computed(() => {
    const total = this.lifeSteps();
    return total > 0 ? Math.round((this.lifeStep() / total) * 100) : 0;
  });

  // transferable (07)
  protected readonly transferResult = this.transfer.transferResult;
  protected readonly cloneResult = this.transfer.cloneResult;
  protected readonly transferBusy = this.transfer.busy;

  // shared-worker (08)
  protected readonly swInstanceId = this.shared.instanceId;
  protected readonly swClients = this.shared.clients;
  protected readonly swCount = this.shared.count;
  protected readonly swPanels = this.shared.panels;
  protected readonly swSupported = this.shared.supported;

  constructor() {
    effect(() => {
      const ex = this.example();
      if (ex?.demo === 'message-exchange') {
        this.exchange.open(ex);
      } else if (ex?.demo === 'error-handling') {
        this.errors.open(ex);
      } else if (ex?.demo === 'shared-worker') {
        this.shared.open(ex);
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

  sendOk(): void {
    this.errors.run(this.VALID_PAYLOAD);
  }

  sendFail(): void {
    this.errors.run(this.BROKEN_PAYLOAD);
  }

  resetErrors(): void {
    const ex = this.example();
    this.errors.reset();
    if (ex?.demo === 'error-handling') {
      this.errors.open(ex);
    }
  }

  startLife(): void {
    const ex = this.example();
    if (ex) {
      this.lifecycle.start(ex, this.LIFECYCLE_STEPS);
    }
  }

  terminateLife(): void {
    this.lifecycle.terminate();
  }

  resetLife(): void {
    this.lifecycle.reset();
  }

  runTransfer(): void {
    const ex = this.example();
    if (ex) {
      this.transfer.runTransfer(ex, this.transferMb);
    }
  }

  runClone(): void {
    const ex = this.example();
    if (ex) {
      this.transfer.runClone(ex, this.transferMb);
    }
  }

  swInc(label: string): void {
    this.shared.inc(label);
  }

  swReset(label: string): void {
    this.shared.reset(label);
  }

  swAdd(): void {
    this.shared.addPanel();
  }

  swClose(label: string): void {
    this.shared.closePanel(label);
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
