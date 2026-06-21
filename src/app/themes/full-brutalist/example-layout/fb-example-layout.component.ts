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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'fb-example-layout',
  imports: [
    NgComponentOutlet,
    RouterLink,
    FullBrutalistButton,
    FullBrutalistCard,
    FullBrutalistCodeBlock,
    CloneCostChartComponent,
  ],
  providers: [FULL_BRUTALIST_PROVIDERS, ExampleLayoutController],
  template: `
    <section class="b-ex">
      <a class="b-back" routerLink="/t/full-brutalist">← INDEX</a>

      @if (example(); as ex) {
        <div class="b-frame">
          <header class="b-head">
            <span class="b-order">{{ ex.order.toString().padStart(2, '0') }}</span>
            <div class="b-head-text">
              <h1>{{ content()?.title ?? ex.id }}</h1>
              <span class="b-badge">{{ ex.category }}</span>
            </div>
          </header>

          @if (content()?.summary; as summary) {
            <p class="b-summary">{{ summary }}</p>
          }

          @if (ex.workerFactory || ex.sharedWorkerFactory || content()) {
            @switch (ex.demo) {
              @case ('thread-block') {
                <fb-card title="Worker vs Main thread">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Mismo contador, dos hilos. Corré los dos y mirá la diferencia.'
                    }}
                  </p>
                  <div class="b-cmp">
                    <div class="b-col">
                      <h2>En un Worker</h2>
                      <p class="b-col-sub">el main queda libre · la UI sigue fluida</p>
                      <fb-button
                        variant="solid"
                        [disabled]="phase() === 'worker'"
                        (pressed)="runWorker()"
                      >
                        Correr en worker
                      </fb-button>
                      @if (workerLanes(); as wl) {
                        <ng-container
                          *ngComponentOutlet="visualizer; inputs: { lanes: wl, elapsedMs: 0 }"
                        />
                        <p class="b-foot">✓ {{ workerTicks() }} ticks · la UI nunca se trabó</p>
                      } @else {
                        <p class="b-hint">
                          Tocá para ver el worker emitir ticks mientras el main queda libre.
                        </p>
                      }
                    </div>

                    <div class="b-col">
                      <h2>En el Main thread</h2>
                      <p class="b-col-sub">el main se bloquea · la UI se congela ~2,5s</p>
                      <fb-button [disabled]="phase() === 'main'" (pressed)="runMain()"
                        >Bloquear main</fb-button
                      >
                      @if (mainLanes(); as ml) {
                        <ng-container
                          *ngComponentOutlet="visualizer; inputs: { lanes: ml, elapsedMs: 0 }"
                        />
                        <p class="b-foot b-danger">
                          ✗ se congeló · {{ mainTicks() }} ticks que no se pintaron
                        </p>
                      } @else {
                        <p class="b-hint">
                          Tocá y la página se congela: el contador no actualiza, los clicks mueren.
                        </p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('message-exchange') {
                <fb-card title="Ida y vuelta">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Enviá un mensaje y mirá el ida y vuelta entre el main y el worker.'
                    }}
                  </p>
                  <div class="b-send">
                    <input
                      #msg
                      type="text"
                      class="b-input"
                      value="hola"
                      placeholder="escribí un mensaje…"
                      aria-label="Mensaje para enviar al worker"
                      (keyup.enter)="send(msg.value); msg.value = ''"
                    />
                    <fb-button
                      variant="solid"
                      [disabled]="pending()"
                      (pressed)="send(msg.value); msg.value = ''"
                    >
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
                          <span class="b-msg-tag">{{
                            m.direction === 'out' ? 'MAIN →' : '← WORKER'
                          }}</span>
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
                    <p class="b-hint">
                      Escribí un mensaje y enviálo: va al worker (→) y vuelve la respuesta (←) con
                      su round-trip.
                    </p>
                  }
                </fb-card>
              }

              @case ('offload') {
                <fb-card title="Cómputo pesado">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El mismo cálculo pesado en los dos hilos. Mirá cuál congela la UI.'
                    }}
                  </p>

                  <div class="b-nrow">
                    <span class="b-nlabel">N =</span>
                    <input
                      #n
                      type="number"
                      class="b-input-n"
                      value="500000"
                      min="10000"
                      step="100000"
                      aria-label="N: contar primos hasta este número"
                    />
                    <span class="b-nhint">contar primos hasta N · subilo y el freeze dura más</span>
                  </div>

                  <div class="b-cmp">
                    <div class="b-col">
                      <h2>En un Worker</h2>
                      <p class="b-col-sub">corre en otro hilo · la UI sigue fluida</p>
                      <fb-button
                        variant="solid"
                        [disabled]="computePhase() === 'worker'"
                        (pressed)="computeWorker(n.value)"
                      >
                        Calcular en worker
                      </fb-button>
                      @if (computePhase() === 'worker') {
                        <p class="b-foot">calculando… ⏱ {{ liveMs() }} ms · la UI responde</p>
                      } @else if (workerResult(); as r) {
                        <p class="b-foot">
                          ✓ {{ r.count }} primos · {{ r.ms }} ms · la UI nunca se trabó
                        </p>
                      } @else {
                        <p class="b-hint">
                          Tocá: el cálculo corre en otro hilo y el cronómetro sigue subiendo — el
                          main queda libre.
                        </p>
                      }
                    </div>

                    <div class="b-col">
                      <h2>En el Main thread</h2>
                      <p class="b-col-sub">bloquea el hilo · la UI se congela</p>
                      <fb-button
                        [disabled]="computePhase() === 'main'"
                        (pressed)="computeMain(n.value)"
                        >Calcular en el main</fb-button
                      >
                      @if (mainResult(); as r) {
                        <p class="b-foot b-danger">
                          ✗ {{ r.count }} primos · la página se congeló {{ r.ms }} ms
                        </p>
                      } @else {
                        <p class="b-hint">
                          Tocá y la página entera se congela hasta terminar: no podés ni scrollear.
                        </p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('offscreen-canvas') {
                <fb-card title="Render fuera del main">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Dos relojes gemelos. Bloqueá el main y mirá cuál se congela.'
                    }}
                  </p>
                  @if (!ocSupported()) {
                    <p class="b-foot b-danger">
                      backend simulado · sin OffscreenCanvas los dos relojes corren en el main
                    </p>
                  }
                  <div class="b-oc-ctl">
                    <fb-button variant="solid" [disabled]="ocRunning()" (pressed)="ocStart()"
                      >Iniciar animación</fb-button
                    >
                    <fb-button [disabled]="!ocRunning() || ocBlocked()" (pressed)="ocBlock()"
                      >Bloquear main 2,5s</fb-button
                    >
                  </div>
                  <div class="b-cmp">
                    <div class="b-col">
                      <h2>En un Worker</h2>
                      <p class="b-col-sub">dibuja en otro hilo · sigue fluido</p>
                      <div class="b-oc-frame">
                        <canvas
                          #ocWorker
                          class="b-oc-canvas"
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
                      <p class="b-foot">
                        {{
                          ocRunning()
                            ? ocWorkerFps() + ' fps · frame ' + ocWorkerFrames()
                            : 'tocá Iniciar'
                        }}
                      </p>
                    </div>
                    <div class="b-col">
                      <h2>En el Main thread</h2>
                      <p class="b-col-sub">dibuja en el main · se congela al bloquear</p>
                      <div class="b-oc-frame" [class.b-oc-dead]="ocBlocked()">
                        <canvas
                          #ocMain
                          class="b-oc-canvas"
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
                        <p class="b-foot b-danger" aria-live="polite">
                          main congelado — no pinta frames
                        </p>
                      } @else if (ocSkipped()) {
                        <p class="b-foot b-danger">
                          saltó {{ ocSkipped() }} frames de golpe al volver
                        </p>
                      } @else {
                        <p class="b-foot">
                          {{
                            ocRunning()
                              ? ocMainFps() + ' fps · frame ' + ocMainFrames()
                              : 'tocá Iniciar'
                          }}
                        </p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('error-handling') {
                <fb-card title="Errores que no rompen">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Tirá una tarea que falla y mirá cómo el main captura el error sin romperse.'
                    }}
                  </p>

                  <div class="b-send">
                    <fb-button variant="solid" [disabled]="errorBusy()" (pressed)="sendOk()">
                      Enviar JSON válido
                    </fb-button>
                    <fb-button [disabled]="errorBusy()" (pressed)="sendFail()">
                      Enviar JSON roto
                    </fb-button>
                    @if (errorEvents().length) {
                      <fb-button (pressed)="resetErrors()">Reset</fb-button>
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
                    <p class="b-foot">
                      ▸ La app sigue viva: el worker no se murió, seguí tirando tareas.
                    </p>
                  } @else {
                    <p class="b-hint">
                      Probá el JSON válido (✓ devuelve las claves) y después el roto (✗ el main lo
                      captura con onerror). La página no se rompe.
                    </p>
                  }
                </fb-card>
              }

              @case ('lifecycle') {
                <fb-card title="Ciclo de vida">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Arrancá la tarea larga y cortala a mitad: el trabajo en curso se pierde.'
                    }}
                  </p>

                  <div class="b-send">
                    <fb-button
                      variant="solid"
                      [disabled]="lifeStatus() === 'running'"
                      (pressed)="startLife()"
                    >
                      Iniciar tarea
                    </fb-button>
                    <fb-button [disabled]="lifeStatus() !== 'running'" (pressed)="terminateLife()">
                      Terminar (terminate)
                    </fb-button>
                    @if (lifeStatus() !== 'idle') {
                      <fb-button (pressed)="resetLife()">Reiniciar</fb-button>
                    }
                  </div>

                  <div class="b-bar" [attr.data-status]="lifeStatus()">
                    <div class="b-bar-fill" [style.width.%]="lifePct()"></div>
                  </div>
                  <p class="b-bar-label">paso {{ lifeStep() }} de {{ lifeSteps() || '—' }}</p>

                  @switch (lifeStatus()) {
                    @case ('idle') {
                      <p class="b-hint">
                        Tocá Iniciar: el worker corre una tarea larga por pasos. Cortala a mitad con
                        Terminar y mirá qué pasa.
                      </p>
                    }
                    @case ('running') {
                      <p class="b-foot">▶ corriendo… el worker está vivo emitiendo progreso.</p>
                    }
                    @case ('terminated') {
                      <p class="b-foot b-danger">
                        ✗ Terminado en el paso {{ lifeStep() }}/{{ lifeSteps() }} — el trabajo en
                        curso se descartó y el worker ya no existe. Iniciá de nuevo: se crea uno
                        nuevo.
                      </p>
                    }
                    @case ('done') {
                      <p class="b-foot">
                        ✓ Completado {{ lifeSteps() }}/{{ lifeSteps() }} — el worker terminó su
                        trabajo y se cerró solo (self.close).
                      </p>
                    }
                  }
                </fb-card>
              }

              @case ('transferable') {
                <fb-card title="Transferir vs Clonar">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El mismo buffer, dos formas de mandarlo. Mirá el round-trip y qué le pasa al buffer del main.'
                    }}
                  </p>
                  <p class="b-bar-label">buffer de prueba: {{ transferMb }} MB</p>

                  <div class="b-cmp">
                    <div class="b-col">
                      <h2>Transferir (zero-copy)</h2>
                      <p class="b-col-sub">cambia de dueño · no copia</p>
                      <fb-button
                        variant="solid"
                        [disabled]="transferBusy()"
                        (pressed)="runTransfer()"
                      >
                        Transferir buffer
                      </fb-button>
                      @if (transferResult(); as r) {
                        <p class="b-foot">
                          ✓ round-trip {{ r.ms }} ms — instantáneo aunque sea grande
                        </p>
                        <p class="b-foot b-danger">
                          ⚠ el buffer del main quedó DETACHED (0 B): cambió de dueño
                        </p>
                      } @else {
                        <p class="b-hint">
                          Pasás el buffer en la transfer list: no se copia, pero el main pierde la
                          propiedad (queda en 0 bytes).
                        </p>
                      }
                    </div>

                    <div class="b-col">
                      <h2>Clonar (structured clone)</h2>
                      <p class="b-col-sub">copia byte por byte · el main lo conserva</p>
                      <fb-button [disabled]="transferBusy()" (pressed)="runClone()"
                        >Clonar buffer</fb-button
                      >
                      @if (cloneResult(); as r) {
                        <p class="b-foot">
                          round-trip {{ r.ms }} ms — más lento: copió {{ r.mb }} MB
                        </p>
                        <p class="b-foot">✓ el main conserva su copia intacta ({{ r.mb }} MB)</p>
                      } @else {
                        <p class="b-hint">
                          Sin transfer list, postMessage copia el buffer entero. El main se queda
                          con el suyo, pero la copia cuesta.
                        </p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('shared-worker') {
                <fb-card title="Un worker, varias conexiones">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El mismo contador en los dos paneles: es UNA variable adentro del worker.'
                    }}
                  </p>

                  <div class="b-sw-banner">
                    <span class="b-sw-id">⬡ SharedWorker {{ swInstanceId() || '…' }}</span>
                    <span class="b-sw-clients">clientes conectados: {{ swClients() }}</span>
                    @if (!swSupported()) {
                      <span class="b-sw-sim"
                        >backend simulado · tu navegador no soporta SharedWorker</span
                      >
                    }
                  </div>

                  <div class="b-cmp b-sw-cmp">
                    @for (panel of swPanels(); track panel.label) {
                      <div class="b-col">
                        <h2>conexión {{ panel.label }}</h2>
                        <p class="b-col-sub">puerto {{ panel.label }} · mismo worker</p>
                        <div class="b-sw-count">{{ swCount() }}</div>
                        <div class="b-send">
                          <fb-button variant="solid" (pressed)="swInc(panel.label)">+1</fb-button>
                          <fb-button (pressed)="swReset(panel.label)">reset</fb-button>
                          @if (swPanels().length > 1) {
                            <fb-button (pressed)="swClose(panel.label)">cerrar</fb-button>
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
                          <p class="b-hint">
                            Tocá +1: el número salta en los DOS paneles. Es el mismo contador, no
                            dos copias.
                          </p>
                        }
                      </div>
                    }
                  </div>

                  <fb-button (pressed)="swAdd()">+ abrir otra conexión</fb-button>
                </fb-card>
              }

              @case ('worker-limits') {
                <fb-card title="Cuántos workers ayudan">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Corremos K workers a la vez con el mismo trabajo. Mirá dónde el tiempo deja de bajar.'
                    }}
                  </p>
                  <p class="b-bar-label">Tu CPU: {{ hardwareConcurrency() }} núcleos lógicos</p>

                  <div class="b-send">
                    <fb-button variant="solid" [disabled]="limitRunning()" (pressed)="runLimits()">
                      {{
                        limitRunning()
                          ? 'corriendo ' + currentWorkers() + '× …'
                          : 'Correr la escala'
                      }}
                    </fb-button>
                    @if (limitRuns().length && !limitRunning()) {
                      <fb-button (pressed)="resetLimits()">Reset</fb-button>
                    }
                  </div>

                  @if (limitRuns().length) {
                    <div class="b-lim">
                      @for (run of limitRuns(); track run.workers) {
                        <div
                          class="b-lim-row"
                          [attr.data-over]="run.workers > hardwareConcurrency()"
                        >
                          <span class="b-lim-k">{{ run.workers }}×</span>
                          <div class="b-lim-bar">
                            <div class="b-lim-fill" [style.width.%]="limitPct(run.ms)"></div>
                          </div>
                          <span class="b-lim-ms">{{ run.ms }} ms</span>
                        </div>
                      }
                    </div>
                    <p class="b-foot">
                      ▸ Plano hasta {{ hardwareConcurrency() }} (tus núcleos); pasado eso el tiempo
                      trepa — más workers no ayudan.
                    </p>
                  } @else {
                    <p class="b-hint">
                      Corre 1, 2, 4, 8 y 16 workers a la vez con el mismo cómputo. El tiempo se
                      mantiene plano mientras entren en tus núcleos.
                    </p>
                  }
                </fb-card>
              }

              @case ('worker-pool') {
                <fb-card title="Pool de workers">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        '4 workers se reusan para drenar 24 tareas. Mirá el contador de cada uno subir.'
                    }}
                  </p>

                  <div class="b-send">
                    <fb-button variant="solid" [disabled]="poolRunning()" (pressed)="runPool()">
                      {{
                        poolRunning()
                          ? 'procesando… ' + poolProcessed() + '/' + poolTaskCount
                          : 'Procesar la cola'
                      }}
                    </fb-button>
                    @if (poolTasks().length && !poolRunning()) {
                      <fb-button (pressed)="resetPool()">Reset</fb-button>
                    }
                  </div>

                  @if (poolTasks().length) {
                    <p class="b-bar-label">
                      Cola — {{ poolProcessed() }} / {{ poolTaskCount }} hechas
                    </p>
                    <div class="b-pool-queue">
                      @for (task of poolTasks(); track task.id) {
                        <span class="b-pool-task" [attr.data-state]="task.state">
                          {{ task.state === 'done' ? '✓' : 'T' + task.id }}
                        </span>
                      }
                    </div>

                    <p class="b-bar-label">Pool — {{ poolSize() }} workers, se reusan</p>
                    <div class="b-pool-slots">
                      @for (slot of poolSlots(); track slot.id) {
                        <div class="b-pool-slot" [attr.data-busy]="slot.busy">
                          <span class="b-pool-slot-w">W{{ slot.id }}</span>
                          <span class="b-pool-slot-task">{{
                            slot.busy ? 'T' + slot.taskId : 'libre'
                          }}</span>
                          <span class="b-pool-slot-x">× {{ slot.processed }}</span>
                        </div>
                      }
                    </div>

                    <p class="b-foot">
                      ▸ CON POOL: {{ workersCreated() }} workers creados, reusados
                      {{ poolTaskCount }} veces.
                    </p>
                    <p class="b-foot b-danger">
                      SIN POOL: {{ spawnedWithoutPool }} workers (uno por tarea) — el ejemplo 09
                      mostró por qué eso no escala.
                    </p>
                  } @else {
                    <p class="b-hint">
                      24 tareas, 4 workers. Tocá Procesar: los 4 se reusan para drenar la cola
                      entera (× cuenta cuántas despachó cada uno). No se crea un worker por tarea.
                    </p>
                  }
                </fb-card>
              }

              @case ('backpressure') {
                <fb-card title="Backpressure">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El mismo trabajo de dos formas. Mirá hasta dónde crece la cola en espera.'
                    }}
                  </p>
                  <div class="b-cmp">
                    <div class="b-col">
                      <h2>Sin backpressure</h2>
                      <p class="b-col-sub">disparás las {{ bpTotal }} de una</p>
                      <fb-button
                        variant="solid"
                        [disabled]="bpMode() !== 'idle'"
                        (pressed)="runNaive()"
                      >
                        Disparar todo
                      </fb-button>
                      @if (bpMode() === 'naive') {
                        <p class="b-foot">en cola: {{ bpPending() }}…</p>
                      } @else if (naivePeak(); as p) {
                        <div class="b-bp-bar" data-kind="naive">
                          <div class="b-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                        </div>
                        <p class="b-foot b-danger">
                          ✗ pico en vuelo: {{ p }} · la última tardó {{ naiveMaxLatency() }}ms en
                          volver
                        </p>
                      } @else {
                        <p class="b-hint">
                          Dispara las {{ bpTotal }} de una: el worker procesa de a uno y el resto se
                          encola sin techo.
                        </p>
                      }
                    </div>

                    <div class="b-col">
                      <h2>Con backpressure</h2>
                      <p class="b-col-sub">ventana de {{ bpWindow }} · esperás el ack</p>
                      <fb-button [disabled]="bpMode() !== 'idle'" (pressed)="runBackpressure()"
                        >Con control de flujo</fb-button
                      >
                      @if (bpMode() === 'backpressure') {
                        <p class="b-foot">en cola: {{ bpPending() }}…</p>
                      } @else if (bpPeak(); as p) {
                        <div class="b-bp-bar" data-kind="bp">
                          <div class="b-bp-fill" [style.width.%]="bpPctOf(p)"></div>
                        </div>
                        <p class="b-foot">
                          ✓ pico en vuelo: {{ p }} · la última: {{ bpMaxLatency() }}ms, acotada
                        </p>
                      } @else {
                        <p class="b-hint">
                          Manda {{ bpWindow }}, espera el ack, manda la próxima: la cola queda
                          acotada al ritmo del worker.
                        </p>
                      }
                    </div>
                  </div>
                </fb-card>
              }

              @case ('shared-memory') {
                <fb-card title="Memoria compartida">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El worker escribe un número en la memoria compartida; el main lo lee directo, sin postMessage.'
                    }}
                  </p>
                  @if (!smSupported()) {
                    <p class="b-foot b-danger">
                      backend simulado · SharedArrayBuffer necesita cabeceras COOP/COEP
                    </p>
                  }

                  <div class="b-sm">
                    <div class="b-sm-side">
                      <span class="b-sm-who">MAIN</span>
                      <span class="b-sm-act">lee →</span>
                    </div>
                    <div class="b-sm-cell">{{ smValue() }}</div>
                    <div class="b-sm-side">
                      <span class="b-sm-who">WORKER</span>
                      <span class="b-sm-act">← escribe</span>
                    </div>
                  </div>
                  <div class="b-bar"><div class="b-bar-fill" [style.width.%]="smPct()"></div></div>
                  <p class="b-bar-label">
                    0 mensajes intercambiados · es la misma memoria, escrita por el worker y leída
                    por el main
                  </p>

                  <div class="b-send">
                    <fb-button variant="solid" [disabled]="smRunning()" (pressed)="startSm()">
                      {{ smRunning() ? 'contando… ' + smValue() + '/' + smTarget : 'Arrancar' }}
                    </fb-button>
                    @if (smValue() && !smRunning()) {
                      <fb-button (pressed)="resetSm()">Reset</fb-button>
                    }
                  </div>
                </fb-card>
              }

              @case ('degradation') {
                <fb-card title="Degradación elegante">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'El mismo trabajo corre off-thread si hay Worker, o en el main si no. Mismo resultado, distinta UX.'
                    }}
                  </p>
                  <p class="b-bar-label">
                    typeof Worker → {{ degSupported() ? 'disponible ✓' : 'no disponible' }}
                  </p>

                  <div class="b-send">
                    <fb-button (pressed)="toggleFallback()">
                      {{
                        degForce()
                          ? '☑ simulando navegador sin Worker'
                          : '☐ simular navegador sin Worker'
                      }}
                    </fb-button>
                    <fb-button variant="solid" [disabled]="degRunning()" (pressed)="runDeg()">
                      {{ degRunning() ? 'procesando…' : 'Procesar' }}
                    </fb-button>
                    @if (degResult() && !degRunning()) {
                      <fb-button (pressed)="resetDeg()">Reset</fb-button>
                    }
                  </div>

                  @if (degResult(); as r) {
                    @if (r.path === 'worker') {
                      <p class="b-foot">
                        ✓ Corrió en un WORKER · {{ r.value }} primos · {{ r.ms }} ms · la UI no se
                        trabó
                      </p>
                    } @else {
                      <p class="b-foot b-danger">
                        ⚠ Fallback: corrió en el MAIN · {{ r.value }} primos · {{ r.ms }} ms · la UI
                        se congeló, pero el resultado es el mismo
                      </p>
                    }
                  } @else {
                    <p class="b-hint">
                      Mismo código, dos caminos según el feature-detect. Tildá el fallback y volvé a
                      procesar: el resultado es idéntico, sólo cambia si la UI se traba.
                    </p>
                  }
                </fb-card>
              }

              @case ('clone-cost') {
                <fb-card title="Costo de clonar">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Movés el tamaño y la complejidad, medís el round-trip real y mirás la curva trepar.'
                    }}
                  </p>

                  <div class="b-cc-ctl">
                    <label class="b-cc-field">
                      <span
                        >Tamaño: {{ ccSize() }}
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
                    <label class="b-cc-field">
                      <span
                        >Complejidad: {{ ccDepth() }}
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

                  <div class="b-send">
                    <fb-button
                      variant="solid"
                      [disabled]="cloneRunning()"
                      (pressed)="runCloneSweep()"
                    >
                      {{ cloneRunning() ? 'midiendo…' : 'Medir' }}
                    </fb-button>
                    @if (cloneMeasurements().length && !cloneRunning()) {
                      <fb-button (pressed)="resetClone()">Reset</fb-button>
                    }
                  </div>

                  <div class="b-cc-chart">
                    <wwp-clone-cost-chart [points]="chartPoints()" />
                  </div>

                  @if (cloneLast(); as last) {
                    <p class="b-foot">
                      ✓ {{ cloneMeasurements().length }} mediciones · el payload de
                      {{ fmtBytes(last.serializedBytes) }} tardó {{ fmtMs(last.ms) }} ms en ir y
                      volver (profundidad {{ cloneDepthRun() }})
                    </p>
                  } @else {
                    <p class="b-hint">
                      Movés los sliders y tocás Medir: mandamos payloads cada vez más grandes al
                      worker y cronometramos el ida y vuelta REAL. Cada punto es una medición tuya,
                      no un número inventado.
                    </p>
                  }
                </fb-card>
              }

              @case ('compositor-jank') {
                <fb-card title="El otro hilo: compositor">
                  <p class="b-lead">
                    {{
                      content()?.whatToWatch ??
                        'Bloqueá el main y mirá: la caja CSS sigue girando, la caja JS se congela.'
                    }}
                  </p>

                  <div class="b-send">
                    <fb-button
                      variant="solid"
                      [disabled]="compMode() !== 'idle'"
                      (pressed)="blockMainComp()"
                    >
                      Bloquear el main
                    </fb-button>
                    <fb-button [disabled]="compMode() !== 'idle'" (pressed)="blockWorkerComp()">
                      Bloquear en un worker
                    </fb-button>
                  </div>

                  <div class="b-comp">
                    <div class="b-comp-cell">
                      <span class="b-comp-tag">CSS transform · compositor</span>
                      <div class="b-comp-box b-comp-css"></div>
                      <span class="b-comp-sub">sigue girando aunque el main se trabe</span>
                    </div>
                    <div class="b-comp-cell">
                      <span class="b-comp-tag">JS · main thread</span>
                      <div class="b-comp-box b-comp-js" #compJs></div>
                      <span class="b-comp-sub">se congela cuando el main se bloquea</span>
                    </div>
                    <div class="b-comp-cell">
                      <span class="b-comp-tag">FPS del main</span>
                      <div class="b-comp-fps" [attr.data-low]="mainFps() < 30">{{ mainFps() }}</div>
                      <span class="b-comp-sub">~60 libre · ~0 bloqueado</span>
                    </div>
                  </div>

                  <div aria-live="polite">
                    @switch (compMode()) {
                      @case ('main') {
                        <p class="b-foot b-danger">
                          ▶ bloqueando el MAIN… la caja JS y los FPS están congelados; la CSS no.
                        </p>
                      }
                      @case ('worker') {
                        <p class="b-foot">
                          ▶ el MISMO cómputo corre en un worker… el main sigue libre, todo fluido.
                        </p>
                      }
                      @default {
                        <p class="b-hint">
                          Tocá «Bloquear el main»: se congela todo MENOS la caja CSS (la mueve el
                          compositor, otro hilo). Después probá en un worker: nada se congela.
                        </p>
                      }
                    }
                  </div>
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
        overflow-wrap: anywhere;
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
      .b-oc-ctl {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .b-oc-frame {
        border: var(--border-width, 2px) solid var(--ink);
        background: var(--surface-raised);
        line-height: 0;
      }
      .b-oc-canvas {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
      }
      .b-oc-dead {
        opacity: 0.5;
        filter: grayscale(0.7);
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
      .b-col h2 {
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

      /* ── shared-memory (ej. 12): main · celda · worker ── */
      .b-sm {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 16px;
        margin: 8px 0 14px;
      }
      .b-sm-side {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-family: var(--font-mono);
      }
      .b-sm-side:last-child {
        text-align: right;
      }
      .b-sm-who {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 18px;
      }
      .b-sm-act {
        font-size: 12px;
        color: var(--ink-muted);
      }
      .b-sm-cell {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: clamp(48px, 9vw, 84px);
        line-height: 1;
        min-width: 120px;
        text-align: center;
        padding: 12px 20px;
        border: var(--border-width) solid var(--border);
        background: var(--accent);
        color: var(--surface);
      }

      /* ── backpressure (ej. 11): barra de pico de cola ── */
      .b-bp-bar {
        height: 16px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        margin: 12px 0 6px;
        overflow: hidden;
      }
      .b-bp-fill {
        height: 100%;
        transition: width 0.3s ease-out;
      }
      .b-bp-bar[data-kind='naive'] .b-bp-fill {
        background: var(--thread-blocked);
      }
      .b-bp-bar[data-kind='bp'] .b-bp-fill {
        background: var(--thread-worker);
      }

      /* ── worker-pool (ej. 10): cola de tareas + slots ── */
      .b-pool-queue {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 4px 0 18px;
      }
      .b-pool-task {
        width: 34px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        border: 2px solid var(--border);
        background: var(--surface-raised);
        color: var(--ink-muted);
      }
      .b-pool-task[data-state='running'] {
        background: var(--thread-worker);
        color: var(--surface);
        border-color: var(--thread-worker);
      }
      .b-pool-task[data-state='done'] {
        background: var(--surface);
        color: var(--border);
        opacity: 0.5;
      }
      .b-pool-slots {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 4px 0 16px;
      }
      .b-pool-slot {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        font-family: var(--font-mono);
      }
      .b-pool-slot[data-busy='true'] {
        background: var(--accent);
        color: var(--surface);
      }
      .b-pool-slot-w {
        font-weight: 800;
        font-size: 14px;
      }
      .b-pool-slot-task {
        font-size: 12px;
      }
      .b-pool-slot-x {
        font-size: 12px;
        font-weight: 700;
      }

      /* ── worker-limits (ej. 09): filas de tiempo por cantidad de workers ── */
      .b-lim {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 4px 0 12px;
      }
      .b-lim-row {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 700;
      }
      .b-lim-k {
        width: 40px;
        text-align: right;
      }
      .b-lim-bar {
        flex: 1;
        height: 18px;
        border: var(--border-width) solid var(--border);
        background: var(--surface-raised);
        overflow: hidden;
      }
      .b-lim-fill {
        height: 100%;
        /* Tinta (no lima) para que el relleno contraste con el borde lima del track. */
        background: var(--ink);
        transition: width 0.3s ease-out;
      }
      .b-lim-row[data-over='true'] .b-lim-fill {
        background: var(--thread-blocked);
      }
      .b-lim-ms {
        width: 64px;
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

      /* ── offload (ej. 04): input N ── */
      .b-nrow {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 18px;
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

      /* ── clone-cost (ej. 15): sliders + gráfica de costo ── */
      .b-cc-ctl {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin-bottom: 18px;
      }
      .b-cc-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1 1 220px;
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
        color: var(--ink);
      }
      .b-cc-field input[type='range'] {
        width: 100%;
        accent-color: var(--accent);
      }
      .b-cc-chart {
        border: var(--border-width, 2px) solid var(--border);
        background: var(--surface-raised);
        padding: 12px;
        margin-bottom: 14px;
      }

      /* ── compositor-jank (ej. 16): CSS box (compositor) vs JS box (main) + FPS ── */
      .b-comp {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin: 8px 0 14px;
      }
      .b-comp-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        padding: 16px 10px;
        border: var(--border-width, 2px) solid var(--border);
        background: var(--surface-raised);
      }
      .b-comp-tag {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        color: var(--ink);
      }
      .b-comp-sub {
        font-family: var(--font-mono);
        font-size: 10px;
        line-height: 1.4;
        color: var(--ink-muted);
      }
      .b-comp-box {
        width: 52px;
        height: 52px;
        background: var(--accent);
        border: var(--border-width, 2px) solid var(--border);
      }
      .b-comp-css {
        animation: fb-comp-spin 2s linear infinite;
      }
      .b-comp-fps {
        font-family: var(--font-display, var(--font-mono));
        font-weight: 800;
        font-size: 52px;
        line-height: 1;
        color: var(--thread-worker);
      }
      .b-comp-fps[data-low='true'] {
        color: var(--thread-blocked);
      }
      @keyframes fb-comp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .b-comp-css {
          animation: none;
        }
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
