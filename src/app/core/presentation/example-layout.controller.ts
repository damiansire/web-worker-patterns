import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { findExample } from '../domain/examples/examples.registry';
import { ExampleRunnerService } from '../services/example-runner.service';
import { ExampleContentService } from '../services/example-content.service';
import { MessageExchangeService } from '../services/message-exchange.service';
import { ExampleWorkerCoordinator } from '../services/example-worker-coordinator.service';
import { ComputeDemoService } from '../services/compute-demo.service';
import { ErrorDemoService } from '../services/error-demo.service';
import { LifecycleDemoService } from '../services/lifecycle-demo.service';
import { TransferDemoService } from '../services/transfer-demo.service';
import { SharedWorkerDemoService } from '../services/shared-worker-demo.service';
import { WorkerLimitsDemoService } from '../services/worker-limits-demo.service';
import { WorkerPoolDemoService } from '../services/worker-pool-demo.service';
import { BackpressureDemoService } from '../services/backpressure-demo.service';
import { SharedMemoryDemoService } from '../services/shared-memory-demo.service';
import { DegradationDemoService } from '../services/degradation-demo.service';
import { OffscreenCanvasDemoService } from '../services/offscreen-canvas-demo.service';
import { CloneCostDemoService } from '../services/clone-cost-demo.service';
import { CompositorDemoService } from '../services/compositor-demo.service';
import { type CloneCostPoint, formatBytes } from '../../ui-primitives/clone-cost-chart.component';

/**
 * Orquestación neutral del example-layout, compartida por los 5 themes.
 *
 * Antes vivía copiada byte-a-byte en cada `*-example-layout.component.ts`
 * (~2100 líneas x5): inyectaba los ~20 demo-services, exponía las signals y
 * los handlers, y armaba los effects de ciclo de vida. Un bug de wiring (un
 * teardown, un onerror) obligaba a tocar 5 archivos sin que nada lo forzara.
 *
 * Ahora la lógica vive UNA sola vez acá. Cada theme-layout se queda con su
 * template + estilos y `inject(ExampleLayoutController)` (scoped a la instancia
 * del componente vía `providers`), leyendo de él todas las signals y handlers.
 * Las piezas atadas al DOM del theme (canvas de OffscreenCanvas, caja JS del
 * compositor) las sigue resolviendo el componente por `viewChild` y se las pasa
 * a los métodos del controller (`startOffscreen`, `setCompositorJsBox`).
 *
 * Boundary: vive en `core/` e inyecta sólo servicios de `core/` — la regla de
 * oro (core ⇏ themes) queda intacta; los themes dependen de core, no al revés.
 */
@Injectable()
export class ExampleLayoutController {
  private readonly route = inject(ActivatedRoute);
  private readonly runner = inject(ExampleRunnerService);
  private readonly exchange = inject(MessageExchangeService);
  private readonly coordinator = inject(ExampleWorkerCoordinator);
  private readonly compute = inject(ComputeDemoService);
  private readonly errors = inject(ErrorDemoService);
  private readonly lifecycle = inject(LifecycleDemoService);
  private readonly transfer = inject(TransferDemoService);
  private readonly shared = inject(SharedWorkerDemoService);
  private readonly limits = inject(WorkerLimitsDemoService);
  private readonly pool = inject(WorkerPoolDemoService);
  private readonly backpressure = inject(BackpressureDemoService);
  private readonly sharedMem = inject(SharedMemoryDemoService);
  private readonly degradation = inject(DegradationDemoService);
  private readonly cloneCost = inject(CloneCostDemoService);
  private readonly compositor = inject(CompositorDemoService);
  private readonly contentSvc = inject(ExampleContentService);
  private readonly oc = inject(OffscreenCanvasDemoService);

  /** Payloads de muestra para la demo de manejo de errores (ej. 05). */
  private readonly VALID_PAYLOAD = '{"user":"ada","role":"admin"}';
  private readonly BROKEN_PAYLOAD = '{user: ada, role}';
  /** Pasos de la tarea larga del ejemplo 06. */
  private readonly LIFECYCLE_STEPS = 12;
  /** Tamaño del buffer de prueba del ejemplo 07. */
  readonly transferMb = 64;
  /** Trabajo (primos hasta N) que corre cada worker en el ejemplo 09. */
  private readonly LIMITS_WORK = 600_000;
  /** Trabajo por tarea del pool (ej. 10): mediano, para que el drenado se vea. */
  private readonly POOL_WORK = 400_000;
  /** Trabajo por mensaje del ejemplo 11 (consumidor algo lento). */
  private readonly BP_WORK = 150_000;
  /** Trabajo del ejemplo 13: si cae al main, debe notarse el freeze. */
  private readonly DEG_WORK = 500_000;
  /** Trabajo del ejemplo 16: pesado para que el bloqueo dure ~2-3s y se note el jank. */
  private readonly COMPOSITOR_WORK = 4_000_000;

