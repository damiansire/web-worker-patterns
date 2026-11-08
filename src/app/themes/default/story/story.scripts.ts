import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { afterNextPaint, busyBlock } from '../../../core/domain/thread-demo';
import { countPrimesUpTo } from '../../../core/domain/workers/primes.worker.logic';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { Scene, Who } from './scene/scene';
import { Mood } from './story.music.logic';
import { SceneId } from './story.levels';

/**
 * Qué pasa en cada nivel con escena. La escena (`scene/scene.ts`) solo actúa;
 * acá se decide qué corre dónde: el trabajo es real (un bucle que congela main
 * de verdad, un worker de verdad) y la escena lo muestra. Cada camino resuelve
 * cuando su animación terminó, con el texto que lo explica.
 *
 * Todo lo dice un personaje (main o el worker), en primera persona, como en un
 * juego: el diálogo muestra quién habla. El problema del nivel va aparte, en
 * grande, y las opciones se eligen en la escena, sobre quien haría el trabajo.
 */

/** Una línea de diálogo y quién la dice. */
export interface Line {
  who: Who;
  text: string;
}

/** El problema del nivel: lo que hay que resolver y la pregunta. */
export interface Problem {
  what: string;
  ask: string;
}

export interface LevelPath {
  id: string;
  /** Corto: va en una etiqueta dentro de la escena. */
  label: string;
  /** Dónde se elige: sobre main, o en la puerta por donde entra el worker. */
  at: 'main' | 'door';
  /** El camino que aplica el patrón: etiqueta dorada. */
  primary?: boolean;
}

export interface LevelContext {
  scene: Scene;
  ctl: ExampleLayoutController;
  /** El escenario: para escuchar los toques del nivel que los necesita. */
  stage: HTMLElement;
  /** Cambia la línea de diálogo mientras el camino corre (por defecto la dice main). */
  narrate(text: string, who?: Who): void;
  /** Un worker propio del nivel: se termina si se sale a mitad de camino. */
  own<T extends { terminate(): void }>(worker: T): T;
  /** Cambia la música según lo que pasa (no hace nada en niveles sin sonido). */
  music(mood: Mood): void;
}

export interface PathResult {
  caption: Line;
  /** Si el camino cuenta como recorrido (un intento vacío no cuenta). */
  completed: boolean;
}

export interface LevelScript {
  /** La situación, en una línea. */
  intro: Line;
  problem: Problem;
  paths: LevelPath[];
  /** Lo que queda al superar el nivel. */
  lesson: string;
  /** Si el nivel tiene música y efectos de sonido. */
  sound?: boolean;
  /** Prepara la escena (tablero, objetos). Devuelve cómo desarmarla. */
  setup?(ctx: LevelContext): (() => void) | void;
  run(pathId: string, ctx: LevelContext): Promise<PathResult>;
}

const fmt = (n: number) => n.toLocaleString('es');
const secs = (ms: number) => (ms / 1000).toLocaleString('es', { maximumFractionDigits: 1 });
const nextPaint = () => new Promise<void>((resolve) => afterNextPaint(resolve));
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const main = (text: string): Line => ({ who: 'main', text });
const worker = (text: string): Line => ({ who: 'worker', text });

/** Espera a que se cumpla una condición sobre los signals (con tope, para no colgarse). */
export async function until(ready: () => boolean, timeoutMs = 30_000, stepMs = 50): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (!ready() && Date.now() < end) await wait(stepMs);
}

const FREEZE: readonly [string, string] = ['bucle', '2,5 s'];
const FREEZE_MS = 2500;
/** Por debajo de esto el atraso no se informa (el navegador no dio la hora real del toque). */
const LATE_MIN_MS = 150;

/** El ejemplo del prólogo: pasarle a un worker el conteo de primos (su worker y su código). */
export const PRIMES_EXAMPLE = '04-offloading-computation';

