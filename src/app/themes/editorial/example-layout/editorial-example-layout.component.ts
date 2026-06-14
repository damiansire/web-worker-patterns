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
import { WorkerLimitsDemoService } from '../../../core/services/worker-limits-demo.service';
import { WorkerPoolDemoService } from '../../../core/services/worker-pool-demo.service';
import { BackpressureDemoService } from '../../../core/services/backpressure-demo.service';
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
        <h1>{{ content()?.title ?? ex.id }}</h1>

        @if (ex.workerFactory || ex.sharedWorkerFactory) {
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

            @case ('offload') {
              <div class="e-nrow">
                <label class="e-nlabel" for="e-n">Contar primos hasta N =</label>
                <input #n id="e-n" class="e-input-n" type="number" value="500000" min="10000" step="100000" />
                <span class="e-nhint">subilo y el freeze del main dura más</span>
              </div>
              <div class="e-cmp">
                <section class="e-col">
                  <h2>En un Worker</h2>
                  <p class="e-sub">corre en otro hilo · la UI sigue fluida</p>
                  <editorial-button variant="solid" [disabled]="computePhase() === 'worker'" (pressed)="computeWorker(n.value)">
                    Calcular en worker
                  </editorial-button>
                  @if (computePhase() === 'worker') {
                    <p class="e-foot">calculando… {{ liveMs() }} ms · la UI responde mientras tanto</p>
                  } @else if (workerResult(); as r) {
                    <p class="e-foot e-ok"><span class="e-ok-mark">✓</span> {{ r.count }} primos · {{ r.ms }} ms · la UI nunca se trabó</p>
                  } @else {
                    <p class="e-hint">Tocá: el cálculo corre en otro hilo y el cronómetro sigue subiendo en vivo.</p>
                  }
                </section>

                <section class="e-col">
                  <h2>En el Main thread</h2>
                  <p class="e-sub">bloquea el hilo · la página se congela</p>
                  <editorial-button [disabled]="computePhase() === 'main'" (pressed)="computeMain(n.value)">Calcular en el main</editorial-button>
                  @if (mainResult(); as r) {
                    <p class="e-foot e-danger"><span class="e-bad-mark">✗</span> {{ r.count }} primos · la página se congeló {{ r.ms }} ms</p>
                  } @else {
                    <p class="e-hint">Tocá y la página entera se congela hasta terminar: no podés ni scrollear.</p>
                  }
                </section>
              </div>
            }

            @case ('error-handling') {
              <div class="e-send">
                <editorial-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                  Enviar JSON válido
                </editorial-button>
                <editorial-button [disabled]="errorBusy()" (pressed)="sendFail()">Enviar JSON roto</editorial-button>
                @if (errorEvents().length) {
                  <editorial-button (pressed)="resetErrors()">Reiniciar</editorial-button>
                }
              </div>
              @if (errorEvents().length) {
                <div class="e-dialogue">
                  @for (ev of errorEvents(); track ev.id) {
                    <div class="e-evt" [attr.data-status]="ev.status">
                      <p class="e-evt-line">
                        <span class="e-evt-mark">{{ ev.status === 'ok' ? '✓' : '✗' }}</span>
                        <code class="e-evt-in">{{ ev.input }}</code>
                      </p>
                      @if (ev.status === 'ok') {
                        <p class="e-evt-text">Parseado: {{ ev.keys }} claves de primer nivel.</p>
                      } @else {
                        <p class="e-evt-text e-evt-err">{{ ev.message }}</p>
                      }
                    </div>
                  }
                </div>
                <p class="e-foot">La app sigue viva: el worker no se murió, podés seguir corriendo tareas.</p>
              } @else {
                <p class="e-hint">Enviá un JSON válido (✓ devuelve sus claves) y después uno roto (✗ el main lo captura con onerror). La página no se rompe.</p>
              }
            }

            @case ('lifecycle') {
              <div class="e-send">
                <editorial-button variant="solid" [disabled]="lifeStatus() === 'running'" (pressed)="startLife()">
                  Iniciar tarea
                </editorial-button>
                <editorial-button [disabled]="lifeStatus() !== 'running'" (pressed)="terminateLife()">
                  Terminar
                </editorial-button>
                @if (lifeStatus() !== 'idle') {
                  <editorial-button (pressed)="resetLife()">Reiniciar</editorial-button>
                }
              </div>

              <div class="e-bar" [attr.data-status]="lifeStatus()">
                <div class="e-bar-fill" [style.width.%]="lifePct()"></div>
              </div>
              <p class="e-bar-label">paso {{ lifeStep() }} de {{ lifeSteps() || '—' }}</p>

              @switch (lifeStatus()) {
                @case ('idle') {
                  <p class="e-hint">Iniciá la tarea: el worker avanza por pasos. Cortala a mitad con Terminar y mirá qué queda.</p>
                }
                @case ('running') {
                  <p class="e-foot">El worker está vivo, emitiendo su progreso paso a paso.</p>
                }
                @case ('terminated') {
                  <p class="e-foot e-danger">Terminado en el paso {{ lifeStep() }}/{{ lifeSteps() }}: el trabajo en curso se descartó y el worker ya no existe. Para volver a correr, Iniciar crea uno nuevo.</p>
                }
                @case ('done') {
                  <p class="e-foot">Completado, {{ lifeSteps() }}/{{ lifeSteps() }}: el worker terminó su trabajo y se cerró solo con self.close().</p>
                }
              }
            }

            @case ('transferable') {
              <p class="e-bar-label">Buffer de prueba: {{ transferMb }} MB</p>
              <div class="e-cmp">
                <section class="e-col">
                  <h2>Transferir (zero-copy)</h2>
                  <p class="e-sub">cambia de dueño · no copia</p>
                  <editorial-button variant="solid" [disabled]="transferBusy()" (pressed)="runTransfer()">
                    Transferir buffer
                  </editorial-button>
                  @if (transferResult(); as r) {
                    <p class="e-foot"><span class="e-ok-mark">✓</span> round-trip {{ r.ms }} ms — instantáneo aunque sea grande</p>
                    <p class="e-foot e-danger">El buffer del main quedó detached (0 B): perdió la propiedad.</p>
                  } @else {
                    <p class="e-hint">Pasás el buffer en la transfer list: no se copia, pero el main pierde la propiedad y queda en 0 bytes.</p>
                  }
                </section>

                <section class="e-col">
                  <h2>Clonar (structured clone)</h2>
                  <p class="e-sub">copia byte por byte · el main lo conserva</p>
                  <editorial-button [disabled]="transferBusy()" (pressed)="runClone()">Clonar buffer</editorial-button>
                  @if (cloneResult(); as r) {
                    <p class="e-foot">round-trip {{ r.ms }} ms — más lento: copió {{ r.mb }} MB</p>
                    <p class="e-foot">El main conserva su copia intacta ({{ r.mb }} MB).</p>
                  } @else {
                    <p class="e-hint">Sin transfer list, postMessage copia el buffer entero. El main se queda con el suyo, pero la copia cuesta.</p>
                  }
                </section>
              </div>
            }

            @case ('shared-worker') {
              <div class="e-sw-banner">
                <span class="e-sw-id">SharedWorker {{ swInstanceId() || '…' }}</span>
                <span class="e-sw-clients">clientes conectados: {{ swClients() }}</span>
                @if (!swSupported()) {
                  <span class="e-sw-sim">backend simulado · el navegador no soporta SharedWorker</span>
                }
              </div>
              <div class="e-cmp">
                @for (panel of swPanels(); track panel.label) {
                  <section class="e-col">
                    <h2>Conexión {{ panel.label }}</h2>
                    <p class="e-sub">puerto {{ panel.label }} · mismo worker</p>
                    <div class="e-sw-count">{{ swCount() }}</div>
                    <div class="e-send">
                      <editorial-button variant="solid" (pressed)="swInc(panel.label)">+1</editorial-button>
                      <editorial-button (pressed)="swReset(panel.label)">Reset</editorial-button>
                      @if (swPanels().length > 1) {
                        <editorial-button (pressed)="swClose(panel.label)">Cerrar</editorial-button>
                      }
                    </div>
                    @if (panel.logs.length) {
                      <div class="e-dialogue">
                        @for (log of panel.logs.slice(-4); track log.id) {
                          <div class="e-evt" data-status="ok">
                            <p class="e-evt-line"><span class="e-evt-in">{{ log.by }}</span> sumó → {{ log.count }}</p>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="e-hint">Sumá acá: el número salta en los dos paneles. Es el mismo contador, no dos copias.</p>
                    }
                  </section>
                }
              </div>
              <editorial-button (pressed)="swAdd()">Abrir otra conexión</editorial-button>
            }

            @case ('worker-limits') {
              <p class="e-lim-cpu">Tu CPU: {{ hardwareConcurrency() }} núcleos lógicos</p>
              <div class="e-send">
                <editorial-button variant="solid" [disabled]="limitRunning()" (pressed)="runLimits()">
                  {{ limitRunning() ? 'Corriendo ' + currentWorkers() + '× …' : 'Correr la escala' }}
                </editorial-button>
                @if (limitRuns().length && !limitRunning()) {
                  <editorial-button (pressed)="resetLimits()">Reiniciar</editorial-button>
                }
              </div>
              @if (limitRuns().length) {
                <div class="e-lim">
                  @for (run of limitRuns(); track run.workers) {
                    <div class="e-lim-row" [attr.data-over]="run.workers > hardwareConcurrency()">
                      <span class="e-lim-k">{{ run.workers }}×</span>
                      <div class="e-lim-bar"><div class="e-lim-fill" [style.width.%]="limitPct(run.ms)"></div></div>
                      <span class="e-lim-ms">{{ run.ms }} ms</span>
                    </div>
                  }
                </div>
                <p class="e-foot">Plano hasta {{ hardwareConcurrency() }} (tus núcleos); pasado eso el tiempo trepa — más workers no ayudan.</p>
              } @else {
                <p class="e-hint">Corré 1, 2, 4, 8 y 16 workers a la vez con el mismo cómputo. El tiempo se mantiene plano mientras entren en tus núcleos.</p>
              }
            }

            @case ('worker-pool') {
              <div class="e-send">
                <editorial-button variant="solid" [disabled]="poolRunning()" (pressed)="runPool()">
                  {{ poolRunning() ? 'Procesando… ' + poolProcessed() + '/' + poolTaskCount : 'Procesar la cola' }}
                </editorial-button>
                @if (poolTasks().length && !poolRunning()) {
                  <editorial-button (pressed)="resetPool()">Reiniciar</editorial-button>
                }
              </div>

              @if (poolTasks().length) {
                <p class="e-lim-cpu">La cola — {{ poolProcessed() }} / {{ poolTaskCount }} hechas</p>
                <div class="e-pool-queue">
                  @for (task of poolTasks(); track task.id) {
                    <span class="e-pool-task" [attr.data-state]="task.state">
                      {{ task.state === 'done' ? '✓' : 'T' + task.id }}
                    </span>
                  }
                </div>

                <p class="e-lim-cpu">El pool — {{ poolSize() }} workers, se reusan</p>
                <div class="e-pool-slots">
                  @for (slot of poolSlots(); track slot.id) {
                    <div class="e-pool-slot" [attr.data-busy]="slot.busy">
                      <span class="e-pool-slot-w">W{{ slot.id }}</span>
                      <span class="e-pool-slot-task">{{ slot.busy ? 'T' + slot.taskId : 'libre' }}</span>
                      <span class="e-pool-slot-x">× {{ slot.processed }}</span>
                    </div>
                  }
                </div>

                <p class="e-foot">Con pool: {{ workersCreated() }} workers creados, reusados {{ poolTaskCount }} veces.</p>
                <p class="e-foot e-danger">Sin pool: {{ spawnedWithoutPool }} workers, uno por tarea — el ejemplo 09 mostró por qué eso no escala.</p>
              } @else {
                <p class="e-hint">24 tareas, 4 workers. Tocá Procesar: los 4 se reusan para drenar la cola entera (× cuenta cuántas despachó cada uno). No se crea un worker por tarea.</p>
              }
            }

            @case ('backpressure') {
              <div class="e-cmp">
                <section class="e-col">
                  <h2>Sin backpressure</h2>
                  <p class="e-sub">disparás las {{ bpTotal }} de una</p>
                  <editorial-button variant="solid" [disabled]="bpMode() !== 'idle'" (pressed)="runNaive()">
                    Disparar todo
                  </editorial-button>
                  @if (bpMode() === 'naive') {
                    <p class="e-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (naivePeak(); as p) {
                    <div class="e-bp-bar" data-kind="naive"><div class="e-bp-fill" [style.width.%]="bpPctOf(p)"></div></div>
                    <p class="e-foot e-danger">Pico de cola: {{ p }} mensajes en espera.</p>
                  } @else {
                    <p class="e-hint">El worker procesa de a uno; el resto se encola sin techo.</p>
                  }
                </section>

                <section class="e-col">
                  <h2>Con backpressure</h2>
                  <p class="e-sub">ventana de {{ bpWindow }} · esperás el ack</p>
                  <editorial-button [disabled]="bpMode() !== 'idle'" (pressed)="runBackpressure()">Con control de flujo</editorial-button>
                  @if (bpMode() === 'backpressure') {
                    <p class="e-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (bpPeak(); as p) {
                    <div class="e-bp-bar" data-kind="bp"><div class="e-bp-fill" [style.width.%]="bpPctOf(p)"></div></div>
                    <p class="e-foot">Pico de cola: {{ p }} — nunca pasó la ventana.</p>
                  } @else {
                    <p class="e-hint">Mandás {{ bpWindow }}, esperás el ack, mandás la próxima: la cola queda acotada.</p>
                  }
                </section>
              </div>
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
      .e-ok {
        color: var(--ink);
        font-style: normal;
      }
      .e-ok-mark {
        color: var(--thread-worker);
        font-weight: 700;
      }
      .e-bad-mark {
        font-weight: 700;
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

      /* ── offload (ej. 04): entrada N ── */
      .e-nrow {
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }
      .e-nlabel {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 18px;
      }
      .e-input-n {
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
      .e-input-n:focus {
        border-color: var(--accent);
      }
      .e-nhint {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
      }

      /* ── error-handling (ej. 05): bitácora de corridas ── */
      .e-evt {
        padding: 12px 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        animation: wwp-seg-in 0.18s ease-out;
      }
      .e-evt[data-status='error'] {
        border-color: var(--thread-blocked);
      }
      .e-evt-line {
        margin: 0;
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-family: var(--font-body);
        font-size: 16px;
      }
      .e-evt-mark {
        font-weight: 700;
      }
      .e-evt[data-status='ok'] .e-evt-mark {
        color: var(--thread-worker);
      }
      .e-evt[data-status='error'] .e-evt-mark {
        color: var(--thread-blocked);
      }
      .e-evt-in {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--ink-muted);
        word-break: break-all;
      }
      .e-evt-text {
        margin: 6px 0 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--ink-muted);
      }
      .e-evt-err {
        font-family: var(--font-mono);
        font-style: normal;
        font-size: 13px;
        color: var(--thread-blocked);
        word-break: break-word;
      }

      /* ── backpressure (ej. 11): barra de pico ── */
      .e-bp-bar {
        height: 16px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        margin: 12px 0 6px;
        overflow: hidden;
      }
      .e-bp-fill {
        height: 100%;
        transition: width 0.3s ease-out;
      }
      .e-bp-bar[data-kind='naive'] .e-bp-fill {
        background: var(--thread-blocked);
      }
      .e-bp-bar[data-kind='bp'] .e-bp-fill {
        background: var(--thread-worker);
      }

      /* ── worker-pool (ej. 10): cola + slots ── */
      .e-pool-queue {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 4px 0 20px;
      }
      .e-pool-task {
        min-width: 34px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px;
        font-family: var(--font-mono);
        font-size: 12px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        color: var(--ink-muted);
      }
      .e-pool-task[data-state='running'] {
        background: var(--thread-worker);
        color: var(--surface);
        border-color: var(--thread-worker);
      }
      .e-pool-task[data-state='done'] {
        opacity: 0.4;
      }
      .e-pool-slots {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 4px 0 18px;
      }
      .e-pool-slot {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 12px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        font-family: var(--font-mono);
        font-size: 13px;
      }
      .e-pool-slot[data-busy='true'] {
        border-color: var(--accent);
      }
      .e-pool-slot-w {
        font-weight: 700;
        color: var(--accent);
      }
      .e-pool-slot-x {
        color: var(--ink-muted);
      }

      /* ── worker-limits (ej. 09): filas de tiempo ── */
      .e-lim-cpu {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        color: var(--ink-muted);
        margin: 0 0 16px;
      }
      .e-lim {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 4px 0 14px;
      }
      .e-lim-row {
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: var(--font-mono);
        font-size: 14px;
      }
      .e-lim-k {
        width: 40px;
        text-align: right;
      }
      .e-lim-bar {
        flex: 1;
        height: 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        overflow: hidden;
      }
      .e-lim-fill {
        height: 100%;
        background: var(--thread-worker);
        transition: width 0.3s ease-out;
      }
      .e-lim-row[data-over='true'] .e-lim-fill {
        background: var(--thread-blocked);
      }
      .e-lim-ms {
        width: 64px;
        color: var(--ink-muted);
      }

      /* ── shared-worker (ej. 08): banner + contador ── */
      .e-sw-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px 18px;
        padding: 12px 16px;
        margin-bottom: 24px;
        border: var(--border-width) solid var(--accent);
        border-radius: var(--radius);
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
      }
      .e-sw-id {
        font-weight: 800;
        font-style: normal;
      }
      .e-sw-clients {
        color: var(--accent);
      }
      .e-sw-sim {
        font-size: 12px;
        color: var(--thread-blocked);
      }
      .e-sw-count {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: clamp(52px, 9vw, 88px);
        line-height: 1;
        margin: 4px 0 14px;
        color: var(--ink);
      }

      /* ── lifecycle (ej. 06): barra de progreso ── */
      .e-bar {
        height: 20px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        overflow: hidden;
        margin-bottom: 8px;
      }
      .e-bar-fill {
        height: 100%;
        width: 0;
        background: var(--thread-worker);
        transition: width 0.25s ease-out;
      }
      .e-bar[data-status='terminated'] .e-bar-fill {
        background: var(--thread-blocked);
      }
      .e-bar-label {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        margin: 0 0 16px;
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
  private readonly compute = inject(ComputeDemoService);
  private readonly errors = inject(ErrorDemoService);
  private readonly lifecycle = inject(LifecycleDemoService);
  private readonly transfer = inject(TransferDemoService);
  private readonly shared = inject(SharedWorkerDemoService);
  private readonly limits = inject(WorkerLimitsDemoService);
  private readonly pool = inject(WorkerPoolDemoService);
  private readonly backpressure = inject(BackpressureDemoService);

  /** Payloads de muestra para la demo de manejo de errores (ej. 05). */
  private readonly VALID_PAYLOAD = '{"user":"ada","role":"admin"}';
  private readonly BROKEN_PAYLOAD = '{user: ada, role}';
  /** Pasos de la tarea larga del ejemplo 06. */
  private readonly LIFECYCLE_STEPS = 12;
  /** Tamaño del buffer de prueba del ejemplo 07. */
  protected readonly transferMb = 64;
  /** Trabajo (primos hasta N) que corre cada worker en el ejemplo 09. */
  private readonly LIMITS_WORK = 600_000;
  /** Trabajo por tarea del pool (ej. 10): mediano, para que el drenado se vea. */
  private readonly POOL_WORK = 400_000;
  /** Trabajo por mensaje del ejemplo 11 (consumidor algo lento). */
  private readonly BP_WORK = 150_000;

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

  // worker-limits (09)
  protected readonly hardwareConcurrency = this.limits.hardwareConcurrency;
  protected readonly limitRuns = this.limits.runs;
  protected readonly limitRunning = this.limits.running;
  protected readonly currentWorkers = this.limits.currentWorkers;
  private readonly limitMaxMs = computed(() =>
    Math.max(1, ...this.limitRuns().map((r) => r.ms)),
  );

  // worker-pool (10)
  protected readonly poolTasks = this.pool.tasks;
  protected readonly poolSlots = this.pool.slots;
  protected readonly poolRunning = this.pool.running;
  protected readonly poolProcessed = this.pool.processed;
  protected readonly poolSize = this.pool.poolSize;
  protected readonly poolTaskCount = this.pool.taskCount;
  protected readonly workersCreated = this.pool.workersCreated;
  protected readonly spawnedWithoutPool = this.pool.spawnedWithoutPool;

  // backpressure (11)
  protected readonly bpMode = this.backpressure.mode;
  protected readonly bpPending = this.backpressure.pending;
  protected readonly naivePeak = this.backpressure.naivePeak;
  protected readonly bpPeak = this.backpressure.bpPeak;
  protected readonly bpTotal = this.backpressure.total;
  protected readonly bpWindow = this.backpressure.windowSize;

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

  runLimits(): void {
    const ex = this.example();
    if (ex) {
      void this.limits.runScale(ex, this.LIMITS_WORK);
    }
  }

  resetLimits(): void {
    this.limits.reset();
  }

  limitPct(ms: number): number {
    return Math.round((ms / this.limitMaxMs()) * 100);
  }

  runPool(): void {
    const ex = this.example();
    if (ex) {
      this.pool.start(ex, this.POOL_WORK);
    }
  }

  resetPool(): void {
    this.pool.reset();
  }

  runNaive(): void {
    const ex = this.example();
    if (ex) {
      this.backpressure.runNaive(ex, this.BP_WORK);
    }
  }

  runBackpressure(): void {
    const ex = this.example();
    if (ex) {
      this.backpressure.runBackpressure(ex, this.BP_WORK);
    }
  }

  bpPctOf(peak: number): number {
    return Math.max(4, Math.round((peak / this.bpTotal) * 100));
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