  /**
   * Ejemplo a controlar. Por defecto sale de la ruta (`/t/:theme/example/:id`),
   * pero una parada del viaje (journey) puede fijarlo por input vía `useExample`;
   * en ese caso el override manda y el controller deja de mirar la ruta. Así el
   * mismo controller sirve para la página single y para cada parada del scroll.
   */
  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  private readonly idOverride = signal<string | null>(null);
  private readonly id = computed(() => this.idOverride() ?? this.routeId());
  readonly example = computed(() => findExample(this.id()));

  /** Fija el ejemplo por input (paradas del viaje), ignorando la ruta. */
  useExample(id: string): void {
    this.idOverride.set(id);
  }
  /** Contenido educativo neutral (i18n), reactivo al idioma activo. */
  readonly content = this.contentSvc.contentFor(this.id);
  readonly snippets = computed(() =>
    Object.entries(this.example()?.snippets ?? {}).map(([label, code]) => ({ label, code })),
  );

  // thread-block (01)
  readonly workerLanes = this.runner.workerLanes;
  readonly mainLanes = this.runner.mainLanes;
  readonly workerTicks = this.runner.workerTicks;
  readonly mainTicks = this.runner.mainTicks;
  readonly phase = this.runner.phase;

  // message-exchange (03)
  readonly messages = this.exchange.messages;
  readonly pending = this.exchange.pending;
  readonly exchangeError = this.exchange.error;

  // offload (04)
  readonly workerResult = this.compute.workerResult;
  readonly mainResult = this.compute.mainResult;
  readonly liveMs = this.compute.liveMs;
  readonly computePhase = this.compute.phase;
  readonly computeError = this.compute.error;

  // error-handling (05)
  readonly errorEvents = this.errors.events;
  readonly errorBusy = this.errors.busy;

  // lifecycle (06)
  readonly lifeStatus = this.lifecycle.status;
  readonly lifeStep = this.lifecycle.step;
  readonly lifeSteps = this.lifecycle.steps;
  readonly lifePct = computed(() => {
    const total = this.lifeSteps();
    return total > 0 ? Math.round((this.lifeStep() / total) * 100) : 0;
  });

  // transferable (07)
  readonly transferResult = this.transfer.transferResult;
  readonly cloneResult = this.transfer.cloneResult;
  readonly transferBusy = this.transfer.busy;

  // shared-worker (08)
  readonly swInstanceId = this.shared.instanceId;
  readonly swClients = this.shared.clients;
  readonly swCount = this.shared.count;
  readonly swPanels = this.shared.panels;
  readonly swSupported = this.shared.supported;

  // worker-limits (09)
  readonly hardwareConcurrency = this.limits.hardwareConcurrency;
  readonly limitRuns = this.limits.runs;
  readonly limitRunning = this.limits.running;
  readonly currentWorkers = this.limits.currentWorkers;
  readonly limitError = this.limits.error;
  private readonly limitMaxMs = computed(() => Math.max(1, ...this.limitRuns().map((r) => r.ms)));

  // worker-pool (10)
  readonly poolTasks = this.pool.tasks;
  readonly poolSlots = this.pool.slots;
  readonly poolRunning = this.pool.running;
  readonly poolProcessed = this.pool.processed;
  readonly poolSize = this.pool.poolSize;
  readonly poolTaskCount = this.pool.taskCount;
  readonly workersCreated = this.pool.workersCreated;
  readonly spawnedWithoutPool = this.pool.spawnedWithoutPool;

  // backpressure (11)
  readonly bpMode = this.backpressure.mode;
  readonly bpPending = this.backpressure.pending;
  readonly naivePeak = this.backpressure.naivePeak;
  readonly bpPeak = this.backpressure.bpPeak;
  readonly naiveMaxLatency = this.backpressure.naiveMaxLatency;
  readonly bpMaxLatency = this.backpressure.bpMaxLatency;
  readonly bpTotal = this.backpressure.total;
  readonly bpWindow = this.backpressure.windowSize;
  readonly bpError = this.backpressure.error;

  // shared-memory (12)
  readonly smValue = this.sharedMem.value;
  readonly smRunning = this.sharedMem.running;
  readonly smSupported = this.sharedMem.supported;
  readonly smTarget = this.sharedMem.target;

  // degradation (13)
  readonly degSupported = this.degradation.supported;
  readonly degForce = this.degradation.forceFallback;
  readonly degResult = this.degradation.result;
  readonly degRunning = this.degradation.running;