// ── Prólogo: el mismo cálculo, en main o en un worker ──
const PRIMES = 5_000_000;
const prologue: LevelScript = {
  intro: main(
    '¡Hola! Soy main, el hilo principal: hago malabares con cada clic, el scroll y las animaciones de la página. Tocame o arrastrame.',
  ),
  problem: { what: `Contar los primos hasta ${fmt(PRIMES)}`, ask: '¿Quién lo hace?' },
  paths: [
    { id: 'main', label: 'Main', at: 'main' },
    { id: 'worker', label: 'Un worker', at: 'door', primary: true },
  ],
  lesson:
    'Todo lo que hace la página pasa por main. Si le das un trabajo largo, se congela entera. Un worker es otro hilo: hace el trabajo pesado y main sigue atendiendo.',
  sound: true,
  async run(pathId, { scene, narrate, own, music }) {
    if (pathId === 'main') {
      // La música la lleva main: cuando se congela, se corta con él.
      music('main');
      narrate('Ya tengo las manos ocupadas… ¡y me cae el cálculo encima!');
      await scene.dropOnMain();
      await nextPaint();
      const t0 = performance.now();
      const count = countPrimesUpTo(PRIMES); // acá se congela todo
      const ms = Math.round(performance.now() - t0);
      await scene.thaw();
      return {
        caption: main(
          `Conté ${fmt(count)} primos, pero la página quedó congelada ${fmt(ms)} ms, esta escena incluida: mirá el reloj y el pulso. Probá con un worker.`,
        ),
        completed: true,
      };
    }
    const factory = EXAMPLES.find((e) => e.id === PRIMES_EXAMPLE)?.workerFactory;
    if (!factory) return { caption: main('No hay worker para este cálculo.'), completed: false };
    narrate('¡Dejámelo a mí! Me lo llevo a mi propio hilo.', 'worker');
    // Otro hilo, otra voz: el worker toca a la par y main no pierde el ritmo.
    music('worker');
    await scene.handToWorker();
    narrate('El worker calcula en otro hilo y yo sigo con mis malabares. Tocame mientras tanto.');
    const t0 = performance.now();
    const primes = own(factory());
    const result = await new Promise<{ count: number } | { error: string }>((resolve) => {
      primes.onmessage = ({ data }: MessageEvent<{ type?: string; count?: number }>) => {
        if (data?.type === 'result') resolve({ count: data.count ?? 0 });
      };
      primes.onerror = (event) => {
        event.preventDefault();
        resolve({ error: event.message || 'error desconocido' });
      };
      primes.postMessage({ command: 'compute', limit: PRIMES });
    });
    primes.terminate();
    if ('error' in result) {
      await scene.fumble();
      return { caption: worker(`Uy, fallé: ${result.error}.`), completed: false };
    }
    const ms = Math.round(performance.now() - t0);
    await scene.deliver(`${fmt(result.count)} primos`);
    return {
      caption: worker(
        `¡Listo! ${fmt(result.count)} primos en ${fmt(ms)} ms, y main no soltó nada. Eso es un Web Worker.`,
      ),
      completed: true,
    };
  },
};

// ── 01 · Tic, tac: setInterval corre en el hilo que lo creó ──
const counter: LevelScript = {
  intro: main(
    'Tengo que marcar un tic cada medio segundo con setInterval. Cinco tics y listo. Fácil… si nadie me interrumpe.',
  ),
  problem: { what: 'Cinco tics, uno cada medio segundo', ask: '¿Quién lleva la cuenta?' },
  paths: [
    { id: 'main', label: 'Main, con un bucle de 2,5 s', at: 'main' },
    { id: 'worker', label: 'Un worker', at: 'door', primary: true },
  ],
  lesson:
    'setInterval no es otro hilo: sus tics corren en el hilo que lo creó. Si ese hilo se traba, el tic espera. En un worker, el reloj sigue aunque main esté ocupado.',
  setup: ({ scene }) => {
    scene.board('tics', '0');
    return () => scene.board(null);
  },
  async run(pathId, { scene, ctl, narrate }) {
    if (pathId === 'main') {
      scene.board('tics de main', '0');
      narrate('Arranco mi setInterval… ¡y me cae un bucle de 2,5 s encima!');
      await scene.dropOnMain(FREEZE);
      ctl.runMain();
      await until(() => ctl.phase() !== 'main');
      await scene.boardValue(String(ctl.mainTicks()));
      await scene.thaw();
      return {
        caption: main(
          'Durante 2,5 s no marqué ni un tic: estaba trabado y mi setInterval esperaba en la fila. Al soltarme, los atrasados llegaron de golpe. Probá con un worker.',
        ),
        completed: true,
      };
    }
    scene.board('tics del worker', '0');
    narrate('Yo traigo mi propio setInterval…', 'worker');
    await scene.workerEnter();
    ctl.runWorker();
    let shown = 0;
    await until(() => {
      const n = ctl.workerTicks();
      if (n > shown) {
        shown = n;
        void scene.boardValue(String(n), 'worker');
      }
      return ctl.phase() === 'idle';
    });
    await wait(700);
    scene.say('worker', `¡${shown} de 5!`);
    return {
      caption: worker(
        'Un tic cada 500 ms, puntual, y main nunca soltó sus malabares: mi setInterval corría en mi hilo y le avisaba con postMessage.',
      ),
      completed: shown >= 5,
    };
  },
};

