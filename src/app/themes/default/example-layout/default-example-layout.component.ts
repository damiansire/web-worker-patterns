import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  viewChild,
  ElementRef,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { ThemeService } from '../../../theming/theme.service';
import { THREAD_VISUALIZER } from '../../../ui-contracts/thread-visualizer.contract';
import { CloneCostChartComponent } from '../../../ui-primitives/clone-cost-chart.component';
import { DefaultButton } from '../primitives/default-button.component';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { DefaultPulseMonitor } from '../primitives/default-pulse-monitor.component';
import { DEFAULT_PROVIDERS } from '../default.providers';

/** Example-layout default. Hilos como contraste worker-vs-main (#2) + código. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-example-layout',
  imports: [
    NgComponentOutlet,
    RouterLink,
    DefaultButton,
    DefaultCodeBlock,
    DefaultPulseMonitor,
    CloneCostChartComponent,
  ],
  providers: [DEFAULT_PROVIDERS, ExampleLayoutController],
  template: `
    <article class="e-ex" [class.e-ex--journey]="journeyMode()">
      @if (!journeyMode()) {
        <a class="e-back" [routerLink]="['/t', activeThemeId()]">← índice</a>
      }

      @if (example(); as ex) {
        <p class="e-kicker">{{ ex.category }} · nº {{ ex.order.toString().padStart(2, '0') }}</p>
        <h1>{{ content()?.title ?? ex.id }}</h1>

        @if (ex.workerFactory || ex.sharedWorkerFactory || content()) {
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
                  <default-button
                    variant="solid"
                    [disabled]="phase() === 'worker'"
                    (pressed)="runWorker()"
                  >
                    Ejecutar en worker
                  </default-button>
                  @if (workerLanes(); as wl) {
                    <ng-container
                      *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }"
                    />
                    <p class="e-foot">{{ workerTicks() }} ticks · la UI nunca se trabó</p>
                  } @else {
                    <p class="e-hint">
                      Tocá para ver el worker emitir ticks mientras el main queda libre.
                    </p>
                  }
                </section>

                <section class="e-col">
                  <h2>En el Main thread</h2>
                  <p class="e-sub">el main se bloquea · la UI se congela ~2,5s</p>
                  <default-button [disabled]="phase() === 'main'" (pressed)="runMain()"
                    >Bloquear main</default-button
                  >
                  @if (mainLanes(); as ml) {
                    <ng-container
                      *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }"
                    />
                    <p class="e-foot e-danger">
                      se congeló · {{ mainTicks() }} ticks que no se pintaron
                    </p>
                  } @else {
                    <p class="e-hint">
                      Tocá y la página se congela: el contador no actualiza, los clicks mueren.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('message-exchange') {
              @if (exchangeError(); as err) {
                <p class="e-foot e-danger" role="alert">⚠ {{ err }}</p>
              }
              <div class="e-send">
                <input
                  #msg
                  class="e-input"
                  value="hola"
                  placeholder="escribí un mensaje…"
                  aria-label="Mensaje para enviar al worker"
                  (keyup.enter)="send(msg.value); msg.value = ''"
                />
                <default-button
                  variant="solid"
                  [disabled]="pending()"
                  (pressed)="send(msg.value); msg.value = ''"
                >
                  Enviar
                </default-button>
                @if (messages().length) {
                  <default-button (pressed)="resetExchange()">Reiniciar</default-button>
                }
              </div>
              @if (messages().length) {
                <div class="e-dialogue">
                  @for (m of messages(); track m.direction + m.id) {
                    <div class="e-msg" [attr.data-dir]="m.direction">
                      <p class="e-msg-line">
                        <span class="e-msg-who">{{
                          m.direction === 'out' ? 'Main →' : '← Worker'
                        }}</span>
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
                      <p class="e-msg-line">
                        <span class="e-msg-who">← Worker</span>
                        <span class="e-msg-text">procesando…</span>
                      </p>
                    </div>
                  }
                </div>
              } @else {
                <p class="e-hint">
                  Enviá un mensaje: viaja al worker (→) y vuelve la respuesta (←) con su round-trip.
                </p>
              }
            }

            @case ('offload') {
              @if (computeError(); as err) {
                <p class="e-foot e-danger" role="alert">⚠ {{ err }}</p>
              }

              <div class="e-pat">
                <span class="e-pat-face" aria-hidden="true">{{
                  computePhase() === 'main' ? '😵' : '🙂'
                }}</span>
                <div>
                  <div class="e-pat-name">Main thread</div>
                  <div class="e-pat-st" [attr.data-phase]="computePhase()">
                    @switch (computePhase()) {
                      @case ('worker') {
                        libre · un ayudante calcula al lado
                      }
                      @case ('main') {
                        CONGELADO · nada responde
                      }
                      @default {
                        late tranquilo · la UI responde
                      }
                    }
                  </div>
                </div>
              </div>

              <default-pulse-monitor />

              <div class="e-nrow">
                <label class="e-nlabel" for="e-n">Peso de la tarea · primos hasta</label>
                <input
                  #n
                  id="e-n"
                  class="e-input-n"
                  type="number"
                  value="500000"
                  min="10000"
                  step="100000"
                />
                <span class="e-nhint">más grande = freeze más largo</span>
              </div>

              <div class="e-two">
                <default-button
                  variant="solid"
                  [disabled]="computePhase() !== 'idle'"
                  (pressed)="computeWorker(n.value)"
                >
                  Que lo haga un worker
                </default-button>
                <default-button
                  [disabled]="computePhase() !== 'idle'"
                  (pressed)="computeMain(n.value)"
                >
                  Que lo haga el main
                </default-button>
              </div>

              @if (computePhase() === 'worker') {
                <p class="e-foot">
                  Calculando en otro hilo… {{ liveMs() }} ms · mirá: el pulso no se corta.
                </p>
              } @else if (workerResult(); as r) {
                <p class="e-foot e-ok">
                  <span class="e-ok-mark">✓</span> {{ r.count }} primos en {{ r.ms }} ms · la UI
                  nunca se trabó. Ahora probá «el main».
                </p>
              } @else if (mainResult(); as r) {
                <p class="e-foot e-danger">
                  <span class="e-bad-mark">✗</span> {{ r.count }} primos · la página se congeló
                  {{ r.ms }} ms. ¿Viste el hueco plano? Probá el worker.
                </p>
              } @else {
                <p class="e-hint">
                  La misma tarea, dos caminos. Tocá uno y mirá el pulso del main.
                </p>
              }
            }

            @case ('offscreen-canvas') {
              @if (!ocSupported()) {
                <p class="e-foot e-danger">
                  Backend simulado: este navegador no soporta OffscreenCanvas — los dos relojes
                  corren en el main.
                </p>
              }
              <div class="e-oc-ctl">
                <default-button variant="solid" [disabled]="ocRunning()" (pressed)="ocStart()"
                  >Iniciar animación</default-button
                >
                <default-button [disabled]="!ocRunning() || ocBlocked()" (pressed)="ocBlock()"
                  >Bloquear main 2,5 s</default-button
                >
              </div>
              <div class="e-cmp">
                <section class="e-col">
                  <h2>En un Worker</h2>
                  <p class="e-sub">dibuja en otro hilo · sigue fluido</p>
                  <div class="e-oc-frame">
                    <canvas
                      #ocWorker
                      class="e-oc-canvas"
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
                  <p class="e-foot">
                    {{
                      ocRunning()
                        ? ocWorkerFps() + ' fps · frame ' + ocWorkerFrames()
                        : 'Tocá Iniciar.'
                    }}
                  </p>
                </section>
                <section class="e-col">
                  <h2>En el Main thread</h2>
                  <p class="e-sub">dibuja en el main · se congela al bloquear</p>
                  <div class="e-oc-frame" [class.e-oc-dead]="ocBlocked()">
                    <canvas
                      #ocMain
                      class="e-oc-canvas"
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
                    <p class="e-foot e-danger" aria-live="polite">
                      Main congelado — no pinta frames.
                    </p>
                  } @else if (ocSkipped()) {
                    <p class="e-foot e-danger">
                      Saltó {{ ocSkipped() }} frames de golpe al volver.
                    </p>
                  } @else {
                    <p class="e-foot">
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
              <div class="e-send">
                <default-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                  Enviar JSON válido
                </default-button>
                <default-button [disabled]="errorBusy()" (pressed)="sendFail()"
                  >Enviar JSON roto</default-button
                >
                @if (errorEvents().length) {
                  <default-button (pressed)="resetErrors()">Reiniciar</default-button>
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
                <p class="e-foot">
                  La app sigue viva: el worker no se murió, podés seguir corriendo tareas.
                </p>
              } @else {
                <p class="e-hint">
                  Enviá un JSON válido (✓ devuelve sus claves) y después uno roto (✗ el main lo
                  captura con onerror). La página no se rompe.
                </p>
              }
            }

            @case ('lifecycle') {
              <div class="e-send">
                <default-button
                  variant="solid"
                  [disabled]="lifeStatus() === 'running'"
                  (pressed)="startLife()"
                >
                  Iniciar tarea
                </default-button>
                <default-button [disabled]="lifeStatus() !== 'running'" (pressed)="terminateLife()">
                  Terminar
                </default-button>
                @if (lifeStatus() !== 'idle') {
                  <default-button (pressed)="resetLife()">Reiniciar</default-button>
                }
              </div>

              <div class="e-bar" [attr.data-status]="lifeStatus()">
                <div class="e-bar-fill" [style.width.%]="lifePct()"></div>
              </div>
              <p class="e-bar-label">paso {{ lifeStep() }} de {{ lifeSteps() || '—' }}</p>

              @switch (lifeStatus()) {
                @case ('idle') {
                  <p class="e-hint">
                    Iniciá la tarea: el worker avanza por pasos. Cortala a mitad con Terminar y mirá
                    qué queda.
                  </p>
                }
                @case ('running') {
                  <p class="e-foot">El worker está vivo, emitiendo su progreso paso a paso.</p>
                }
                @case ('terminated') {
                  <p class="e-foot e-danger">
                    Terminado en el paso {{ lifeStep() }}/{{ lifeSteps() }}: el trabajo en curso se
                    descartó y el worker ya no existe. Para volver a correr, Iniciar crea uno nuevo.
                  </p>
                }
                @case ('done') {
                  <p class="e-foot">
                    Completado, {{ lifeSteps() }}/{{ lifeSteps() }}: el worker terminó su trabajo y
                    se cerró solo con self.close().
                  </p>
                }
              }
            }

            @case ('transferable') {
              <p class="e-bar-label">Buffer de prueba: {{ transferMb }} MB</p>
              <div class="e-cmp">
                <section class="e-col">
                  <h2>Transferir (zero-copy)</h2>
                  <p class="e-sub">cambia de dueño · no copia</p>
                  <default-button
                    variant="solid"
                    [disabled]="transferBusy()"
                    (pressed)="runTransfer()"
                  >
                    Transferir buffer
                  </default-button>
                  @if (transferResult(); as r) {
                    <p class="e-foot">
                      <span class="e-ok-mark">✓</span> round-trip {{ r.ms }} ms — instantáneo aunque
                      sea grande
                    </p>
                    <p class="e-foot e-danger">
                      El buffer del main quedó detached (0 B): perdió la propiedad.
                    </p>
                  } @else {
                    <p class="e-hint">
                      Pasás el buffer en la transfer list: no se copia, pero el main pierde la
                      propiedad y queda en 0 bytes.
                    </p>
                  }
                </section>

                <section class="e-col">
                  <h2>Clonar (structured clone)</h2>
                  <p class="e-sub">copia byte por byte · el main lo conserva</p>
                  <default-button [disabled]="transferBusy()" (pressed)="runClone()"
                    >Clonar buffer</default-button
                  >
                  @if (cloneResult(); as r) {
                    <p class="e-foot">round-trip {{ r.ms }} ms — más lento: copió {{ r.mb }} MB</p>
                    <p class="e-foot">El main conserva su copia intacta ({{ r.mb }} MB).</p>
                  } @else {
                    <p class="e-hint">
                      Sin transfer list, postMessage copia el buffer entero. El main se queda con el
                      suyo, pero la copia cuesta.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('shared-worker') {
              <div class="e-sw-banner">
                <span class="e-sw-id">SharedWorker {{ swInstanceId() || '…' }}</span>
                <span class="e-sw-clients">clientes conectados: {{ swClients() }}</span>
                @if (!swSupported()) {
                  <span class="e-sw-sim"
                    >backend simulado · el navegador no soporta SharedWorker</span
                  >
                }
              </div>
              <div class="e-cmp">
                @for (panel of swPanels(); track panel.label) {
                  <section class="e-col">
                    <h2>Conexión {{ panel.label }}</h2>
                    <p class="e-sub">puerto {{ panel.label }} · mismo worker</p>
                    <div class="e-sw-count">{{ swCount() }}</div>
                    <div class="e-send">
                      <default-button variant="solid" (pressed)="swInc(panel.label)"
                        >+1</default-button
                      >
                      <default-button (pressed)="swReset(panel.label)">Reset</default-button>
                      @if (swPanels().length > 1) {
                        <default-button (pressed)="swClose(panel.label)">Cerrar</default-button>
                      }
                    </div>
                    @if (panel.logs.length) {
                      <div class="e-dialogue">
                        @for (log of panel.logs.slice(-4); track log.id) {
                          <div class="e-evt" data-status="ok">
                            <p class="e-evt-line">
                              <span class="e-evt-in">{{ log.by }}</span> sumó → {{ log.count }}
                            </p>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="e-hint">
                        Sumá acá: el número salta en los dos paneles. Es el mismo contador, no dos
                        copias.
                      </p>
                    }
                  </section>
                }
              </div>
              <default-button (pressed)="swAdd()">Abrir otra conexión</default-button>
            }

            @case ('worker-limits') {
              <p class="e-lim-cpu">Tu CPU: {{ hardwareConcurrency() }} núcleos lógicos</p>
              <div class="e-send">
                <default-button variant="solid" [disabled]="limitRunning()" (pressed)="runLimits()">
                  {{
                    limitRunning() ? 'Corriendo ' + currentWorkers() + '× …' : 'Correr la escala'
                  }}
                </default-button>
                @if (limitRuns().length && !limitRunning()) {
                  <default-button (pressed)="resetLimits()">Reiniciar</default-button>
                }
              </div>
              @if (limitError(); as err) {
                <p class="e-foot e-danger" role="alert">⚠ {{ err }}</p>
              }
              @if (limitRuns().length) {
                <div class="e-lim">
                  @for (run of limitRuns(); track run.workers) {
                    <div class="e-lim-row" [attr.data-over]="run.workers > hardwareConcurrency()">
                      <span class="e-lim-k">{{ run.workers }}×</span>
                      <div class="e-lim-bar">
                        <div class="e-lim-fill" [style.width.%]="limitPct(run.ms)"></div>
                      </div>
                      <span class="e-lim-ms">{{ run.ms }} ms</span>
                    </div>
                  }
                </div>
                <p class="e-foot">
                  Plano hasta {{ hardwareConcurrency() }} (tus núcleos); pasado eso el tiempo trepa
                  — más workers no ayudan.
                </p>
              } @else {
                <p class="e-hint">
                  Corré 1, 2, 4, 8 y 16 workers a la vez con el mismo cómputo. El tiempo se mantiene
                  plano mientras entren en tus núcleos.
                </p>
              }
            }

            @case ('worker-pool') {
              <div class="e-send">
                <default-button variant="solid" [disabled]="poolRunning()" (pressed)="runPool()">
                  {{
                    poolRunning()
                      ? 'Procesando… ' + poolProcessed() + '/' + poolTaskCount
                      : 'Procesar la cola'
                  }}
                </default-button>
                @if (poolTasks().length && !poolRunning()) {
                  <default-button (pressed)="resetPool()">Reiniciar</default-button>
                }
              </div>

              @if (poolTasks().length) {
                <p class="e-lim-cpu">
                  La cola — {{ poolProcessed() }} / {{ poolTaskCount }} hechas
                </p>
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
                      <span class="e-pool-slot-task">{{
                        slot.busy ? 'T' + slot.taskId : 'libre'
                      }}</span>
                      <span class="e-pool-slot-x">× {{ slot.processed }}</span>
                    </div>
                  }
                </div>

                <p class="e-foot">
                  Con pool: {{ workersCreated() }} workers creados, reusados
                  {{ poolTaskCount }} veces.
                </p>
                <p class="e-foot e-danger">
                  Sin pool: {{ spawnedWithoutPool }} workers, uno por tarea — el ejemplo 09 mostró
                  por qué eso no escala.
                </p>
              } @else {
                <p class="e-hint">
                  24 tareas, 4 workers. Tocá Procesar: los 4 se reusan para drenar la cola entera (×
                  cuenta cuántas despachó cada uno). No se crea un worker por tarea.
                </p>
              }
            }

            @case ('backpressure') {
              @if (bpError(); as err) {
                <p class="e-foot e-danger" role="alert">⚠ {{ err }}</p>
              }
              <div class="e-cmp">
                <section class="e-col">
                  <h2>Sin backpressure</h2>
                  <p class="e-sub">disparás las {{ bpTotal }} de una</p>
                  <default-button
                    variant="solid"
                    [disabled]="bpMode() !== 'idle'"
                    (pressed)="runNaive()"
                  >
                    Disparar todo
                  </default-button>
                  @if (bpMode() === 'naive') {
                    <p class="e-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (naivePeak(); as p) {
                    <div class="e-bp-bar" data-kind="naive">
                      <div class="e-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                    </div>
                    <p class="e-foot e-danger">
                      Pico en vuelo: {{ p }}. La última tardó {{ naiveMaxLatency() }}ms en volver.
                    </p>
                  } @else {
                    <p class="e-hint">El worker procesa de a uno; el resto se encola sin techo.</p>
                  }
                </section>

                <section class="e-col">
                  <h2>Con backpressure</h2>
                  <p class="e-sub">ventana de {{ bpWindow }} · esperás el ack</p>
                  <default-button [disabled]="bpMode() !== 'idle'" (pressed)="runBackpressure()"
                    >Con control de flujo</default-button
                  >
                  @if (bpMode() === 'backpressure') {
                    <p class="e-foot">en cola: {{ bpPending() }}…</p>
                  } @else if (bpPeak(); as p) {
                    <div class="e-bp-bar" data-kind="bp">
                      <div class="e-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                    </div>
                    <p class="e-foot">
                      Pico en vuelo: {{ p }} — la última: {{ bpMaxLatency() }}ms, acotada.
                    </p>
                  } @else {
                    <p class="e-hint">
                      Mandás {{ bpWindow }}, esperás el ack, mandás la próxima: la cola queda
                      acotada.
                    </p>
                  }
                </section>
              </div>
            }

            @case ('shared-memory') {
              @if (!smSupported()) {
                <p class="e-foot e-danger">
                  Backend simulado · SharedArrayBuffer necesita cabeceras COOP/COEP.
                </p>
              }
              <div class="e-sm">
                <div class="e-sm-side">
                  <span class="e-sm-who">Main</span>
                  <span class="e-sub">lee →</span>
                </div>
                <div class="e-sm-cell">{{ smValue() }}</div>
                <div class="e-sm-side e-sm-r">
                  <span class="e-sm-who">Worker</span>
                  <span class="e-sub">← escribe</span>
                </div>
              </div>
              <div class="e-bar"><div class="e-bar-fill" [style.width.%]="smPct()"></div></div>
              <p class="e-bar-label">
                0 mensajes intercambiados — es la misma memoria, escrita por el worker y leída por
                el main.
              </p>
              <div class="e-send">
                <default-button variant="solid" [disabled]="smRunning()" (pressed)="startSm()">
                  {{ smRunning() ? 'Contando… ' + smValue() + '/' + smTarget : 'Arrancar' }}
                </default-button>
                @if (smValue() && !smRunning()) {
                  <default-button (pressed)="resetSm()">Reiniciar</default-button>
                }
              </div>
            }

            @case ('degradation') {
              <p class="e-lim-cpu">
                typeof Worker → {{ degSupported() ? 'disponible ✓' : 'no disponible' }}
              </p>
              <div class="e-send">
                <default-button (pressed)="toggleFallback()">
                  {{ degForce() ? '☑ simulando sin Worker' : '☐ simular sin Worker' }}
                </default-button>
                <default-button variant="solid" [disabled]="degRunning()" (pressed)="runDeg()">
                  {{ degRunning() ? 'Procesando…' : 'Procesar' }}
                </default-button>
                @if (degResult() && !degRunning()) {
                  <default-button (pressed)="resetDeg()">Reiniciar</default-button>
                }
              </div>
              @if (degResult(); as r) {
                @if (r.path === 'worker') {
                  <p class="e-foot">
                    <span class="e-ok-mark">✓</span> Corrió en un worker: {{ r.value }} primos ·
                    {{ r.ms }} ms · la UI no se trabó.
                  </p>
                } @else {
                  <p class="e-foot e-danger">
                    <span class="e-bad-mark">⚠</span> Fallback: corrió en el main:
                    {{ r.value }} primos · {{ r.ms }} ms · la UI se congeló, pero el resultado es el
                    mismo.
                  </p>
                }
              } @else {
                <p class="e-hint">
                  Mismo código, dos caminos según el feature-detect. Tildá el fallback y volvé a
                  procesar: el resultado es idéntico, sólo cambia si la UI se traba.
                </p>
              }
            }

            @case ('clone-cost') {
              <div class="e-cc-ctl">
                <label class="e-cc-field">
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
                <label class="e-cc-field">
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

              <div class="e-send">
                <default-button
                  variant="solid"
                  [disabled]="cloneRunning()"
                  (pressed)="runCloneSweep()"
                >
                  {{ cloneRunning() ? 'midiendo…' : 'Medir' }}
                </default-button>
                @if (cloneMeasurements().length && !cloneRunning()) {
                  <default-button (pressed)="resetClone()">Reiniciar</default-button>
                }
              </div>

              <div class="e-cc-chart">
                <wwp-clone-cost-chart [points]="chartPoints()" />
              </div>

              @if (cloneLast(); as last) {
                <p class="e-foot">
                  {{ cloneMeasurements().length }} mediciones · el payload de
                  {{ fmtBytes(last.serializedBytes) }} tardó {{ fmtMs(last.ms) }} ms en ir y volver
                  (profundidad {{ cloneDepthRun() }})
                </p>
              } @else {
                <p class="e-hint">
                  Movés los sliders y tocás Medir: mandamos payloads cada vez más grandes al worker
                  y cronometramos el ida y vuelta real. Cada punto es una medición tuya, no un
                  número inventado.
                </p>
              }
            }

            @case ('compositor-jank') {
              <div class="e-send">
                <default-button
                  variant="solid"
                  [disabled]="compMode() !== 'idle'"
                  (pressed)="blockMainComp()"
                >
                  Bloquear el main
                </default-button>
                <default-button [disabled]="compMode() !== 'idle'" (pressed)="blockWorkerComp()">
                  Bloquear en un worker
                </default-button>
              </div>
              <div class="e-comp">
                <div class="e-comp-cell">
                  <span class="e-comp-tag">CSS transform · compositor</span>
                  <div class="e-comp-box e-comp-css"></div>
                  <span class="e-comp-sub">sigue girando aunque el main se trabe</span>
                </div>
                <div class="e-comp-cell">
                  <span class="e-comp-tag">JS · main thread</span>
                  <div class="e-comp-box e-comp-js" #compJs></div>
                  <span class="e-comp-sub">se congela cuando el main se bloquea</span>
                </div>
                <div class="e-comp-cell">
                  <span class="e-comp-tag">FPS del main</span>
                  <div class="e-comp-fps" [attr.data-low]="mainFps() < 30">{{ mainFps() }}</div>
                  <span class="e-comp-sub">~60 libre · ~0 bloqueado</span>
                </div>
              </div>
              <div aria-live="polite">
                @switch (compMode()) {
                  @case ('main') {
                    <p class="e-foot e-danger">
                      Bloqueando el main: la caja JS y los FPS están congelados; la CSS no.
                    </p>
                  }
                  @case ('worker') {
                    <p class="e-foot">
                      El mismo cómputo corre en un worker: el main sigue libre, todo fluido.
                    </p>
                  }
                  @default {
                    <p class="e-hint">
                      Tocá «Bloquear el main»: se congela todo menos la caja CSS (la mueve el
                      compositor, otro hilo). Después probá en un worker: nada se congela.
                    </p>
                  }
                }
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
                <default-code-block [label]="snip.label" [code]="snip.code" />
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
      /* En el viaje, la parada ya centra y limita el ancho: soltamos el contenedor. */
      .e-ex--journey {
        max-width: none;
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
        overflow-wrap: anywhere;
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
      .e-oc-ctl {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      .e-oc-frame {
        border: 1px solid var(--ink);
        background: var(--surface-raised);
        line-height: 0;
      }
      .e-oc-canvas {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
      }
      .e-oc-dead {
        opacity: 0.5;
        filter: grayscale(0.7);
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
      .e-col default-button {
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

      /* ── offload (ej. 04): el freeze como electro + personaje (vibe cálido) ── */
      .e-pat {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .e-pat-face {
        font-size: 32px;
        line-height: 1;
      }
      .e-pat-name {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 16px;
      }
      .e-pat-st {
        font-family: var(--font-display);
        font-size: 13px;
        color: var(--ink-muted);
      }
      .e-pat-st[data-phase='worker'] {
        color: var(--worker);
      }
      .e-pat-st[data-phase='main'] {
        color: var(--thread-blocked);
        font-weight: 700;
      }
      default-pulse-monitor {
        display: block;
        margin: 0 0 16px;
      }
      .e-two {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 16px 0 4px;
      }
      .e-two default-button {
        flex: 1 1 200px;
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

      /* ── shared-memory (ej. 12): main · celda · worker ── */
      .e-sm {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 18px;
        margin: 8px 0 14px;
      }
      .e-sm-side {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .e-sm-r {
        text-align: right;
      }
      .e-sm-who {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 20px;
      }
      .e-sm-cell {
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

      /* ── clone-cost (ej. 15): sliders + gráfica de costo ── */
      .e-cc-ctl {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin-bottom: 24px;
      }
      .e-cc-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1 1 220px;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 14px;
        color: var(--ink-muted);
      }
      .e-cc-field input[type='range'] {
        width: 100%;
        accent-color: var(--accent);
      }
      .e-cc-chart {
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        padding: 16px;
        margin-bottom: 20px;
      }

      /* ── compositor-jank (ej. 16): caja CSS (compositor) vs caja JS (main) + FPS ── */
      .e-comp {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 8px 0 14px;
      }
      .e-comp-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        padding: 18px 12px;
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
      }
      .e-comp-tag {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 13px;
        color: var(--ink-muted);
      }
      .e-comp-sub {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 12px;
        line-height: 1.4;
        color: var(--ink-muted);
      }
      .e-comp-box {
        width: 52px;
        height: 52px;
        background: var(--accent);
        border-radius: var(--radius);
      }
      .e-comp-css {
        animation: e-comp-spin 2s linear infinite;
      }
      .e-comp-fps {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 52px;
        line-height: 1;
        color: var(--thread-worker);
      }
      .e-comp-fps[data-low='true'] {
        color: var(--thread-blocked);
      }
      @keyframes e-comp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .e-comp-css {
          animation: none;
        }
      }

      .e-note {
        font-family: var(--font-display);
        font-style: italic;
        color: var(--ink-muted);
      }
    `,
  ],
})
export class DefaultExampleLayoutComponent {
  /**
   * Ejemplo a mostrar, por input. En la página single queda en `null` y el
   * controller lo saca de la ruta; en una parada del viaje, el journey lo fija.
   */
  readonly exampleId = input<string | null>(null);
  /** Modo viaje: sin back-link (la navegación es el scroll). */
  readonly journeyMode = input(false);

  /** Toda la orquestación vive en el controller compartido (scoped a este componente). */
  protected readonly ctl = inject(ExampleLayoutController);

  /** ThreadVisualizer del theme activo, resuelto por DI (§5). */
  protected readonly visualizer = inject(THREAD_VISUALIZER);

  /** El back-link vuelve al índice del theme activo (default o midnight), no a uno fijo. */
  protected readonly activeThemeId = inject(ThemeService).activeId;

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
    // Si el journey fija el ejemplo por input, el controller lo usa en vez de la ruta.
    effect(() => {
      const id = this.exampleId();
      if (id) {
        this.ctl.useExample(id);
      }
    });

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