  // offscreen-canvas (14)
  readonly ocSupported = this.oc.supported;
  readonly ocRunning = this.oc.running;
  readonly ocBlocked = this.oc.mainBlocked;
  readonly ocWorkerFps = this.oc.workerFps;
  readonly ocMainFps = this.oc.mainFps;
  readonly ocWorkerFrames = this.oc.workerFrames;
  readonly ocMainFrames = this.oc.mainFrames;
  readonly ocSkipped = this.oc.skippedFrames;

  // clone-cost (15)
  readonly ccSize = signal(8000);
  readonly ccDepth = signal(1);
  readonly cloneMeasurements = this.cloneCost.measurements;
  readonly cloneRunning = this.cloneCost.running;
  readonly cloneDepthRun = this.cloneCost.depth;
  readonly chartPoints = computed<CloneCostPoint[]>(() =>
    this.cloneMeasurements().map((m) => ({ x: m.serializedBytes, y: m.ms })),
  );
  readonly fmtBytes = formatBytes;
  readonly cloneLast = computed(() => this.cloneMeasurements().at(-1) ?? null);

  // compositor-jank (16)
  readonly mainFps = this.compositor.mainFps;
  readonly compMode = this.compositor.mode;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      // Teardown real de cada servicio (no existe un `stop()` genérico).
      this.runner.stop();
      this.pool.reset();
      this.exchange.reset();
      this.compute.reset();
      this.lifecycle.reset();
      this.backpressure.reset();
      this.limits.reset();
      this.shared.close();
      this.sharedMem.reset();
      this.degradation.reset();
      this.cloneCost.reset();
      this.compositor.reset();
      this.oc.reset();
    });

    // Abre el worker del ejemplo activo (no-op si ya está abierto para el mismo
    // ejemplo → la conversación/log sobrevive al cambio de theme).
    effect(() => {
      const ex = this.example();
      if (ex) {
        this.coordinator.openFor(ex);
      }
    });
    // OffscreenCanvas (14): al entrar al ejemplo arrancamos limpio. El canvas se recrea y
    // transferControlToOffscreen() es de una sola vez, así que el estado no sobrevive al
    // re-montaje (inherente a un demo atado a un elemento del DOM, no a datos).
    effect(() => {
      if (this.example()?.demo === 'offscreen-canvas') {
        this.oc.reset();
      }
    });
    // compositor-jank (16): arranca el medidor al entrar y lo frena al salir.
    // `untracked` es CLAVE: startMeter() lee el signal `metering` en su guarda, y
    // sin untracked el effect quedaría suscripto a un signal que él mismo escribe
    // → bucle infinito. Así el effect depende SOLO de example().
    effect((onCleanup) => {
      if (this.example()?.demo === 'compositor-jank') {
        untracked(() => this.compositor.startMeter());
        onCleanup(() => this.compositor.reset());
      }
    });
  }

  // ── offscreen-canvas (14): el componente posee los canvas (viewChild) y los pasa acá ──
  startOffscreen(workerCanvas: HTMLCanvasElement, mainCanvas: HTMLCanvasElement): void {
    const ex = this.example();
    if (ex) {
      this.oc.start(ex, workerCanvas, mainCanvas);
    }
  }

  blockOffscreen(): void {
    this.oc.blockMain();
  }

  /** compositor-jank (16): el componente registra la caja JS (viewChild) acá. */
  setCompositorJsBox(el: HTMLElement | undefined): void {
    this.compositor.setJsBox(el);
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

  startSm(): void {
    const ex = this.example();
    if (ex) {
      this.sharedMem.start(ex);
    }
  }

  resetSm(): void {
    this.sharedMem.reset();
  }

  smPct(): number {
    return Math.round((this.smValue() / this.smTarget) * 100);
  }

  toggleFallback(): void {
    this.degradation.toggleFallback();
  }

  runDeg(): void {
    const ex = this.example();
    if (ex) {
      this.degradation.run(ex, this.DEG_WORK);
    }
  }

  resetDeg(): void {
    this.degradation.reset();
  }

  runCloneSweep(): void {
    const ex = this.example();
    if (ex) {
      this.cloneCost.runSweep(ex, { maxSize: this.ccSize(), depth: this.ccDepth() });
    }
  }

  resetClone(): void {
    this.cloneCost.reset();
  }

  /** Formatea el round-trip: sub-10ms con un decimal, el resto entero. */
  fmtMs(ms: number): string {
    return ms < 10 ? ms.toFixed(1) : String(Math.round(ms));
  }

  blockMainComp(): void {
    this.compositor.blockMain();
  }

  blockWorkerComp(): void {
    const ex = this.example();
    if (ex) {
      this.compositor.blockWorker(ex, this.COMPOSITOR_WORK);
    }
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