// ── 02 · La fila de main: el event loop atiende de a uno ──
const queue: LevelScript = {
  intro: main(
    'Atiendo todo de a una cosa por vez, en fila: tus clics, el scroll, las animaciones. Congelame y, mientras tanto, tocá la escena varias veces.',
  ),
  problem: { what: 'Main va a quedar congelado 2,5 s', ask: '¿Qué pasa con tus clics?' },
  paths: [{ id: 'block', label: 'Congelar a main', at: 'main', primary: true }],
  lesson:
    'Los clics no se pierden: esperan en la fila de tareas (el event loop). Pero main los atiende recién cuando termina lo que estaba haciendo, y para quien tocó eso se siente como una página rota.',
  setup: ({ scene }) => {
    scene.board('clics en fila', '0');
    return () => scene.board(null);
  },
  async run(_pathId, { scene, stage, narrate }) {
    scene.board('clics en fila', '0');
    narrate('¡Quedé atrapado en un bucle de 2,5 s! Tocá la escena ahora, varias veces.');
    await scene.dropOnMain(FREEZE);
    await nextPaint();

    // Los toques del congelamiento quedan en cola y se despachan apenas main se
    // suelta: todo lo que llega mientras estos oyentes están puestos esperó en la
    // fila. Se atrapan antes de que lleguen a la escena (si no, main los toma por
    // cosquillas). El atraso sale de `timeStamp` (la hora real del toque); si el
    // navegador no la da, se muestra solo que esperó.
    const queued: { x: number; y: number; late: number }[] = [];
    let start = 0;
    const lateOf = (e: Event) => performance.now() - Math.max(e.timeStamp, start);
    const onTap = (e: PointerEvent) => {
      e.stopPropagation();
      queued.push({ ...scene.toScene(e.clientX, e.clientY), late: lateOf(e) });
    };
    const onKey = (e: KeyboardEvent) => {
      queued.push({ x: 260 + queued.length * 40, y: 230, late: lateOf(e) });
    };
    stage.addEventListener('pointerdown', onTap, true);
    addEventListener('keydown', onKey, true);
    start = performance.now();
    busyBlock(FREEZE_MS); // <- acá se congela todo
    await wait(80);
    stage.removeEventListener('pointerdown', onTap, true);
    removeEventListener('keydown', onKey, true);

    const thawing = scene.thaw();
    let n = 0;
    await Promise.all(
      queued.slice(0, 12).map(async (c, i) => {
        await wait(i * 220);
        await scene.queuedClick(
          c.x,
          c.y,
          c.late >= LATE_MIN_MS ? `+${secs(c.late)} s` : '¡esperé!',
        );
        await scene.boardValue(String(++n));
      }),
    );
    await thawing;
    if (!queued.length) {
      return {
        caption: main(
          'Estuve congelado 2,5 s, pero no llegaste a tocar nada. Probá de nuevo: tocá la escena mientras estoy congelado.',
        ),
        completed: false,
      };
    }
    const worst = Math.max(...queued.map((c) => c.late));
    const times = `${queued.length} ${queued.length === 1 ? 'vez' : 'veces'}`;
    return {
      caption: main(
        `Tocaste ${times} durante el congelamiento y ninguno se perdió: esperaron en la fila y los atendí recién al soltarme` +
          (worst >= LATE_MIN_MS ? `, el más viejo con ${secs(worst)} s de atraso.` : '.'),
      ),
      completed: true,
    };
  },
};

// ── 16 · Lo que no se congela: el compositor anima sin main ──
const fan: LevelScript = {
  intro: main(
    'En la pared hay un ventilador que gira con una animación CSS (transform). Y yo estoy por quedar trabado.',
  ),
  problem: { what: 'Main va a quedar trabado 2,5 s', ask: '¿Se frena el ventilador?' },
  paths: [
    { id: 'main', label: 'Trabar a main', at: 'main' },
    { id: 'worker', label: 'El trabajo, a un worker', at: 'door', primary: true },
  ],
  lesson:
    'Una animación CSS de transform u opacity la mueve el compositor, otro hilo del navegador: sigue aunque main esté trabado. Lo que se anima con JavaScript sí se congela. Para que todo siga vivo, el trabajo pesado va a un worker.',
  setup: ({ scene }) => {
    const node = document.createElement('div');
    node.innerHTML =
      '<div class="lv-fan"><div class="lv-fan-blades"><i></i><i></i><i></i></div><b></b><span>CSS</span></div>';
    return scene.pin(node, 330, 150);
  },
  async run(pathId, { scene, ctl, narrate }) {
    if (pathId === 'main') {
      narrate('Me trabo 2,5 s. Mirá el ventilador, el reloj y el pulso.');
      await scene.dropOnMain(FREEZE);
      ctl.blockMainComp();
      await until(() => ctl.compMode() === 'idle');
      await scene.thaw();
      return {
        caption: main(
          'Estuve congelado: el reloj y el pulso se frenaron, y la escena también. Pero el ventilador nunca paró: lo gira el compositor, no yo.',
        ),
        completed: true,
      };
    }
    narrate('Me llevo el mismo trabajo a mi hilo…', 'worker');
    await scene.handToWorker(['mismo trabajo', '4 000 000']);
    ctl.blockWorkerComp();
    await until(() => ctl.compMode() === 'idle');
    await scene.deliver('¡listo!');
    return {
      caption: worker(
        'Mismo trabajo, y nada se frenó: ni el ventilador (lo mueve el compositor) ni main con sus malabares (el trabajo estaba en mi hilo).',
      ),
      completed: true,
    };
  },
};

export const SCRIPTS: Record<SceneId, LevelScript> = { prologue, counter, queue, fan };
