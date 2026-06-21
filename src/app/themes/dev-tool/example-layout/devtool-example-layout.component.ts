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
import { DevToolButton } from '../primitives/devtool-button.component';
import { DevToolCodeBlock } from '../primitives/devtool-code-block.component';
import { DEVTOOL_PROVIDERS } from '../devtool.providers';

/**
 * Example-layout dev-tool. Hilos como contraste worker-vs-main (backlog #2) en
 * paneles tipo IDE; ThreadVisualizer por DI (§5) y código en el code-block del theme.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'devtool-example-layout',
  imports: [
    NgComponentOutlet,
    RouterLink,
    DevToolButton,
    DevToolCodeBlock,
    CloneCostChartComponent,
  ],
  providers: [DEVTOOL_PROVIDERS, ExampleLayoutController],
  template: `
    <section class="dt-ex">
      <a class="dt-back" routerLink="/t/dev-tool">← ../</a>

      @if (example(); as ex) {
        <h1>
          <span class="dt-order">{{ ex.order.toString().padStart(2, '0') }}</span>
          {{ content()?.title ?? ex.id }}
        </h1>
        <p class="dt-cat">{{ ex.category }}</p>

        @if (content()?.summary; as summary) {
          <p class="dt-summary">{{ summary }}</p>
        }

        @if (ex.workerFactory || ex.sharedWorkerFactory || content()) {
          @switch (ex.demo) {
            @case ('thread-block') {
              <section class="dt-panel">
                <header class="dt-panel-h">// worker vs main thread</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h2>en un worker</h2>
                    <p class="dt-sub">main libre · UI fluida</p>
                    <devtool-button
                      variant="solid"
                      [disabled]="phase() === 'worker'"
                      (pressed)="runWorker()"
                    >
                      ▶ correr en worker
                    </devtool-button>
                    @if (workerLanes(); as wl) {
                      <ng-container
                        *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }"
                      />
                      <p class="dt-ok">✓ {{ workerTicks() }} ticks · sin jank</p>
                    } @else {
                      <p class="dt-hint">// tocá para correr en worker; el main queda libre</p>
                    }
                  </div>
                  <div class="dt-col">
                    <h2>en el main thread</h2>
                    <p class="dt-sub">main bloqueado · UI congelada</p>
                    <devtool-button [disabled]="phase() === 'main'" (pressed)="runMain()"
                      >▶ bloquear main</devtool-button
                    >
                    @if (mainLanes(); as ml) {
                      <ng-container
                        *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }"
                      />
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
                      aria-label="Mensaje para enviar al worker"
                      (keyup.enter)="send(msg.value); msg.value = ''"
                    />
                    <devtool-button
                      variant="solid"
                      [disabled]="pending()"
                      (pressed)="send(msg.value); msg.value = ''"
                    >
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
                          <span class="dt-line-tag">{{
                            m.direction === 'out' ? 'main →' : '← worker'
                          }}</span>
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
                    <p class="dt-hint">
                      // escribí un mensaje y enviálo: → va al worker, ← vuelve con su round-trip
                    </p>
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
                    <input
                      #n
                      class="dt-input-n"
                      type="number"
                      value="500000"
                      min="10000"
                      step="100000"
                      aria-label="N: contar primos hasta este número"
                    />
                    <span class="dt-nhint"
                      >// contar primos hasta N · subilo y el freeze dura más</span
                    >
                  </div>
                </div>
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h2>en un worker</h2>
                    <p class="dt-sub">otro hilo · UI fluida</p>
                    <devtool-button
                      variant="solid"
                      [disabled]="computePhase() === 'worker'"
                      (pressed)="computeWorker(n.value)"
                    >
                      ▶ correr en worker
                    </devtool-button>
                    @if (computePhase() === 'worker') {
                      <p class="dt-ok">⏱ {{ liveMs() }} ms · calculando, la UI responde</p>
                    } @else if (workerResult(); as r) {
                      <p class="dt-ok">✓ {{ r.count }} primos · {{ r.ms }} ms · sin jank</p>
                    } @else {
                      <p class="dt-hint">
                        // el cálculo corre en otro hilo; el cronómetro sigue subiendo
                      </p>
                    }
                  </div>
                  <div class="dt-col">
                    <h2>en el main thread</h2>
                    <p class="dt-sub">hilo bloqueado · UI congelada</p>
                    <devtool-button
                      [disabled]="computePhase() === 'main'"
                      (pressed)="computeMain(n.value)"
                      >▶ bloquear main</devtool-button
                    >
                    @if (mainResult(); as r) {
                      <p class="dt-bad">✗ {{ r.count }} primos · congelado {{ r.ms }} ms</p>
                    } @else {
                      <p class="dt-hint">
                        // la página entera se congela hasta terminar: ni scroll
                      </p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('offscreen-canvas') {
              <section class="dt-panel">
                <header class="dt-panel-h">// offscreen render · worker vs main thread</header>
                @if (!ocSupported()) {
                  <p class="dt-panel-b dt-bad">
                    // sin OffscreenCanvas: los dos relojes corren en el main
                  </p>
                }
                <div class="dt-panel-b">
                  <div class="dt-oc-ctl">
                    <devtool-button variant="solid" [disabled]="ocRunning()" (pressed)="ocStart()"
                      >▶ iniciar</devtool-button
                    >
                    <devtool-button [disabled]="!ocRunning() || ocBlocked()" (pressed)="ocBlock()"
                      >▶ block main 2.5s</devtool-button
                    >
                  </div>
                </div>
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h2>worker</h2>
                    <p class="dt-sub">offscreen · otro hilo</p>
                    <div class="dt-oc-frame">
                      <canvas
                        #ocWorker
                        class="dt-oc-canvas"
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
                    <p class="dt-ok">
                      {{
                        ocRunning()
                          ? 'fps ' + ocWorkerFps() + ' · frame ' + ocWorkerFrames()
                          : '// tocá iniciar'
                      }}
                    </p>
                  </div>
                  <div class="dt-col">
                    <h2>main thread</h2>
                    <p class="dt-sub">se congela al bloquear</p>
                    <div class="dt-oc-frame" [class.dt-oc-dead]="ocBlocked()">
                      <canvas
                        #ocMain
                        class="dt-oc-canvas"
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
                      <p class="dt-bad" aria-live="polite">// BLOCKED · no pinta frames</p>
                    } @else if (ocSkipped()) {
                      <p class="dt-bad">// saltó {{ ocSkipped() }} frames al volver</p>
                    } @else {
                      <p class="dt-ok">
                        {{
                          ocRunning()
                            ? 'fps ' + ocMainFps() + ' · frame ' + ocMainFrames()
                            : '// tocá iniciar'
                        }}
                      </p>
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
                    <devtool-button [disabled]="errorBusy()" (pressed)="sendFail()"
                      >▶ json roto</devtool-button
                    >
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
                    <p class="dt-ok">
                      // la app sigue viva: el worker no se murió, seguí mandando tareas
                    </p>
                  } @else {
                    <p class="dt-hint">
                      // mandá un json válido (✓ claves) y después uno roto (✗ onerror lo captura).
                      la página no se rompe
                    </p>
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
                    <devtool-button
                      variant="solid"
                      [disabled]="lifeStatus() === 'running'"
                      (pressed)="startLife()"
                    >
                      ▶ iniciar
                    </devtool-button>
                    <devtool-button
                      [disabled]="lifeStatus() !== 'running'"
                      (pressed)="terminateLife()"
                      >■ terminate</devtool-button
                    >
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
                      <p class="dt-hint">
                        // tocá iniciar y cortá a mitad con terminate: el paso en curso se descarta
                      </p>
                    }
                    @case ('running') {
                      <p class="dt-ok">// running · el worker está vivo emitiendo progreso</p>
                    }
                    @case ('terminated') {
                      <p class="dt-bad">
                        // terminated en paso {{ lifeStep() }}/{{ lifeSteps() }} · trabajo en curso
                        perdido · el worker ya no existe (iniciá → se crea uno nuevo)
                      </p>
                    }
                    @case ('done') {
                      <p class="dt-ok">
                        // done {{ lifeSteps() }}/{{ lifeSteps() }} · el worker se cerró solo
                        (self.close)
                      </p>
                    }
                  }
                </div>
              </section>
            }

            @case ('transferable') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // transferir vs clonar · ArrayBuffer ({{ transferMb }} MB)
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h2>transfer (zero-copy)</h2>
                    <p class="dt-sub">cambia de dueño · no copia</p>
                    <devtool-button
                      variant="solid"
                      [disabled]="transferBusy()"
                      (pressed)="runTransfer()"
                    >
                      ▶ transferir
                    </devtool-button>
                    @if (transferResult(); as r) {
                      <p class="dt-ok">✓ round-trip {{ r.ms }} ms · instantáneo</p>
                      <p class="dt-bad">⚠ main buffer DETACHED · byteLength 0</p>
                    } @else {
                      <p class="dt-hint">
                        // postMessage(msg, [buf]) · zero-copy, pero el main pierde el buffer
                      </p>
                    }
                  </div>
                  <div class="dt-col">
                    <h2>clone (structured)</h2>
                    <p class="dt-sub">copia byte por byte · el main lo conserva</p>
                    <devtool-button [disabled]="transferBusy()" (pressed)="runClone()"
                      >▶ clonar</devtool-button
                    >
                    @if (cloneResult(); as r) {
                      <p class="dt-ok">round-trip {{ r.ms }} ms · copió {{ r.mb }} MB</p>
                      <p class="dt-ok">✓ main conserva su copia ({{ r.mb }} MB)</p>
                    } @else {
                      <p class="dt-hint">
                        // postMessage(msg) · copia el buffer entero (cuesta para datos grandes)
                      </p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('shared-worker') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // shared-worker · {{ swInstanceId() || '…' }} · clients: {{ swClients()
                  }}{{ swSupported() ? '' : ' (simulado)' }}
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  @for (panel of swPanels(); track panel.label) {
                    <div class="dt-col">
                      <h2>conn {{ panel.label }}</h2>
                      <p class="dt-sub">puerto {{ panel.label }} · mismo worker</p>
                      <div class="dt-sw-count">{{ swCount() }}</div>
                      <div class="dt-send">
                        <devtool-button variant="solid" (pressed)="swInc(panel.label)"
                          >+1</devtool-button
                        >
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
                        <p class="dt-hint">
                          // +1 en un panel salta en TODOS: es la misma variable del worker
                        </p>
                      }
                    </div>
                  }
                </div>
                <div class="dt-panel-b">
                  <devtool-button (pressed)="swAdd()">+ abrir conexión</devtool-button>
                </div>
              </section>
            }

            @case ('worker-limits') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // worker limits · navigator.hardwareConcurrency = {{ hardwareConcurrency() }}
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button
                      variant="solid"
                      [disabled]="limitRunning()"
                      (pressed)="runLimits()"
                    >
                      {{
                        limitRunning()
                          ? '▶ corriendo ' + currentWorkers() + '× …'
                          : '▶ correr escala'
                      }}
                    </devtool-button>
                    @if (limitRuns().length && !limitRunning()) {
                      <devtool-button (pressed)="resetLimits()">reset</devtool-button>
                    }
                  </div>
                  @if (limitRuns().length) {
                    <div class="dt-lim">
                      @for (run of limitRuns(); track run.workers) {
                        <div
                          class="dt-lim-row"
                          [attr.data-over]="run.workers > hardwareConcurrency()"
                        >
                          <span class="dt-lim-k">{{ run.workers }}×</span>
                          <div class="dt-lim-bar">
                            <div class="dt-lim-fill" [style.width.%]="limitPct(run.ms)"></div>
                          </div>
                          <span class="dt-lim-ms">{{ run.ms }}ms</span>
                        </div>
                      }
                    </div>
                    <p class="dt-ok">
                      // plano hasta {{ hardwareConcurrency() }} núcleos · pasado eso el tiempo
                      trepa, más workers no ayudan
                    </p>
                  } @else {
                    <p class="dt-hint">
                      // corre 1,2,4,8,16 workers a la vez con el mismo trabajo · mirá dónde el
                      tiempo deja de bajar
                    </p>
                  }
                </div>
              </section>
            }

            @case ('worker-pool') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // worker pool · {{ poolSize() }} workers · {{ poolTaskCount }} tareas
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button
                      variant="solid"
                      [disabled]="poolRunning()"
                      (pressed)="runPool()"
                    >
                      {{
                        poolRunning()
                          ? '▶ procesando ' + poolProcessed() + '/' + poolTaskCount
                          : '▶ procesar cola'
                      }}
                    </devtool-button>
                    @if (poolTasks().length && !poolRunning()) {
                      <devtool-button (pressed)="resetPool()">reset</devtool-button>
                    }
                  </div>

                  @if (poolTasks().length) {
                    <p class="dt-sub">
                      // cola — {{ poolProcessed() }} / {{ poolTaskCount }} hechas
                    </p>
                    <div class="dt-pool-queue">
                      @for (task of poolTasks(); track task.id) {
                        <span class="dt-pool-task" [attr.data-state]="task.state">
                          {{ task.state === 'done' ? '✓' : 'T' + task.id }}
                        </span>
                      }
                    </div>

                    <p class="dt-sub">// pool — {{ poolSize() }} workers, se reusan</p>
                    <div class="dt-pool-slots">
                      @for (slot of poolSlots(); track slot.id) {
                        <div class="dt-pool-slot" [attr.data-busy]="slot.busy">
                          <span class="dt-pool-slot-w">W{{ slot.id }}</span>
                          <span class="dt-pool-slot-task">{{
                            slot.busy ? 'T' + slot.taskId : 'idle'
                          }}</span>
                          <span class="dt-pool-slot-x">×{{ slot.processed }}</span>
                        </div>
                      }
                    </div>

                    <p class="dt-ok">
                      // pool: {{ workersCreated() }} workers creados, reusados
                      {{ poolTaskCount }} veces
                    </p>
                    <p class="dt-bad">
                      // sin pool: {{ spawnedWithoutPool }} workers (uno por tarea) — ver ejemplo 09
                    </p>
                  } @else {
                    <p class="dt-hint">
                      // 24 tareas, 4 workers · tocá procesar: los 4 se reusan para drenar la cola
                      (×N = cuántas despachó cada uno)
                    </p>
                  }
                </div>
              </section>
            }

            @case ('backpressure') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // backpressure · {{ bpTotal }} mensajes · ventana {{ bpWindow }}
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b dt-cmp">
                  <div class="dt-col">
                    <h2>sin backpressure</h2>
                    <p class="dt-sub">disparás las {{ bpTotal }} de una</p>
                    <devtool-button
                      variant="solid"
                      [disabled]="bpMode() !== 'idle'"
                      (pressed)="runNaive()"
                    >
                      ▶ disparar todo
                    </devtool-button>
                    @if (bpMode() === 'naive') {
                      <p class="dt-ok">// en cola: {{ bpPending() }}…</p>
                    } @else if (naivePeak(); as p) {
                      <div class="dt-bp-bar" data-kind="naive">
                        <div class="dt-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                      </div>
                      <p class="dt-bad">
                        ✗ pico en vuelo: {{ p }} · última: {{ naiveMaxLatency() }}ms
                      </p>
                    } @else {
                      <p class="dt-hint">
                        // el worker procesa de a uno · el resto se encola sin techo
                      </p>
                    }
                  </div>
                  <div class="dt-col">
                    <h2>con backpressure</h2>
                    <p class="dt-sub">ventana {{ bpWindow }} · esperás el ack</p>
                    <devtool-button [disabled]="bpMode() !== 'idle'" (pressed)="runBackpressure()"
                      >▶ con control de flujo</devtool-button
                    >
                    @if (bpMode() === 'backpressure') {
                      <p class="dt-ok">// en cola: {{ bpPending() }}…</p>
                    } @else if (bpPeak(); as p) {
                      <div class="dt-bp-bar" data-kind="bp">
                        <div class="dt-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                      </div>
                      <p class="dt-ok">
                        ✓ pico en vuelo: {{ p }} · última: {{ bpMaxLatency() }}ms, acotada
                      </p>
                    } @else {
                      <p class="dt-hint">
                        // manda {{ bpWindow }}, espera ack, manda la próxima · cola acotada
                      </p>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('shared-memory') {
              <section class="dt-panel">
                <header class="dt-panel-h">// SharedArrayBuffer + Atomics · 0 mensajes</header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  @if (!smSupported()) {
                    <p class="dt-bad">// backend simulado · SharedArrayBuffer necesita COOP/COEP</p>
                  }
                  <div class="dt-sm">
                    <div class="dt-sm-side">
                      <span class="dt-sm-who">main</span><span class="dt-sub">Atomics.load →</span>
                    </div>
                    <div class="dt-sm-cell">{{ smValue() }}</div>
                    <div class="dt-sm-side dt-sm-r">
                      <span class="dt-sm-who">worker</span><span class="dt-sub">← Atomics.add</span>
                    </div>
                  </div>
                  <div class="dt-bar">
                    <div class="dt-bar-fill" [style.width.%]="smPct()"></div>
                  </div>
                  <p class="dt-bar-label">
                    // 0 postMessage · es la misma memoria, escrita por el worker y leída por el
                    main
                  </p>
                  <div class="dt-send">
                    <devtool-button variant="solid" [disabled]="smRunning()" (pressed)="startSm()">
                      {{ smRunning() ? '▶ contando ' + smValue() + '/' + smTarget : '▶ arrancar' }}
                    </devtool-button>
                    @if (smValue() && !smRunning()) {
                      <devtool-button (pressed)="resetSm()">reset</devtool-button>
                    }
                  </div>
                </div>
              </section>
            }

            @case ('degradation') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // graceful degradation · typeof Worker !== 'undefined' ?
                  {{ degSupported() ? 'true' : 'false' }}
                </header>
                @if (content()?.whatToWatch; as ww) {
                  <p class="dt-panel-b dt-watch">{{ ww }}</p>
                }
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button (pressed)="toggleFallback()">
                      {{ degForce() ? '[x] simular sin Worker' : '[ ] simular sin Worker' }}
                    </devtool-button>
                    <devtool-button variant="solid" [disabled]="degRunning()" (pressed)="runDeg()">
                      {{ degRunning() ? '▶ procesando…' : '▶ procesar' }}
                    </devtool-button>
                    @if (degResult() && !degRunning()) {
                      <devtool-button (pressed)="resetDeg()">reset</devtool-button>
                    }
                  </div>
                  @if (degResult(); as r) {
                    @if (r.path === 'worker') {
                      <p class="dt-ok">
                        ✓ path: worker · {{ r.value }} primos · {{ r.ms }} ms · UI fluida
                      </p>
                    } @else {
                      <p class="dt-bad">
                        ⚠ path: main (fallback) · {{ r.value }} primos · {{ r.ms }} ms · UI
                        congelada, mismo resultado
                      </p>
                    }
                  } @else {
                    <p class="dt-hint">
                      // mismo código, dos caminos según el feature-detect · tildá el fallback y el
                      resultado es idéntico, sólo cambia si la UI se traba
                    </p>
                  }
                </div>
              </section>
            }

            @case ('clone-cost') {
              <section class="dt-panel">
                <header class="dt-panel-h">
                  // structured clone cost · postMessage round-trip
                </header>
                <p class="dt-panel-b dt-watch">
                  {{
                    content()?.whatToWatch ??
                      'Movés el tamaño y la complejidad, medís el round-trip real y mirás la curva trepar.'
                  }}
                </p>
                <div class="dt-panel-b">
                  <div class="cc-ctl">
                    <label class="cc-field">
                      <span
                        >// tamaño: {{ ccSize() }}
                        {{ ccSize() === 1 ? 'registro' : 'registros' }}</span
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
                    <label class="cc-field">
                      <span
                        >// complejidad: {{ ccDepth() }}
                        {{ ccDepth() === 1 ? 'nivel' : 'niveles' }}</span
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

                  <div class="dt-send">
                    <devtool-button
                      variant="solid"
                      [disabled]="cloneRunning()"
                      (pressed)="runCloneSweep()"
                    >
                      {{ cloneRunning() ? '▶ midiendo…' : '▶ medir' }}
                    </devtool-button>
                    @if (cloneMeasurements().length && !cloneRunning()) {
                      <devtool-button (pressed)="resetClone()">reset</devtool-button>
                    }
                  </div>

                  <div class="cc-chart">
                    <wwp-clone-cost-chart [points]="chartPoints()" />
                  </div>

                  @if (cloneLast(); as last) {
                    <p class="dt-ok">
                      ✓ {{ cloneMeasurements().length }} mediciones · el payload de
                      {{ fmtBytes(last.serializedBytes) }} tardó {{ fmtMs(last.ms) }} ms en ir y
                      volver (profundidad {{ cloneDepthRun() }})
                    </p>
                  } @else {
                    <p class="dt-hint">
                      // movés los sliders y tocás medir: mandamos payloads cada vez más grandes al
                      worker y cronometramos el ida y vuelta REAL · cada punto es una medición tuya,
                      no un número inventado
                    </p>
                  }
                </div>
              </section>
            }

            @case ('compositor-jank') {
              <section class="dt-panel">
                <header class="dt-panel-h">// el otro hilo: compositor · CSS vs JS</header>
                <p class="dt-panel-b dt-watch">
                  {{
                    content()?.whatToWatch ??
                      'Bloqueá el main y mirá: la caja CSS sigue girando, la caja JS se congela.'
                  }}
                </p>
                <div class="dt-panel-b">
                  <div class="dt-send">
                    <devtool-button
                      variant="solid"
                      [disabled]="compMode() !== 'idle'"
                      (pressed)="blockMainComp()"
                    >
                      ▶ bloquear el main
                    </devtool-button>
                    <devtool-button
                      [disabled]="compMode() !== 'idle'"
                      (pressed)="blockWorkerComp()"
                    >
                      ▶ bloquear en un worker
                    </devtool-button>
                  </div>

                  <div class="dt-comp">
                    <div class="dt-comp-cell">
                      <span class="dt-comp-tag">// CSS transform · compositor</span>
                      <div class="dt-comp-box dt-comp-css"></div>
                      <span class="dt-comp-sub">sigue girando aunque el main se trabe</span>
                    </div>
                    <div class="dt-comp-cell">
                      <span class="dt-comp-tag">// JS · main thread</span>
                      <div class="dt-comp-box dt-comp-js" #compJs></div>
                      <span class="dt-comp-sub">se congela cuando el main se bloquea</span>
                    </div>
                    <div class="dt-comp-cell">
                      <span class="dt-comp-tag">// FPS del main</span>
                      <div class="dt-comp-fps" [attr.data-low]="mainFps() < 30">
                        {{ mainFps() }}
                      </div>
                      <span class="dt-comp-sub">~60 libre · ~0 bloqueado</span>
                    </div>
                  </div>

                  <div aria-live="polite">
                    @switch (compMode()) {
                      @case ('main') {
                        <p class="dt-bad">
                          ▶ bloqueando el MAIN… la caja JS y los FPS están congelados; la CSS no.
                        </p>
                      }
                      @case ('worker') {
                        <p class="dt-ok">
                          ▶ el MISMO cómputo corre en un worker… el main sigue libre, todo fluido.
                        </p>
                      }
                      @default {
                        <p class="dt-hint">
                          // tocá «bloquear el main»: se congela todo MENOS la caja CSS (la mueve el
                          compositor, otro hilo) · después probá en un worker: nada se congela
                        </p>
                      }
                    }
                  </div>
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
        overflow-wrap: anywhere;
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
      .dt-oc-ctl {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .dt-oc-frame {
        border: 1px solid var(--border);
        background: var(--surface-raised);
        line-height: 0;
        margin-top: 8px;
      }
      .dt-oc-canvas {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
      }
      .dt-oc-dead {
        opacity: 0.5;
        filter: grayscale(0.7);
      }
      .dt-col {
        padding: 16px;
      }
      .dt-col + .dt-col {
        border-left: var(--border-width) solid var(--border);
      }
      .dt-col h2 {
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

      /* ── shared-memory (ej. 12): main · celda · worker ── */
      .dt-sm {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 14px;
        margin: 8px 0 12px;
      }
      .dt-sm-side {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-family: var(--font-mono);
      }
      .dt-sm-r {
        text-align: right;
      }
      .dt-sm-who {
        font-weight: 700;
        color: var(--accent);
      }
      .dt-sm-cell {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: clamp(40px, 8vw, 64px);
        line-height: 1;
        min-width: 110px;
        text-align: center;
        padding: 10px 16px;
        border: 1px solid var(--accent);
        border-radius: var(--radius);
        background: var(--surface-raised);
        color: var(--accent);
      }

      /* ── backpressure (ej. 11): barra de pico ── */
      .dt-bp-bar {
        height: 14px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        margin: 10px 0 6px;
        overflow: hidden;
      }
      .dt-bp-fill {
        height: 100%;
        transition: width 0.3s ease-out;
      }
      .dt-bp-bar[data-kind='naive'] .dt-bp-fill {
        background: var(--thread-blocked);
      }
      .dt-bp-bar[data-kind='bp'] .dt-bp-fill {
        background: var(--accent);
      }

      /* ── worker-pool (ej. 10): cola + slots ── */
      .dt-pool-queue {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin: 4px 0 16px;
      }
      .dt-pool-task {
        min-width: 30px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        font-family: var(--font-mono);
        font-size: 11px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        color: var(--ink-muted);
      }
      .dt-pool-task[data-state='running'] {
        background: var(--accent);
        color: var(--surface);
        border-color: var(--accent);
      }
      .dt-pool-task[data-state='done'] {
        color: var(--accent);
        border-color: var(--accent);
        opacity: 0.7;
      }
      .dt-pool-slots {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 4px 0 16px;
      }
      .dt-pool-slot {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        font-family: var(--font-mono);
        font-size: 12px;
      }
      .dt-pool-slot[data-busy='true'] {
        border-color: var(--accent);
        background: var(--surface-raised);
      }
      .dt-pool-slot-w {
        font-weight: 700;
        color: var(--accent);
      }
      .dt-pool-slot-x {
        color: var(--ink-muted);
      }

      /* ── worker-limits (ej. 09): filas de tiempo ── */
      .dt-lim {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 4px 0 12px;
      }
      .dt-lim-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-mono);
        font-size: 12px;
      }
      .dt-lim-k {
        width: 32px;
        text-align: right;
        color: var(--ink-muted);
      }
      .dt-lim-bar {
        flex: 1;
        height: 14px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        overflow: hidden;
      }
      .dt-lim-fill {
        height: 100%;
        background: var(--accent);
        transition: width 0.3s ease-out;
      }
      .dt-lim-row[data-over='true'] .dt-lim-fill {
        background: var(--thread-blocked);
      }
      .dt-lim-ms {
        width: 56px;
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

      /* ── clone-cost (ej. 15): sliders + gráfica de costo ── */
      .cc-ctl {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin-bottom: 18px;
      }
      .cc-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1 1 220px;
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
        color: var(--ink-muted);
      }
      .cc-field input[type='range'] {
        width: 100%;
        accent-color: var(--accent);
      }
      .cc-chart {
        border: var(--border-width, 1px) solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        padding: 12px;
        margin-bottom: 14px;
      }

      /* ── compositor-jank (ej. 16): CSS box (compositor) vs JS box (main) + FPS ── */
      .dt-comp {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 8px 0 14px;
      }
      .dt-comp-cell {
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
      .dt-comp-tag {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        color: var(--ink-muted);
      }
      .dt-comp-sub {
        font-family: var(--font-mono);
        font-size: 10px;
        line-height: 1.4;
        color: var(--ink-muted);
      }
      .dt-comp-box {
        width: 52px;
        height: 52px;
        border-radius: var(--radius);
        background: var(--accent);
      }
      .dt-comp-css {
        animation: dt-comp-spin 2s linear infinite;
      }
      .dt-comp-fps {
        font-family: var(--font-mono);
        font-weight: 800;
        font-size: 52px;
        line-height: 1;
        color: var(--accent);
      }
      .dt-comp-fps[data-low='true'] {
        color: var(--thread-blocked);
      }
      @keyframes dt-comp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .dt-comp-css {
          animation: none;
        }
      }

      .dt-note {
        font-family: var(--font-mono);
        color: var(--ink-muted);
      }
    `,
  ],
})
export class DevToolExampleLayoutComponent {
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
