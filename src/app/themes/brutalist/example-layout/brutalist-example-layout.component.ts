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
        <h1>{{ ex.order }} · {{ content()?.title ?? ex.id }}</h1>
        <p class="b-cat">{{ ex.category }}</p>

        @if (content()?.summary; as summary) {
          <p class="b-summary">{{ summary }}</p>
        }

        @if (ex.workerFactory || ex.sharedWorkerFactory) {
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
                        @if (m.meta) {
                          <span class="b-msg-meta">· {{ m.meta }}</span>
                        }
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

            @case ('offload') {
              <brutalist-card title="Cómputo pesado">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'El mismo cálculo pesado en los dos hilos. Mirá cuál congela la UI.' }}
                </p>

                <div class="b-nrow">
                  <span class="b-nlabel">N =</span>
                  <input #n type="number" class="b-input-n" value="500000" min="10000" step="100000" />
                  <span class="b-nhint">contar primos hasta N (subilo para que el freeze dure más)</span>
                </div>

                <div class="b-cmp">
                  <div class="b-col">
                    <h3>En un Worker</h3>
                    <p class="b-col-sub">corre en otro hilo · la UI sigue fluida</p>
                    <brutalist-button variant="solid" [disabled]="computePhase() === 'worker'" (pressed)="computeWorker(n.value)">
                      Calcular en worker
                    </brutalist-button>
                    @if (computePhase() === 'worker') {
                      <p class="b-foot">calculando… ⏱ {{ liveMs() }} ms · la UI responde</p>
                    } @else if (workerResult(); as r) {
                      <p class="b-foot">✓ {{ r.count }} primos · {{ r.ms }} ms · la UI nunca se trabó</p>
                    } @else {
                      <p class="b-hint">Tocá: el cálculo corre en otro hilo y el cronómetro sigue subiendo — el main queda libre.</p>
                    }
                  </div>

                  <div class="b-col">
                    <h3>En el Main thread</h3>
                    <p class="b-col-sub">bloquea el hilo · la UI se congela</p>
                    <brutalist-button [disabled]="computePhase() === 'main'" (pressed)="computeMain(n.value)">
                      Calcular en el main
                    </brutalist-button>
                    @if (mainResult(); as r) {
                      <p class="b-foot b-danger">✗ {{ r.count }} primos · la página se congeló {{ r.ms }} ms</p>
                    } @else {
                      <p class="b-hint">Tocá y la página entera se congela hasta terminar: no podés ni scrollear.</p>
                    }
                  </div>
                </div>
              </brutalist-card>
            }

            @case ('error-handling') {
              <brutalist-card title="Errores que no rompen">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'Tirá una tarea que falla y mirá cómo el main captura el error sin romperse.' }}
                </p>

                <div class="b-send">
                  <brutalist-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                    Enviar JSON válido
                  </brutalist-button>
                  <brutalist-button [disabled]="errorBusy()" (pressed)="sendFail()">
                    Enviar JSON roto
                  </brutalist-button>
                  @if (errorEvents().length) {
                    <brutalist-button (pressed)="resetErrors()">Reset</brutalist-button>
                  }
                </div>

                @if (errorEvents().length) {
                  <div class="b-flow">
                    @for (ev of errorEvents(); track ev.id) {
                      <div class="b-evt" [attr.data-status]="ev.status">
                        <span class="b-evt-mark">{{ ev.status === 'ok' ? '✓' : '✗' }}</span>
                        <code class="b-evt-in">{{ ev.input }}</code>
                        @if (ev.status === 'ok') {
                          <span class="b-evt-text">{{ ev.keys }} claves parseadas</span>
                        } @else {
                          <span class="b-evt-text">{{ ev.message }}</span>
                        }
                      </div>
                    }
                  </div>
                  <p class="b-foot">▸ La app sigue viva: el worker no se murió, seguí tirando tareas.</p>
                } @else {
                  <p class="b-hint">Probá el JSON válido (✓ devuelve las claves) y después el roto (✗ el main lo captura con onerror). La página no se rompe.</p>
                }
              </brutalist-card>
            }

            @case ('lifecycle') {
              <brutalist-card title="Ciclo de vida">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'Arrancá la tarea larga y cortala a mitad: el trabajo en curso se pierde.' }}
                </p>

                <div class="b-send">
                  <brutalist-button variant="solid" [disabled]="lifeStatus() === 'running'" (pressed)="startLife()">
                    Iniciar tarea
                  </brutalist-button>
                  <brutalist-button [disabled]="lifeStatus() !== 'running'" (pressed)="terminateLife()">
                    Terminar (terminate)
                  </brutalist-button>
                  @if (lifeStatus() !== 'idle') {
                    <brutalist-button (pressed)="resetLife()">Reiniciar</brutalist-button>
                  }
                </div>

                <div class="b-bar" [attr.data-status]="lifeStatus()">
                  <div class="b-bar-fill" [style.width.%]="lifePct()"></div>
                </div>
                <p class="b-bar-label">paso {{ lifeStep() }} de {{ lifeSteps() || '—' }}</p>

                @switch (lifeStatus()) {
                  @case ('idle') {
                    <p class="b-hint">Tocá Iniciar: el worker corre una tarea larga por pasos. Cortala a mitad con Terminar y mirá qué pasa.</p>
                  }
                  @case ('running') {
                    <p class="b-foot">▶ corriendo… el worker está vivo emitiendo progreso.</p>
                  }
                  @case ('terminated') {
                    <p class="b-foot b-danger">✗ Terminado en el paso {{ lifeStep() }}/{{ lifeSteps() }} — el trabajo en curso se descartó y el worker ya no existe. Iniciá de nuevo: se crea uno nuevo.</p>
                  }
                  @case ('done') {
                    <p class="b-foot">✓ Completado {{ lifeSteps() }}/{{ lifeSteps() }} — el worker terminó su trabajo y se cerró solo (self.close).</p>
                  }
                }
              </brutalist-card>
            }

            @case ('transferable') {
              <brutalist-card title="Transferir vs Clonar">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'El mismo buffer, dos formas de mandarlo. Mirá el round-trip y qué le pasa al buffer del main.' }}
                </p>
                <p class="b-bar-label">buffer de prueba: {{ transferMb }} MB</p>

                <div class="b-cmp">
                  <div class="b-col">
                    <h3>Transferir (zero-copy)</h3>
                    <p class="b-col-sub">cambia de dueño · no copia</p>
                    <brutalist-button variant="solid" [disabled]="transferBusy()" (pressed)="runTransfer()">
                      Transferir buffer
                    </brutalist-button>
                    @if (transferResult(); as r) {
                      <p class="b-foot">✓ round-trip {{ r.ms }} ms — instantáneo aunque sea grande</p>
                      <p class="b-foot b-danger">⚠ el buffer del main quedó DETACHED (0 B): cambió de dueño</p>
                    } @else {
                      <p class="b-hint">Pasás el buffer en la transfer list: no se copia, pero el main pierde la propiedad (queda en 0 bytes).</p>
                    }
                  </div>

                  <div class="b-col">
                    <h3>Clonar (structured clone)</h3>
                    <p class="b-col-sub">copia byte por byte · el main lo conserva</p>
                    <brutalist-button [disabled]="transferBusy()" (pressed)="runClone()">Clonar buffer</brutalist-button>
                    @if (cloneResult(); as r) {
                      <p class="b-foot">round-trip {{ r.ms }} ms — más lento: copió {{ r.mb }} MB</p>
                      <p class="b-foot">✓ el main conserva su copia intacta ({{ r.mb }} MB)</p>
                    } @else {
                      <p class="b-hint">Sin transfer list, postMessage copia el buffer entero. El main se queda con el suyo, pero la copia cuesta.</p>
                    }
                  </div>
                </div>
              </brutalist-card>
            }

            @case ('shared-worker') {
              <brutalist-card title="Un worker, varias conexiones">
                <p class="b-lead">
                  {{ content()?.whatToWatch ?? 'El mismo contador en los dos paneles: es UNA variable adentro del worker.' }}
                </p>

                <div class="b-sw-banner">
                  <span class="b-sw-id">⬡ SharedWorker {{ swInstanceId() || '…' }}</span>
                  <span class="b-sw-clients">clientes conectados: {{ swClients() }}</span>
                  @if (!swSupported()) {
                    <span class="b-sw-sim">backend simulado · tu navegador no soporta SharedWorker</span>
                  }
                </div>

                <div class="b-cmp b-sw-cmp">
                  @for (panel of swPanels(); track panel.label) {
                    <div class="b-col">
                      <h3>conexión {{ panel.label }}</h3>
                      <p class="b-col-sub">puerto {{ panel.label }} · mismo worker</p>
                      <div class="b-sw-count">{{ swCount() }}</div>
                      <div class="b-send">
                        <brutalist-button variant="solid" (pressed)="swInc(panel.label)">+1</brutalist-button>
                        <brutalist-button (pressed)="swReset(panel.label)">reset</brutalist-button>
                        @if (swPanels().length > 1) {
                          <brutalist-button (pressed)="swClose(panel.label)">cerrar</brutalist-button>
                        }
                      </div>
                      @if (panel.logs.length) {
                        <div class="b-flow">
                          @for (log of panel.logs.slice(-4); track log.id) {
                            <div class="b-evt" data-status="ok">
                              <span class="b-evt-in">{{ log.by }}</span>
                              <span class="b-evt-text">sumó → {{ log.count }}</span>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="b-hint">Tocá +1: el número salta en los DOS paneles. Es el mismo contador, no dos copias.</p>
                      }
                    </div>
                  }
                </div>

                <brutalist-button (pressed)="swAdd()">+ abrir otra conexión</brutalist-button>
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
      /* ── offload (ej. 04): input N ── */
      .b-nrow {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        font-family: var(--font-mono);
      }
      .b-nlabel {
        font-weight: 700;
      }
      .b-input-n {
        width: 140px;
        font-family: var(--font-mono);
        font-size: 14px;
        padding: 8px 12px;
        background: var(--surface-raised);
        color: var(--ink);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        outline: none;
      }
      .b-nhint {
        font-size: 11px;
        color: var(--ink-muted);
      }
      .b-flow {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* ── error-handling (ej. 05): log de eventos ── */
      .b-evt {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 12px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.5;
        animation: wwp-seg-in 0.18s ease-out;
      }
      .b-evt-mark {
        font-weight: 700;
      }
      .b-evt[data-status='ok'] .b-evt-mark {
        color: var(--thread-worker);
      }
      .b-evt[data-status='error'] {
        border-color: var(--thread-blocked);
      }
      .b-evt[data-status='error'] .b-evt-mark {
        color: var(--thread-blocked);
      }
      .b-evt-in {
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .b-evt-text {
        word-break: break-word;
      }

      /* ── shared-worker (ej. 08): banner + contador ── */
      .b-sw-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 18px;
        padding: 12px 14px;
        margin-bottom: 18px;
        background: var(--ink);
        color: var(--surface);
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 700;
      }
      .b-sw-clients {
        padding: 2px 8px;
        background: var(--accent);
        color: var(--surface);
      }
      .b-sw-sim {
        font-weight: 400;
        font-size: 11px;
        color: var(--thread-blocked);
        background: var(--surface);
        padding: 2px 8px;
      }
      .b-sw-cmp {
        margin-bottom: 16px;
      }
      .b-sw-count {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(48px, 9vw, 80px);
        line-height: 1;
        margin: 4px 0 12px;
        color: var(--ink);
      }

      /* ── lifecycle (ej. 06): barra de progreso ── */
      .b-bar {
        height: 22px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        margin-bottom: 8px;
        overflow: hidden;
      }
      .b-bar-fill {
        height: 100%;
        width: 0;
        background: var(--thread-worker);
        transition: width 0.25s ease-out;
      }
      .b-bar[data-status='terminated'] .b-bar-fill {
        background: var(--thread-blocked);
      }
      .b-bar-label {
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
        margin: 0 0 12px;
        color: var(--ink);
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
      .b-msg-meta {
        opacity: 0.6;
        white-space: nowrap;
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
  private readonly compute = inject(ComputeDemoService);
  private readonly errors = inject(ErrorDemoService);
  private readonly lifecycle = inject(LifecycleDemoService);
  private readonly transfer = inject(TransferDemoService);
  private readonly shared = inject(SharedWorkerDemoService);
  private readonly contentSvc = inject(ExampleContentService);

  /** Payloads de muestra para la demo de manejo de errores (ej. 05). */
  private readonly VALID_PAYLOAD = '{"user":"ada","role":"admin"}';
  private readonly BROKEN_PAYLOAD = '{user: ada, role}';
  /** Pasos de la tarea larga del ejemplo 06. */
  private readonly LIFECYCLE_STEPS = 12;
  /** Tamaño del buffer de prueba del ejemplo 07. */
  protected readonly transferMb = 64;

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
    // Abre el worker del ejemplo activo (no-op si ya está abierto para el mismo
    // ejemplo → la conversación/log sobrevive al cambio de theme).
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

  resetCompute(): void {
    this.compute.reset();
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
