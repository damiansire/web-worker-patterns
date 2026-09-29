import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { heavyLimit, PROBE_HALF, PROBE_LIMIT, probeCost } from './calibrate';

/**
 * Qué HACE cada camino de cada misión: dispara el servicio real del ejemplo (los
 * mismos workers y el mismo freeze que usa el resto del sitio) y devuelve lo que
 * midió. Acá no hay simulación: si un camino dice que Main se congela, el juego
 * entero se congela con él.
 */
export type Values = Record<string, string | number>;

export interface PathResult {
  values: Values;
  /** `missed`: la acción a mitad de camino no llegó. `simulated`: el navegador no dio la real. */
  outcome?: 'missed' | 'simulated';
}

export interface MissionContext {
  ctl: ExampleLayoutController;
  /** Resuelve cuando `read` devuelve algo verdadero. */
  until: <T>(read: () => T | null | undefined | false | 0) => Promise<T>;
  /** Pasos que dio el jugador desde que arrancó el camino. */
  steps: () => number;
  /** Ofrece la acción a mitad de camino y resuelve cuando el jugador la toma. */
  act: () => Promise<void>;
}

type Runner = (context: MissionContext) => Promise<PathResult>;

/**
 * Caminos que bloquean el main de verdad. El juego los anuncia (todos quedan con
 * la mirada clavada) un frame antes de que el propio juego se congele.
 */
export const BLOCKS_MAIN: ReadonlySet<string> = new Set([
  '01-setinterval-counter/main',
  '02-main-thread/block',
  '16-compositor-vs-main/main',
  '04-offloading-computation/main',
  '14-offscreen-canvas/block',
  '13-graceful-degradation/fallback',
]);

/** El juego elige el trabajo midiendo la máquina: acepta más que lo que se tipea a mano. */
const HEAVY_MAX = 12_000_000;

const now = () => performance.now();
const seconds = (ms: number) =>
  (ms / 1000).toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
  ' s';
const number = (n: number) => n.toLocaleString('es-UY');
const millis = (ms: number) =>
  ms.toLocaleString('es-UY', { maximumFractionDigits: ms < 10 ? 1 : 0 });
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Hasta dónde cuenta el Molinero en esta máquina. Se mide una sola vez, en un
 * worker (Main ni se entera), y los dos caminos cuentan hasta el mismo número: así
 * el resultado coincide y lo único que cambia es quién esperó.
 */
let heavy: Promise<number> | null = null;
const measureHeavy = ({ ctl, until }: Pick<MissionContext, 'ctl' | 'until'>): Promise<number> => {
  const count = async (limit: number) => {
    ctl.computeWorker(String(limit));
    await until(() => ctl.computePhase() === 'idle');
    const result = ctl.workerResult();
    return result?.limit === limit ? result.ms : 0;
  };
  heavy ??= (async () => {
    const half = await count(PROBE_HALF);
    return heavyLimit(probeCost(half, await count(PROBE_LIMIT)));
  })();
  return heavy;
};

/**
 * Lo que una misión adelanta apenas se abre la conversación, mientras el vecino
 * saluda: cuando el jugador elige un camino, ya está listo.
 */
export const PREPARE: Record<
  string,
  (context: Pick<MissionContext, 'ctl' | 'until'>) => Promise<unknown>
> = {
  '04-offloading-computation': measureHeavy,
};

/** Bloquea el main con el runner del ejemplo 01 y mide cuánto estuvo congelado. */
const blockMain: Runner = async ({ ctl, until }) => {
  const t0 = now();
  ctl.runMain();
  await until(() => ctl.mainLanes());
  return { values: { seg: seconds(now() - t0) } };
};

