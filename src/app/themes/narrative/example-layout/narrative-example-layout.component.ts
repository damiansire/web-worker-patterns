import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  viewChild,
  ElementRef,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { CloneCostChartComponent } from '../../../ui-primitives/clone-cost-chart.component';
import { NarrativeButton } from '../primitives/narrative-button.component';
import { NarrativeCodeBlock } from '../primitives/narrative-code-block.component';
import { NARRATIVE_PROVIDERS } from '../narrative.providers';

/** Example-layout narrative. Hilos como contraste worker-vs-main (#2) + código. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'narrative-example-layout',
  imports: [
    NgComponentOutlet,
    RouterLink,
    NarrativeButton,
    NarrativeCodeBlock,
    CloneCostChartComponent,
  ],
  providers: [NARRATIVE_PROVIDERS, ExampleLayoutController],
  template: `
    <article class="n-ex">
      <a class="n-back" routerLink="/t/narrative">← volver al sumario</a>

      @if (example(); as ex) {
        <p class="n-chap">Capítulo {{ ex.order }} · {{ ex.category }}</p>
        <h1>{{ content()?.title ?? ex.id }}</h1>

        @if (ex.workerFactory || ex.sharedWorkerFactory || content()) {
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
                  <narrative-button
                    variant="solid"
                    [disabled]="phase() === 'worker'"
                    (pressed)="runWorker()"
                  >
                    Ejecutar en worker
                  </narrative-button>
                  @if (workerLanes(); as wl) {
                    <ng-container
                      *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }"
                    />
                    <p class="n-foot">{{ workerTicks() }} ticks · la UI nunca se trabó</p>
                  } @else {
                    <p class="n-hint">
                      Tocá para ver el worker emitir ticks mientras el main queda libre.
                    </p>
                  }
                </section>

                <section class="n-col">
                  <h2>En el Main thread</h2>
                  <p class="n-sub">el main se bloquea · la UI se congela ~2,5s</p>
                  <narrative-button [disabled]="phase() === 'main'" (pressed)="runMain()"
                    >Bloquear main</narrative-button
                  >
                  @if (mainLanes(); as ml) {
                    <ng-container
                      *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }"
                    />
                    <p class="n-foot n-danger">
                      se congeló · {{ mainTicks() }} ticks que no se pintaron
                    </p>
                  } @else {
                    <p class="n-hint">
                      Tocá y la página se congela: el contador no actualiza, los clicks mueren.
                    </p>
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
                  aria-label="Mensaje para enviar al worker"
                  (keyup.enter)="send(msg.value); msg.value = ''"
                />
                <narrative-button
                  variant="solid"
                  [disabled]="pending()"
                  (pressed)="send(msg.value); msg.value = ''"
                >
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
                        <span class="n-msg-who">{{
                          m.direction === 'out' ? 'Main →' : '← Worker'
                        }}</span>
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
                      <p class="n-msg-line">
                        <span class="n-msg-who">← Worker</span>
                        <span class="n-msg-text">procesando…</span>
                      </p>
                    </div>
                  }
                </div>
              } @else {
                <p class="n-hint">
                  Enviá un mensaje: viaja al worker (→) y vuelve la respuesta (←) con su round-trip.
                </p>
              }
            }

            @case ('offload') {
              <div class="n-nrow">
                <label class="n-nlabel" for="n-n">Contar primos hasta N =</label>
                <input
                  #n
                  id="n-n"
                  class="n-input-n"
                  type="number"
                  value="500000"
                  min="10000"
                  step="100000"
                />
                <span class="n-nhint">subilo y el freeze del main dura más</span>
              </div>
              <div class="n-cmp">
                <section class="n-col">
                  <h2>En un Worker</h2>
                  <p class="n-sub">corre en otro hilo · la UI sigue fluida</p>
                  <narrative-button
                    variant="solid"
                    [disabled]="computePhase() === 'worker'"
                    (pressed)="computeWorker(n.value)"
                  >
                    Calcular en worker
                  </narrative-button>
                  @if (computePhase() === 'worker') {
                    <p class="n-foot">
                      calculando… {{ liveMs() }} ms · la UI responde mientras tanto
                    </p>
                  } @else if (workerResult(); as r) {
                    <p class="n-foot n-ok">
                      <span class="n-ok-mark">✓</span> {{ r.count }} primos · {{ r.ms }} ms · la UI
                      nunca se trabó
                    </p>
                  } @else {
                    <p class="n-hint">
                      Tocá: el cálculo corre en otro hilo y el cronómetro sigue subiendo en vivo.
                    </p>
                  }
                </section>

                <section class="n-col">
                  <h2>En el Main thread</h2>
                  <p class="n-sub">bloquea el hilo · la página se congela</p>
                  <narrative-button
                    [disabled]="computePhase() === 'main'"
                    (pressed)="computeMain(n.value)"
                    >Calcular en el main</narrative-button
                  >
                  @if (mainResult(); as r) {
                    <p class="n-foot n-danger">
                      <span class="n-bad-mark">✗</span> {{ r.count }} primos · la página se congeló
                      {{ r.ms }} ms
                    </p>
                  } @else {
                    <p class="n-hint">
                      Tocá y la página entera se congela hasta terminar: no podés ni scrollear.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('offscreen-canvas') {
              @if (!ocSupported()) {
                <p class="n-foot n-danger">
                  Backend simulado: este navegador no soporta OffscreenCanvas — los dos relojes
                  corren en el main.
                </p>
              }
              <div class="n-oc-ctl">
                <narrative-button variant="solid" [disabled]="ocRunning()" (pressed)="ocStart()"
                  >Iniciar animación</narrative-button
                >
                <narrative-button [disabled]="!ocRunning() || ocBlocked()" (pressed)="ocBlock()"
                  >Bloquear main 2,5 s</narrative-button
                >
              </div>
              <div class="n-cmp">
                <section class="n-col">
                  <h2>Ejecuta en un Worker</h2>
                  <p class="n-sub">dibuja en otro hilo · sigue fluido</p>
                  <div class="n-oc-frame">
                    <canvas
                      #ocWorker
                      class="n-oc-canvas"
                      width="240"
                      height="240"
                      role="img"
                      [attr.aria-label]="
                        ocRunning()
                          ? 'Reloj animado por un worker, fluido'
                          : 'Reloj del worker, detenido'
                      "
                    ></canvas>
                  </div>
                  <p class="n-foot">
                    {{
                      ocRunning()
                        ? ocWorkerFps() + ' fps · frame ' + ocWorkerFrames()
                        : 'Tocá Iniciar.'
                    }}
                  </p>
                </section>
                <section class="n-col">
                  <h2>Ejecuta en el Main</h2>
                  <p class="n-sub">dibuja en el main · se congela al bloquear</p>
                  <div class="n-oc-frame" [class.n-oc-dead]="ocBlocked()">
                    <canvas
                      #ocMain
                      class="n-oc-canvas"
                      width="240"
                      height="240"
                      role="img"
                      [attr.aria-label]="
                        ocBlocked()
                          ? 'Reloj del main, congelado'
                          : 'Reloj animado por el main thread'
                      "
                    ></canvas>
                  </div>
                  @if (ocBlocked()) {
                    <p class="n-foot n-danger" aria-live="polite">
                      El hilo principal dejó de responder — no pinta frames.
                    </p>
                  } @else if (ocSkipped()) {
                    <p class="n-foot n-danger">
                      Saltó {{ ocSkipped() }} frames de golpe al volver.
                    </p>
                  } @else {
                    <p class="n-foot">
                      {{
                        ocRunning()
                          ? ocMainFps() + ' fps · frame ' + ocMainFrames()
                          : 'Tocá Iniciar.'
                      }}
                    </p>
                  }
                </section>
              </div>
            }

            @case ('error-handling') {
              <div class="n-send">
                <narrative-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                  Enviar JSON válido
                </narrative-button>
                <narrative-button [disabled]="errorBusy()" (pressed)="sendFail()"
                  >Enviar JSON roto</narrative-button
                >
                @if (errorEvents().length) {
                  <narrative-button (pressed)="resetErrors()">Reiniciar</narrative-button>
                }
              </div>
              @if (errorEvents().length) {
                <div class="n-dialogue">
                  @for (ev of errorEvents(); track ev.id) {
                    <div class="n-evt" [attr.data-status]="ev.status">
                      <p class="n-evt-line">
                        <span class="n-evt-mark">{{ ev.status === 'ok' ? '✓' : '✗' }}</span>
                        <code class="n-evt-in">{{ ev.input }}</code>
                      </p>
                      @if (ev.status === 'ok') {
                        <p class="n-evt-text">Parseado: {{ ev.keys }} claves de primer nivel.</p>
                      } @else {
                        <p class="n-evt-text n-evt-err">{{ ev.message }}</p>
                      }
                    </div>
                  }
                </div>
                <p class="n-foot">
                  La app sigue viva: el worker no se murió, podés seguir corriendo tareas.
                </p>
              } @else {
                <p class="n-hint">
                  Enviá un JSON válido (✓ devuelve sus claves) y después uno roto (✗ el main lo
                  captura con onerror). La página no se rompe.
                </p>
              }
            }

            @case ('lifecycle') {
              <div class="n-send">
                <narrative-button
                  variant="solid"
                  [disabled]="lifeStatus() === 'running'"
                  (pressed)="startLife()"
                >
                  Iniciar tarea
                </narrative-button>
                <narrative-button
                  [disabled]="lifeStatus() !== 'running'"
                  (pressed)="terminateLife()"
                >
                  Terminar
                </narrative-button>
                @if (lifeStatus() !== 'idle') {
                  <narrative-button (pressed)="resetLife()">Reiniciar</narrative-button>
                }
              </div>

              <div class="n-bar" [attr.data-status]="lifeStatus()">
                <div class="n-bar-fill" [style.width.%]="lifePct()"></div>
              </div>
              <p class="n-bar-label">paso {{ lifeStep() }} de {{ lifeSteps() || '—' }}</p>

              @switch (lifeStatus()) {
                @case ('idle') {
                  <p class="n-hint">
                    Iniciá la tarea: el worker avanza por pasos. Cortala a mitad con Terminar y mirá
                    qué queda.
                  </p>
                }
                @case ('running') {
                  <p class="n-foot">El worker está vivo, emitiendo su progreso paso a paso.</p>
                }
                @case ('terminated') {
                  <p class="n-foot n-danger">
                    Terminado en el paso {{ lifeStep() }}/{{ lifeSteps() }}: el trabajo en curso se
                    descartó y el worker ya no existe. Para volver a correr, Iniciar crea uno nuevo.
                  </p>
                }
                @case ('done') {
                  <p class="n-foot">
                    Completado, {{ lifeSteps() }}/{{ lifeSteps() }}: el worker terminó su trabajo y
                    se cerró solo con self.close().
                  </p>
                }
              }
            }

            @case ('transferable') {
              <p class="n-bar-label">Buffer de prueba: {{ transferMb }} MB</p>
              <div class="n-cmp">
                <section class="n-col">
                  <h2>Transferir (zero-copy)</h2>
                  <p class="n-sub">cambia de dueño · no copia</p>
                  <narrative-button
                    variant="solid"
                    [disabled]="transferBusy()"
                    (pressed)="runTransfer()"
                  >
                    Transferir buffer
                  </narrative-button>
                  @if (transferResult(); as r) {
                    <p class="n-foot">
                      <span class="n-ok-mark">✓</span> round-trip {{ r.ms }} ms — instantáneo aunque
                      sea grande
                    </p>
                    <p class="n-foot n-danger">
                      El buffer del main quedó detached (0 B): perdió la propiedad.
                    </p>
                  } @else {
                    <p class="n-hint">
                      Pasás el buffer en la transfer list: no se copia, pero el main pierde la
                      propiedad y queda en 0 bytes.
                    </p>
                  }
                </section>

                <section class="n-col">
                  <h2>Clonar (structured clone)</h2>
                  <p class="n-sub">copia byte por byte · el main lo conserva</p>
                  <narrative-button [disabled]="transferBusy()" (pressed)="runClone()"
                    >Clonar buffer</narrative-button
                  >
                  @if (cloneResult(); as r) {
                    <p class="n-foot">round-trip {{ r.ms }} ms — más lento: copió {{ r.mb }} MB</p>
                    <p class="n-foot">El main conserva su copia intacta ({{ r.mb }} MB).</p>
                  } @else {
                    <p class="n-hint">
                      Sin transfer list, postMessage copia el buffer entero. El main se queda con el
                      suyo, pero la copia cuesta.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('shared-worker') {
              <div class="n-sw-banner">
                <span class="n-sw-id">SharedWorker {{ swInstanceId() || '…' }}</span>
                <span class="n-sw-clients">clientes conectados: {{ swClients() }}</span>
                @if (!swSupported()) {
                  <span class="n-sw-sim"
                    >backend simulado · el navegador no soporta SharedWorker</span
                  >
                }
              </div>
              <div class="n-cmp">
                @for (panel of swPanels(); track panel.label) {
                  <section class="n-col">
                    <h2>Conexión {{ panel.label }}</h2>
                    <p class="n-sub">puerto {{ panel.label }} · mismo worker</p>
                    <div class="n-sw-count">{{ swCount() }}</div>
                    <div class="n-send">
                      <narrative-button variant="solid" (pressed)="swInc(panel.label)"
                        >+1</narrative-button
                      >
                      <narrative-button (pressed)="swReset(panel.label)">Reset</narrative-button>
                      @if (swPanels().length > 1) {
                        <narrative-button (pressed)="swClose(panel.label)">Cerrar</narrative-button>
                      }
                    </div>
                    @if (panel.logs.length) {
                      <div class="n-dialogue">
                        @for (log of panel.logs.slice(-4); track log.id) {
                          <div class="n-evt" data-status="ok">
                            <p class="n-evt-line">
                              <span class="n-evt-in">{{ log.by }}</span> sumó → {{ log.count }}
                            </p>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="n-hint">
                        Sumá acá: el número salta en los dos paneles. Es el mismo contador, no dos
                        copias.
                      </p>
                    }
                  </section>
                }
              </div>
              <narrative-button (pressed)="swAdd()">Abrir otra conexión</narrative-button>
            }

            @case ('worker-limits') {
              <p class="n-lim-cpu">Tu CPU: {{ hardwareConcurrency() }} núcleos lógicos</p>
              <div class="n-send">
                <narrative-button
                  variant="solid"
                  [disabled]="limitRunning()"
                  (pressed)="runLimits()"
                >
                  {{
                    limitRunning() ? 'Corriendo ' + currentWorkers() + '× …' : 'Correr la escala'
                  }}
                </narrative-button>
                @if (limitRuns().length && !limitRunning()) {
                  <narrative-button (pressed)="resetLimits()">Reiniciar</narrative-button>
                }
              </div>
              @if (limitRuns().length) {
                <div class="n-lim">
                  @for (run of limitRuns(); track run.workers) {
                    <div class="n-lim-row" [attr.data-over]="run.workers > hardwareConcurrency()">
                      <span class="n-lim-k">{{ run.workers }}×</span>
                      <div class="n-lim-bar">
                        <div class="n-lim-fill" [style.width.%]="limitPct(run.ms)"></div>
                      </div>
                      <span class="n-lim-ms">{{ run.ms }} ms</span>
                    </div>
                  }
                </div>
                <p class="n-foot">
                  Plano hasta {{ hardwareConcurrency() }} (tus núcleos); pasado eso el tiempo trepa
                  — más workers no ayudan.
                </p>
              } @else {
                <p class="n-hint">
                  Corré 1, 2, 4, 8 y 16 workers a la vez con el mismo cómputo. El tiempo se mantiene
                  plano mientras entren en tus núcleos.
                </p>
              }
            }

            @case ('worker-pool') {
              <div class="n-send">
                <narrative-button variant="solid" [disabled]="poolRunning()" (pressed)="runPool()">
                  {{
                    poolRunning()
                      ? 'Procesando… ' + poolProcessed() + '/' + poolTaskCount
                      : 'Procesar la cola'
                  }}
                </narrative-button>
                @if (poolTasks().length && !poolRunning()) {
                  <narrative-button (pressed)="resetPool()">Reiniciar</narrative-button>
                }
              </div>

              @if (poolTasks().length) {
                <p class="n-lim-cpu">
                  La cola — {{ poolProcessed() }} / {{ poolTaskCount }} hechas
                </p>
                <div class="n-pool-queue">
                  @for (task of poolTasks(); track task.id) {
                    <span class="n-pool-task" [attr.data-state]="task.state">
                      {{ task.state === 'done' ? '✓' : 'T' + task.id }}
                    </span>
                  }
                </div>

                <p class="n-lim-cpu">El pool — {{ poolSize() }} workers, se reusan</p>
                <div class="n-pool-slots">
                  @for (slot of poolSlots(); track slot.id) {
                    <div class="n-pool-slot" [attr.data-busy]="slot.busy">
                      <span class="n-pool-slot-w">W{{ slot.id }}</span>
                      <span class="n-pool-slot-task">{{
                        slot.busy ? 'T' + slot.taskId : 'libre'
                      }}</span>
                      <span class="n-pool-slot-x">× {{ slot.processed }}</span>
                    </div>
                  }
                </div>

                <p class="n-foot">
                  Con pool: {{ workersCreated() }} workers creados, reusados
                  {{ poolTaskCount }} veces.
                </p>
                <p class="n-foot n-danger">
                  Sin pool: {{ spawnedWithoutPool }} workers, uno por tarea — el ejemplo 09 mostró
                  por qué eso no escala.
                </p>
              } @else {
                <p class="n-hint">
                  24 tareas, 4 workers. Tocá Procesar: los 4 se reusan para drenar la cola entera (×
                  cuenta cuántas despachó cada uno). No se crea un worker por tarea.
                </p>
              }
            }

            @case ('backpressure') {
              <div class="n-cmp">
                <section class="n-col">
                  <h2>Sin backpressure</h2>
                  <p class="n-sub">disparás las {{ bpTotal }} de una</p>
                  <narrative-button
                    variant="solid"
                    [disabled]="bpMode() !== 'idle'"
                    (pressed)="runNaive()"
                  >
                    Disparar todo
                  </narrative-button>
                  @if (bpMode() === 'naive') {
                    <p class="n-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (naivePeak(); as p) {
                    <div class="n-bp-bar" data-kind="naive">
                      <div class="n-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                    </div>
                    <p class="n-foot n-danger">
                      Pico en vuelo: {{ p }}. La última tardó {{ naiveMaxLatency() }}ms en volver.
                    </p>
                  } @else {
                    <p class="n-hint">El worker procesa de a uno; el resto se encola sin techo.</p>
                  }
                </section>

                <section class="n-col">
                  <h2>Con backpressure</h2>
                  <p class="n-sub">ventana de {{ bpWindow }} · esperás el ack</p>
                  <narrative-button [disabled]="bpMode() !== 'idle'" (pressed)="runBackpressure()"
                    >Con control de flujo</narrative-button
                  >
                  @if (bpMode() === 'backpressure') {
                    <p class="n-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (bpPeak(); as p) {
                    <div class="n-bp-bar" data-kind="bp">
                      <div class="n-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                    </div>
                    <p class="n-foot">
                      Pico en vuelo: {{ p }} — la última: {{ bpMaxLatency() }}ms, acotada.
                    </p>
                  } @else {
                    <p class="n-hint">
                      Mandás {{ bpWindow }}, esperás el ack, mandás la próxima: la cola queda
                      acotada.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('shared-memory') {
              @if (!smSupported()) {
                <p class="n-foot n-danger">
                  Backend simulado · SharedArrayBuffer necesita cabeceras COOP/COEP.
                </p>
              }
              <div class="n-sm">
                <div class="n-sm-side">
                  <span class="n-sm-who">Main</span>
                  <span class="n-sub">lee →</span>
                </div>
                <div class="n-sm-cell">{{ smValue() }}</div>
                <div class="n-sm-side n-sm-r">
                  <span class="n-sm-who">Worker</span>
                  <span class="n-sub">← escribe</span>
                </div>
              </div>
              <div class="n-bar"><div class="n-bar-fill" [style.width.%]="smPct()"></div></div>
              <p class="n-bar-label">
                0 mensajes intercambiados — es la misma memoria, escrita por el worker y leída por
                el main.
              </p>
              <div class="n-send">
                <narrative-button variant="solid" [disabled]="smRunning()" (pressed)="startSm()">
                  {{ smRunning() ? 'Contando… ' + smValue() + '/' + smTarget : 'Arrancar' }}
                </narrative-button>
                @if (smValue() && !smRunning()) {
                  <narrative-button (pressed)="resetSm()">Reiniciar</narrative-button>
                }
              </div>
            }

            @case ('degradation') {
              <p class="n-lim-cpu">
                typeof Worker → {{ degSupported() ? 'disponible ✓' : 'no disponible' }}
              </p>
              <div class="n-send">
                <narrative-button (pressed)="toggleFallback()">
                  {{ degForce() ? '☑ simulando sin Worker' : '☐ simular sin Worker' }}
                </narrative-button>
                <narrative-button variant="solid" [disabled]="degRunning()" (pressed)="runDeg()">
                  {{ degRunning() ? 'Procesando…' : 'Procesar' }}
                </narrative-button>
                @if (degResult() && !degRunning()) {
                  <narrative-button (pressed)="resetDeg()">Reiniciar</narrative-button>
                }
              </div>
              @if (degResult(); as r) {
                @if (r.path === 'worker') {
                  <p class="n-foot">
                    <span class="n-ok-mark">✓</span> Corrió en un worker: {{ r.value }} primos ·
                    {{ r.ms }} ms · la UI no se trabó.
                  </p>
                } @else {
                  <p class="n-foot n-danger">
                    <span class="n-bad-mark">⚠</span> Fallback: corrió en el main:
                    {{ r.value }} primos · {{ r.ms }} ms · la UI se congeló, pero el resultado es el
                    mismo.
                  </p>
                }
              } @else {
                <p class="n-hint">
                  Mismo código, dos caminos según el feature-detect. Tildá el fallback y volvé a
                  procesar: el resultado es idéntico, sólo cambia si la UI se traba.
                </p>
              }
            }

            @case ('clone-cost') {
              <div class="n-cc-ctl">
                <label class="n-cc-field">
                  <span
                    >Tamaño: {{ ccSize() }} {{ ccSize() === 1 ? 'registro' : 'registros' }}</span
                  >
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="500"
                    [value]="ccSize()"
                    [disabled]="cloneRunning()"
                    (input)="ccSize.set(+$any($event.target).value)"
                    aria-label="Tamaño del payload en registros"
                  />
                </label>
                <label class="n-cc-field">
                  <span
                    >Complejidad: {{ ccDepth() }} {{ ccDepth() === 1 ? 'nivel' : 'niveles' }}</span
                  >
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    [value]="ccDepth()"
                    [disabled]="cloneRunning()"
                    (input)="ccDepth.set(+$any($event.target).value)"
                    aria-label="Complejidad: niveles de anidación"
                  />
                </label>
              </div>

              <div class="n-send">
                <narrative-button
                  variant="solid"
                  [disabled]="cloneRunning()"
                  (pressed)="runCloneSweep()"
                >
                  {{ cloneRunning() ? 'Midiendo…' : 'Medir' }}
                </narrative-button>
                @if (cloneMeasurements().length && !cloneRunning()) {
                  <narrative-button (pressed)="resetClone()">Reiniciar</narrative-button>
                }
              </div>

              <div class="n-cc-chart">
                <wwp-clone-cost-chart [points]="chartPoints()" />
              </div>

              @if (cloneLast(); as last) {
                <p class="n-foot">
                  <span class="n-ok-mark">✓</span> {{ cloneMeasurements().length }} mediciones · el
                  payload de {{ fmtBytes(last.serializedBytes) }} tardó {{ fmtMs(last.ms) }} ms en
                  ir y volver (profundidad {{ cloneDepthRun() }}).
                </p>
              } @else {
                <p class="n-hint">
                  Movés los sliders y tocás Medir: mandamos payloads cada vez más grandes al worker
                  y cronometramos el ida y vuelta real. Cada punto es una medición tuya, no un
                  número inventado.
                </p>
              }
            }

            @case ('compositor-jank') {
              <div class="n-send">
                <narrative-button
                  variant="solid"
                  [disabled]="compMode() !== 'idle'"
                  (pressed)="blockMainComp()"
                >
                  Bloquear el main
                </narrative-button>
                <narrative-button [disabled]="compMode() !== 'idle'" (pressed)="blockWorkerComp()">
                  Bloquear en un worker
                </narrative-button>
              </div>
              <div class="n-comp">
                <div class="n-comp-cell">
                  <span class="n-comp-tag">CSS transform · compositor</span>
                  <div class="n-comp-box n-comp-css"></div>
                  <span class="n-comp-sub">sigue girando aunque el main se trabe</span>
                </div>
                <div class="n-comp-cell">
                  <span class="n-comp-tag">JS · main thread</span>
                  <div class="n-comp-box n-comp-js" #compJs></div>
                  <span class="n-comp-sub">se congela cuando el main se bloquea</span>
                </div>
                <div class="n-comp-cell">
                  <span class="n-comp-tag">FPS del main</span>
                  <div class="n-comp-fps" [attr.data-low]="mainFps() < 30">{{ mainFps() }}</div>
                  <span class="n-comp-sub">~60 libre · ~0 bloqueado</span>
                </div>
              </div>
              <div aria-live="polite">
                @switch (compMode()) {
                  @case ('main') {
                    <p class="n-foot n-danger">
                      Bloqueando el main: la caja JS y los FPS quedaron congelados; la CSS, no.
                    </p>
                  }
                  @case ('worker') {
                    <p class="n-foot">
                      El mismo cómputo corre en un worker: el main sigue libre, todo fluye.
                    </p>
                  }
                  @default {
                    <p class="n-hint">
                      Tocá «Bloquear el main»: se congela todo menos la caja CSS, que la mueve el
                      compositor en otro hilo. Después probá en un worker: ya nada se congela.
                    </p>
                  }
                }
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
        overflow-wrap: anywhere;
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
      .n-oc-ctl {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      .n-oc-frame {
        border: 1px solid var(--ink);
        border-radius: 6px;
        background: var(--surface-raised);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        line-height: 0;
      }
      .n-oc-canvas {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
      }
      .n-oc-dead {
        opacity: 0.5;
        filter: grayscale(0.7);
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
        color: var(--thread-worker);
        font-weight: 700;
      }
      .n-bad-mark {
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

      /* ── error-handling (ej. 05): bitácora de corridas ── */
      .n-evt {
        padding: 12px 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        animation: wwp-seg-in 0.18s ease-out;
      }
      .n-evt[data-status='error'] {
        border-color: var(--thread-blocked);
      }
      .n-evt-line {
        margin: 0;
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-family: var(--font-body);
        font-size: 16px;
      }
      .n-evt-mark {
        font-weight: 700;
      }
      .n-evt[data-status='ok'] .n-evt-mark {
        color: var(--thread-worker);
      }
      .n-evt[data-status='error'] .n-evt-mark {
        color: var(--thread-blocked);
      }
      .n-evt-in {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--ink-muted);
        word-break: break-all;
      }
      .n-evt-text {
        margin: 6px 0 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--ink-muted);
      }
      .n-evt-err {
        font-family: var(--font-mono);
        font-style: normal;
        font-size: 13px;
        color: var(--thread-blocked);
        word-break: break-word;
      }

      /* ── shared-memory (ej. 12): main · celda · worker ── */
      .n-sm {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 18px;
        margin: 8px 0 14px;
      }
      .n-sm-side {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .n-sm-r {
        text-align: right;
      }
      .n-sm-who {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 20px;
      }
      .n-sm-cell {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: clamp(48px, 9vw, 80px);
        line-height: 1;
        min-width: 120px;
        text-align: center;
        padding: 12px 20px;
        border: var(--border-width) solid var(--accent);
        border-radius: var(--radius);
        background: var(--surface-raised);
        color: var(--ink);
      }

      /* ── backpressure (ej. 11): barra de pico ── */
      .n-bp-bar {
        height: 16px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        margin: 12px 0 6px;
        overflow: hidden;
      }
      .n-bp-fill {
        height: 100%;
        transition: width 0.3s ease-out;
      }
      .n-bp-bar[data-kind='naive'] .n-bp-fill {
        background: var(--thread-blocked);
      }
      .n-bp-bar[data-kind='bp'] .n-bp-fill {
        background: var(--thread-worker);
      }

      /* ── worker-pool (ej. 10): cola + slots ── */
      .n-pool-queue {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 4px 0 20px;
      }
      .n-pool-task {
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
      .n-pool-task[data-state='running'] {
        background: var(--thread-worker);
        color: var(--surface);
        border-color: var(--thread-worker);
      }
      .n-pool-task[data-state='done'] {
        opacity: 0.4;
      }
      .n-pool-slots {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 4px 0 18px;
      }
      .n-pool-slot {
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
      .n-pool-slot[data-busy='true'] {
        border-color: var(--accent);
      }
      .n-pool-slot-w {
        font-weight: 600;
        color: var(--accent);
      }
      .n-pool-slot-x {
        color: var(--ink-muted);
      }

      /* ── worker-limits (ej. 09): filas de tiempo ── */
      .n-lim-cpu {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 15px;
        color: var(--ink-muted);
        margin: 0 0 16px;
      }
      .n-lim {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 4px 0 14px;
      }
      .n-lim-row {
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: var(--font-mono);
        font-size: 14px;
      }
      .n-lim-k {
        width: 40px;
        text-align: right;
      }
      .n-lim-bar {
        flex: 1;
        height: 18px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        overflow: hidden;
      }
      .n-lim-fill {
        height: 100%;
        background: var(--thread-worker);
        transition: width 0.3s ease-out;
      }
      .n-lim-row[data-over='true'] .n-lim-fill {
        background: var(--thread-blocked);
      }
      .n-lim-ms {
        width: 64px;
        color: var(--ink-muted);
      }

      /* ── shared-worker (ej. 08): banner + contador ── */
      .n-sw-banner {
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
      .n-sw-id {
        font-weight: 600;
        font-style: normal;
      }
      .n-sw-clients {
        color: var(--accent);
      }
      .n-sw-sim {
        font-size: 12px;
        color: var(--thread-blocked);
      }
      .n-sw-count {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: clamp(52px, 9vw, 88px);
        line-height: 1;
        margin: 4px 0 14px;
        color: var(--ink);
      }

      /* ── lifecycle (ej. 06): barra de progreso ── */
      .n-bar {
        height: 20px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        overflow: hidden;
        margin-bottom: 8px;
      }
      .n-bar-fill {
        height: 100%;
        width: 0;
        background: var(--thread-worker);
        transition: width 0.25s ease-out;
      }
      .n-bar[data-status='terminated'] .n-bar-fill {
        background: var(--thread-blocked);
      }
      .n-bar-label {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        margin: 0 0 16px;
      }

      /* ── clone-cost (ej. 15): sliders + gráfica de costo ── */
      .n-cc-ctl {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin-bottom: 18px;
      }
      .n-cc-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1 1 220px;
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
      }
      .n-cc-field input[type='range'] {
        width: 100%;
        accent-color: var(--accent);
      }
      .n-cc-chart {
        border: var(--border-width, 1px) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        padding: 12px;
        margin-bottom: 14px;
      }

      /* ── compositor-jank (ej. 16): caja CSS (compositor) vs caja JS (main) + FPS ── */
      .n-comp {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 8px 0 14px;
      }
      .n-comp-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        padding: 16px 10px;
        border: var(--border-width, 1px) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
      }
      .n-comp-tag {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
      }
      .n-comp-sub {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 12px;
        line-height: 1.4;
        color: var(--ink-muted);
      }
      .n-comp-box {
        width: 52px;
        height: 52px;
        background: var(--accent);
        border-radius: var(--radius);
      }
      .n-comp-css {
        animation: n-comp-spin 2s linear infinite;
      }
      .n-comp-fps {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 52px;
        line-height: 1;
        color: var(--thread-worker);
      }
      .n-comp-fps[data-low='true'] {
        color: var(--thread-blocked);
      }
      @keyframes n-comp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .n-comp-css {
          animation: none;
        }
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
  /** Toda la orquestación vive en el controller compartido (scoped a este componente). */
  protected readonly ctl = inject(ExampleLayoutController);

  /** ThreadVisualizer del theme activo, resuelto por DI (§5). */
  protected readonly visualizer = inject(THREAD_VISUALIZER);

  // El componente sólo posee las refs al DOM del theme; la lógica la maneja el controller.
  private readonly compJsBox = viewChild<ElementRef<HTMLElement>>('compJs');
  private readonly ocWorkerCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ocWorker');
  private readonly ocMainCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ocMain');

  // ── Alias del estado y handlers del controller (el template los lee sin prefijo) ──
  protected readonly example = this.ctl.example;
  protected readonly content = this.ctl.content;
  protected readonly snippets = this.ctl.snippets;

  // thread-block (01)
  protected readonly workerLanes = this.ctl.workerLanes;
  protected readonly mainLanes = this.ctl.mainLanes;
  protected readonly workerTicks = this.ctl.workerTicks;
  protected readonly mainTicks = this.ctl.mainTicks;
  protected readonly phase = this.ctl.phase;

  // message-exchange (03)
  protected readonly messages = this.ctl.messages;
  protected readonly pending = this.ctl.pending;
  protected readonly exchangeError = this.ctl.exchangeError;

  // offload (04)
  protected readonly workerResult = this.ctl.workerResult;
  protected readonly mainResult = this.ctl.mainResult;
  protected readonly liveMs = this.ctl.liveMs;
  protected readonly computePhase = this.ctl.computePhase;
  protected readonly computeError = this.ctl.computeError;

  // error-handling (05)
  protected readonly errorEvents = this.ctl.errorEvents;
  protected readonly errorBusy = this.ctl.errorBusy;

  // lifecycle (06)
  protected readonly lifeStatus = this.ctl.lifeStatus;
  protected readonly lifeStep = this.ctl.lifeStep;
  protected readonly lifeSteps = this.ctl.lifeSteps;
  protected readonly lifePct = this.ctl.lifePct;

  // transferable (07)
  protected readonly transferMb = this.ctl.transferMb;
  protected readonly transferResult = this.ctl.transferResult;
  protected readonly cloneResult = this.ctl.cloneResult;
  protected readonly transferBusy = this.ctl.transferBusy;

  // shared-worker (08)
  protected readonly swInstanceId = this.ctl.swInstanceId;
  protected readonly swClients = this.ctl.swClients;
  protected readonly swCount = this.ctl.swCount;
  protected readonly swPanels = this.ctl.swPanels;
  protected readonly swSupported = this.ctl.swSupported;

  // worker-limits (09)
  protected readonly hardwareConcurrency = this.ctl.hardwareConcurrency;
  protected readonly limitRuns = this.ctl.limitRuns;
  protected readonly limitRunning = this.ctl.limitRunning;
  protected readonly currentWorkers = this.ctl.currentWorkers;
  protected readonly limitError = this.ctl.limitError;

  // worker-pool (10)
  protected readonly poolTasks = this.ctl.poolTasks;
  protected readonly poolSlots = this.ctl.poolSlots;
  protected readonly poolRunning = this.ctl.poolRunning;
  protected readonly poolProcessed = this.ctl.poolProcessed;
  protected readonly poolSize = this.ctl.poolSize;
  protected readonly poolTaskCount = this.ctl.poolTaskCount;
  protected readonly workersCreated = this.ctl.workersCreated;
  protected readonly spawnedWithoutPool = this.ctl.spawnedWithoutPool;

  // backpressure (11)
  protected readonly bpMode = this.ctl.bpMode;
  protected readonly bpPending = this.ctl.bpPending;
  protected readonly naivePeak = this.ctl.naivePeak;
  protected readonly bpPeak = this.ctl.bpPeak;
  protected readonly naiveMaxLatency = this.ctl.naiveMaxLatency;
  protected readonly bpMaxLatency = this.ctl.bpMaxLatency;
  protected readonly bpTotal = this.ctl.bpTotal;
  protected readonly bpWindow = this.ctl.bpWindow;
  protected readonly bpError = this.ctl.bpError;

  // shared-memory (12)
  protected readonly smValue = this.ctl.smValue;
  protected readonly smRunning = this.ctl.smRunning;
  protected readonly smSupported = this.ctl.smSupported;
  protected readonly smTarget = this.ctl.smTarget;

  // degradation (13)
  protected readonly degSupported = this.ctl.degSupported;
  protected readonly degForce = this.ctl.degForce;
  protected readonly degResult = this.ctl.degResult;
  protected readonly degRunning = this.ctl.degRunning;

  // offscreen-canvas (14)
  protected readonly ocSupported = this.ctl.ocSupported;
  protected readonly ocRunning = this.ctl.ocRunning;
  protected readonly ocBlocked = this.ctl.ocBlocked;
  protected readonly ocWorkerFps = this.ctl.ocWorkerFps;
  protected readonly ocMainFps = this.ctl.ocMainFps;
  protected readonly ocWorkerFrames = this.ctl.ocWorkerFrames;
  protected readonly ocMainFrames = this.ctl.ocMainFrames;
  protected readonly ocSkipped = this.ctl.ocSkipped;

  // clone-cost (15)
  protected readonly ccSize = this.ctl.ccSize;
  protected readonly ccDepth = this.ctl.ccDepth;
  protected readonly cloneMeasurements = this.ctl.cloneMeasurements;
  protected readonly cloneRunning = this.ctl.cloneRunning;
  protected readonly cloneDepthRun = this.ctl.cloneDepthRun;
  protected readonly chartPoints = this.ctl.chartPoints;
  protected readonly fmtBytes = this.ctl.fmtBytes;
  protected readonly cloneLast = this.ctl.cloneLast;

  // compositor-jank (16)
  protected readonly mainFps = this.ctl.mainFps;
  protected readonly compMode = this.ctl.compMode;

  constructor() {
    // Registra la caja JS del compositor cuando el @case la renderiza.
    effect(() => {
      if (this.example()?.demo === 'compositor-jank') {
        this.ctl.setCompositorJsBox(this.compJsBox()?.nativeElement);
      }
    });
  }

  // ── Handlers que dependen de las refs al DOM del theme ──
  ocStart(): void {
    const wc = this.ocWorkerCanvas()?.nativeElement;
    const mc = this.ocMainCanvas()?.nativeElement;
    if (wc && mc) {
      this.ctl.startOffscreen(wc, mc);
    }
  }

  ocBlock(): void {
    this.ctl.blockOffscreen();
  }

  // ── Resto de handlers: delegan al controller (el template los invoca sin prefijo) ──
  runWorker(): void {
    this.ctl.runWorker();
  }

  runMain(): void {
    this.ctl.runMain();
  }

  computeWorker(value: string): void {
    this.ctl.computeWorker(value);
  }

  computeMain(value: string): void {
    this.ctl.computeMain(value);
  }

  sendOk(): void {
    this.ctl.sendOk();
  }

  sendFail(): void {
    this.ctl.sendFail();
  }

  resetErrors(): void {
    this.ctl.resetErrors();
  }

  startLife(): void {
    this.ctl.startLife();
  }

  terminateLife(): void {
    this.ctl.terminateLife();
  }

  resetLife(): void {
    this.ctl.resetLife();
  }

  runTransfer(): void {
    this.ctl.runTransfer();
  }

  runClone(): void {
    this.ctl.runClone();
  }

  swInc(label: string): void {
    this.ctl.swInc(label);
  }

  swReset(label: string): void {
    this.ctl.swReset(label);
  }

  swAdd(): void {
    this.ctl.swAdd();
  }

  swClose(label: string): void {
    this.ctl.swClose(label);
  }

  runLimits(): void {
    this.ctl.runLimits();
  }

  resetLimits(): void {
    this.ctl.resetLimits();
  }

  limitPct(ms: number): number {
    return this.ctl.limitPct(ms);
  }

  runPool(): void {
    this.ctl.runPool();
  }

  resetPool(): void {
    this.ctl.resetPool();
  }

  runNaive(): void {
    this.ctl.runNaive();
  }

  runBackpressure(): void {
    this.ctl.runBackpressure();
  }

  bpPctOf(peak: number): number {
    return this.ctl.bpPctOf(peak);
  }

  startSm(): void {
    this.ctl.startSm();
  }

  resetSm(): void {
    this.ctl.resetSm();
  }

  smPct(): number {
    return this.ctl.smPct();
  }

  toggleFallback(): void {
    this.ctl.toggleFallback();
  }

  runDeg(): void {
    this.ctl.runDeg();
  }

  resetDeg(): void {
    this.ctl.resetDeg();
  }

  runCloneSweep(): void {
    this.ctl.runCloneSweep();
  }

  resetClone(): void {
    this.ctl.resetClone();
  }

  fmtMs(ms: number): string {
    return this.ctl.fmtMs(ms);
  }

  blockMainComp(): void {
    this.ctl.blockMainComp();
  }

  blockWorkerComp(): void {
    this.ctl.blockWorkerComp();
  }

  send(text: string): void {
    this.ctl.send(text);
  }

  resetExchange(): void {
    this.ctl.resetExchange();
  }
}