export const RUNNERS: Record<string, Record<string, Runner>> = {
  '01-setinterval-counter': {
    main: blockMain,
    worker: async ({ ctl, until, steps }) => {
      ctl.runWorker();
      await until(() => ctl.phase() === 'idle' && ctl.workerTicks() > 0);
      return { values: { ticks: ctl.workerTicks(), steps: steps() } };
    },
  },
  '02-main-thread': { block: blockMain },
  '16-compositor-vs-main': {
    main: async ({ ctl, until }) => {
      ctl.blockMainComp();
      await until(() => ctl.compMode() === 'idle');
      return { values: {} };
    },
    worker: async ({ ctl, until }) => {
      ctl.blockWorkerComp();
      await until(() => ctl.compMode() === 'idle');
      return { values: {} };
    },
  },
  '03-basic-communication': {
    function: async ({ ctl }) => ({ values: { error: ctl.sendUncloneable() ?? '' } }),
    message: async ({ ctl, until }) => {
      const before = ctl.messages().length;
      const sent = 'hola';
      ctl.send(sent);
      await until(() => !ctl.pending() && ctl.messages().length >= before + 2);
      const reply = ctl.messages().at(-1);
      return { values: { sent, reply: reply?.text ?? '', ms: millis(reply?.roundTripMs ?? 0) } };
    },
  },
  '08-shared-worker': {
    share: async ({ ctl, until }) => {
      const before = ctl.swCount();
      ctl.swInc(ctl.swPanels()[0]?.label ?? '#1');
      await until(() => ctl.swCount() > before);
      return {
        values: { count: ctl.swCount() },
        outcome: ctl.swSupported() ? undefined : 'simulated',
      };
    },
  },
  '04-offloading-computation': {
    main: async ({ ctl, until }) => {
      ctl.computeMain(String(await measureHeavy({ ctl, until })), HEAVY_MAX);
      const result = await until(() => ctl.mainResult());
      return { values: { count: number(result.count), seg: seconds(result.ms) } };
    },
    worker: async ({ ctl, until, steps }) => {
      ctl.computeWorker(String(await measureHeavy({ ctl, until })), HEAVY_MAX);
      await until(() => ctl.computePhase() === 'idle');
      const result = ctl.workerResult();
      if (!result) throw new Error(ctl.computeError() ?? 'sin resultado');
      return {
        values: { count: number(result.count), seg: seconds(result.ms), steps: steps() },
      };
    },
  },
  '07-transferable-objects': {
    clone: async ({ ctl, until }) => {
      ctl.runClone();
      await until(() => !ctl.transferBusy());
      const result = ctl.cloneResult();
      if (!result) throw new Error(ctl.transferError() ?? 'sin resultado');
      return { values: { ms: millis(result.ms) } };
    },
    transfer: async ({ ctl, until }) => {
      ctl.runTransfer();
      await until(() => !ctl.transferBusy());
      const result = ctl.transferResult();
      if (!result) throw new Error(ctl.transferError() ?? 'sin resultado');
      return { values: { ms: millis(result.ms) } };
    },
  },
  '10-worker-pool': {
    pool: async ({ ctl, until }) => {
      ctl.resetPool();
      ctl.runPool();
      await until(() => !ctl.poolRunning() && ctl.poolTasks().length > 0);
      if (ctl.poolProcessed() < ctl.poolTaskCount) throw new Error('la cuadrilla no terminó');
      return { values: { tasks: ctl.poolTaskCount, workers: ctl.workersCreated() } };
    },
  },
  '14-offscreen-canvas': {
    block: async ({ ctl, until }) => {
      // Los relojes ya giran desde que se abrió la conversación (los arranca el juego).
      await until(() => ctl.ocRunning());
      await pause(600);
      ctl.blockOffscreen();
      await until(() => ctl.ocBlocked());
      await until(() => !ctl.ocBlocked());
      return {
        values: { frames: ctl.ocSkipped() },
        outcome: ctl.ocSupported() ? undefined : 'simulated',
      };
    },
  },
  '15-clone-cost': {
    measure: async ({ ctl, until }) => {
      ctl.runCloneSweep();
      await until(() => !ctl.cloneRunning());
      const measures = ctl.cloneMeasurements();
      if (measures.length < 2) throw new Error(ctl.cloneError() ?? 'medición incompleta');
      return {
        values: { first: millis(measures[0].ms), last: millis(measures.at(-1)!.ms) },
      };
    },
  },
  '05-error-handling': {
    broken: async ({ ctl, until }) => {
      const before = ctl.errorEvents().length;
      ctl.sendFail();
      await until(() => !ctl.errorBusy() && ctl.errorEvents().length > before);
      if (ctl.errorEvents().at(-1)?.status !== 'error') throw new Error('no falló');
      return { values: {} };
    },
  },
  '06-lifecycle-termination': {
    cut: async ({ ctl, until, act }): Promise<PathResult> => {
      ctl.resetLife();
      ctl.startLife();
      const cut = await Promise.race([
        act().then(() => true),
        until(() => ctl.lifeStatus() === 'done').then(() => false),
      ]);
      if (!cut) {
        return { values: {}, outcome: 'missed' };
      }
      ctl.terminateLife();
      return { values: { step: ctl.lifeStep() } };
    },
  },
  '09-worker-limits': {
    scale: async ({ ctl, until }) => {
      ctl.runLimits();
      await until(() => !ctl.limitRunning() && ctl.limitRuns().length > 0);
      return { values: { cores: ctl.hardwareConcurrency() } };
    },
  },
  '11-backpressure-scheduling': {
    flood: async ({ ctl, until }) => {
      ctl.runNaive();
      await until(() => ctl.bpMode() === 'idle');
      if (ctl.bpError()) throw new Error(ctl.bpError()!);
      return { values: { peak: ctl.naivePeak() ?? 0, ms: number(ctl.naiveMaxLatency() ?? 0) } };
    },
    window: async ({ ctl, until }) => {
      ctl.runBackpressure();
      await until(() => ctl.bpMode() === 'idle');
      if (ctl.bpError()) throw new Error(ctl.bpError()!);
      return { values: { peak: ctl.bpPeak() ?? 0 } };
    },
  },
  '12-shared-array-buffer': {
    share: async ({ ctl, until }) => {
      ctl.resetSm();
      ctl.startSm();
      await until(() => !ctl.smRunning());
      if (ctl.smValue() < ctl.smTarget) throw new Error('la cuenta no llegó');
      return {
        values: { value: ctl.smValue() },
        outcome: ctl.smSupported() ? undefined : 'simulated',
      };
    },
  },
  '13-graceful-degradation': {
    fallback: async ({ ctl, until }) => {
      ctl.resetDeg();
      ctl.toggleFallback();
      ctl.runDeg();
      const result = await until(() => !ctl.degRunning() && ctl.degResult());
      ctl.toggleFallback();
      return { values: { count: number(result.value), seg: seconds(result.ms) } };
    },
    worker: async ({ ctl, until }) => {
      ctl.resetDeg();
      ctl.runDeg();
      const result = await until(() => !ctl.degRunning() && ctl.degResult());
      return { values: { count: number(result.value) } };
    },
  },
};

/** Lo que el HUD muestra mientras corre un camino: el número que se está moviendo. */
export const LIVE: Record<string, (ctl: ExampleLayoutController) => string> = {
  '01-setinterval-counter': (ctl) => `${ctl.workerTicks()} tics`,
  '04-offloading-computation': (ctl) => seconds(ctl.liveMs()),
  '06-lifecycle-termination': (ctl) => `paso ${ctl.lifeStep()} de ${ctl.lifeSteps()}`,
  '09-worker-limits': (ctl) => `${ctl.currentWorkers()} a la vez`,
  '10-worker-pool': (ctl) => `${ctl.poolProcessed()} de ${ctl.poolTaskCount}`,
  '11-backpressure-scheduling': (ctl) => `${ctl.bpPending()} en espera`,
  '12-shared-array-buffer': (ctl) => `${ctl.smValue()} de ${ctl.smTarget}`,
  '15-clone-cost': (ctl) => `${ctl.cloneMeasurements().length} de 8`,
};
