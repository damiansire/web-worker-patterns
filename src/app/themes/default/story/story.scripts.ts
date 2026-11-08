import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { afterNextPaint, busyBlock } from '../../../core/domain/thread-demo';
import { countPrimesUpTo } from '../../../core/domain/workers/primes.worker.logic';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { Scene, Who } from './scene/scene';
import { Mood } from './story.music.logic';
import { SceneId } from './story.levels';
import { Lane, TaskKind } from './story.threads.logic';

/**
 * Qué pasa en cada nivel con escena. La escena (`scene/scene.ts`) solo actúa;
 * acá se decide qué corre dónde: el trabajo es real (un bucle que congela main
 * de verdad, un worker de verdad) y la escena lo muestra. Cada camino resuelve
 * cuando su animación terminó, con el texto que lo explica.
 *
 * Todo lo dice un personaje (main o el worker), en primera persona, como en un
 * juego: el diálogo muestra quién habla. El problema del nivel va aparte, en
 * grande, y las opciones se eligen en la escena, sobre quien haría el trabajo.
 *
 * Cada nivel cuenta además lo que hace cada hilo (`threads`, el panel "Hilos
 * del navegador") y arma su código de a poco (`code`): cada pedazo aparece
 * cuando pasa lo que hace, con una línea que lo explica.
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

/** Un pedazo del código del nivel: aparece cuando pasa lo que hace. */
export interface CodeStep {
  id: string;
  /** El archivo donde va. */
  file: string;
  /** Qué hace, en una o dos frases, para quien lo ve por primera vez. */
  note: string;
  code: string;
}

/** Lo que el nivel le cuenta al panel "Hilos del navegador". */
export interface LevelThreads {
  /** Empieza un trabajo largo en un hilo. Devuelve cómo terminarlo. */
  work(lane: Lane, label: string): () => void;
  /** Una tarea corta en un hilo (un tic, un mensaje que llega). */
  blip(lane: Lane, kind: TaskKind, label?: string): void;
  /** Algo entra a la fila de main a la hora `arrived` (de `performance.now()`). Devuelve su id. */
  enqueue(kind: TaskKind, arrived: number): number;
  /** Main saca de la fila lo que entró con ese id y lo atiende (ahora, o a la hora `at`). */
  take(id: number, label: string, at?: number): void;
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
  threads: LevelThreads;
  /** Muestra un pedazo del código (por su id), en su lugar dentro del orden del guion. */
  code(stepId: string): void;
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
  /** El código del nivel, en el orden en que se lee; cada pedazo aparece cuando pasa. */
  code: CodeStep[];
  /** Lo que mueve el compositor en este nivel: suma su carril al panel de hilos. */
  compositor?: string;
  /** Prepara la escena (tablero, objetos). Devuelve cómo desarmarla. */
  setup?(ctx: LevelContext): (() => void) | void;
  run(pathId: string, ctx: LevelContext): Promise<PathResult>;
}

const fmt = (n: number) => n.toLocaleString('es');
const secs = (ms: number) => (ms / 1000).toLocaleString('es', { maximumFractionDigits: 1 });
const nextPaint = () => new Promise<void>((resolve) => afterNextPaint(resolve));
/**
 * Antes de congelar main: dos cuadros, para que la barra del trabajo largo ya
 * esté pintada y el compositor la esté animando cuando main se traba.
 */
const settle = async () => {
  await nextPaint();
  await nextPaint();
};
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
  code: [
    {
      id: 'main',
      file: 'en-main.ts',
      note: 'Si main hace la cuenta, nadie más usa su hilo hasta que termine: ni clics, ni scroll, ni animaciones.',
      code: `// Corre en main: la página queda congelada hasta que vuelve.
const total = contarPrimos(5_000_000);
mostrar(total);`,
    },
    {
      id: 'create',
      file: 'main.ts',
      note: 'new Worker arranca otro hilo, con su propio archivo. Desde acá, main y el worker corren a la vez.',
      code: `const worker = new Worker(new URL('./primos.worker.ts', import.meta.url), {
  type: 'module',
});`,
    },
    {
      id: 'receive',
      file: 'main.ts',
      note: 'La respuesta le llega a main como un mensaje: una tarea más de su fila, que atiende enseguida porque está libre.',
      code: `worker.onmessage = ({ data }) => {
  mostrar(data.count);
  worker.terminate(); // listo: se cierra el hilo
};`,
    },
    {
      id: 'send',
      file: 'main.ts',
      note: 'postMessage le pasa el trabajo al worker (el dato viaja copiado) y main vuelve a lo suyo al instante.',
      code: `worker.postMessage({ command: 'compute', limit: 5_000_000 });`,
    },
    {
      id: 'work',
      file: 'primos.worker.ts',
      note: 'Del otro lado, el worker escucha el mensaje, hace la cuenta en su hilo y contesta con otro postMessage.',
      code: `addEventListener('message', ({ data }) => {
  const count = contarPrimos(data.limit); // pesado, pero lejos de main
  postMessage({ type: 'result', count });
});`,
    },
  ],
  async run(pathId, { scene, narrate, own, music, threads, code }) {
    if (pathId === 'main') {
      // La música la lleva main: cuando se congela, se corta con él.
      music('main');
      code('main');
      narrate('Ya tengo las manos ocupadas… ¡y me cae el cálculo encima!');
      await scene.dropOnMain();
      const done = threads.work('main', 'contar primos');
      await settle();
      const t0 = performance.now();
      const count = countPrimesUpTo(PRIMES); // acá se congela todo
      const ms = Math.round(performance.now() - t0);
      done();
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
    code('create');
    await scene.handToWorker();
    narrate('El worker calcula en otro hilo y yo sigo con mis malabares. Tocame mientras tanto.');
    code('send');
    code('work');
    const t0 = performance.now();
    const primes = own(factory());
    const done = threads.work('worker', 'contar primos');
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
    done();
    if ('error' in result) {
      await scene.fumble();
      return { caption: worker(`Uy, fallé: ${result.error}.`), completed: false };
    }
    const ms = Math.round(performance.now() - t0);
    threads.blip('main', 'message');
    code('receive');
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
  code: [
    {
      id: 'interval',
      file: 'en-main.ts',
      note: 'setInterval no crea otro hilo: le pide al navegador que, cada 500 ms, ponga un tic en la fila de main.',
      code: `let tics = 0;
setInterval(() => mostrar(++tics), 500); // cada tic es una tarea de main`,
    },
    {
      id: 'block',
      file: 'en-main.ts',
      note: 'Si main está trabado, el tic vence pero no corre: espera en la fila hasta que main se suelte.',
      code: `bloquearMain(2500); // 2,5 s sin tics`,
    },
    {
      id: 'create',
      file: 'main.ts',
      note: 'El worker trae su propio reloj: corre en otro hilo y no depende de que main esté libre.',
      code: `const worker = new Worker(new URL('./reloj.worker.ts', import.meta.url), {
  type: 'module',
});`,
    },
    {
      id: 'listen',
      file: 'main.ts',
      note: 'Main solo recibe el aviso y lo muestra: una tarea cortita por tic.',
      code: `worker.onmessage = ({ data }) => mostrar(data);
worker.postMessage({ command: 'start', intervalMs: 500 });`,
    },
    {
      id: 'tick',
      file: 'reloj.worker.ts',
      note: 'Adentro del worker, el mismo setInterval, pero en su hilo. Cada tic se lo avisa a main con postMessage.',
      code: `addEventListener('message', ({ data }) => {
  if (data.command !== 'start') return;
  let tics = 0;
  setInterval(() => postMessage(++tics), data.intervalMs);
});`,
    },
  ],
  setup: ({ scene }) => {
    scene.board('tics', '0');
    return () => scene.board(null);
  },
  async run(pathId, { scene, ctl, narrate, threads, code }) {
    if (pathId === 'main') {
      scene.board('tics de main', '0');
      code('interval');
      narrate('Arranco mi setInterval… ¡y me cae un bucle de 2,5 s encima!');
      code('block');
      await scene.dropOnMain(FREEZE);
      // runMain congela a main después del próximo cuadro: la barra ya está.
      const done = threads.work('main', 'bucle síncrono · 2,5 s');
      ctl.runMain();
      await until(() => ctl.phase() !== 'main');
      done();
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
    code('create');
    await scene.workerEnter();
    code('tick');
    code('listen');
    ctl.runWorker();
    let shown = 0;
    await until(() => {
      const n = ctl.workerTicks();
      if (n > shown) {
        shown = n;
        // El tic pasa en el hilo del worker; a main le llega un mensaje.
        threads.blip('worker', 'tick', 'tic');
        threads.blip('main', 'message');
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
  code: [
    {
      id: 'listen',
      file: 'la-fila.ts',
      note: 'Cada clic es una tarea: el navegador la pone en la fila de main, y main corre este oyente cuando le toca.',
      code: `document.addEventListener('pointerdown', (e) => {
  atender(e);
});`,
    },
    {
      id: 'block',
      file: 'bloquear-main.ts',
      note: 'Un bucle síncrono es una sola tarea larga: mientras no termina, main no mira la fila.',
      code: `function bloquearMain(ms) {
  const fin = performance.now() + ms;
  while (performance.now() < fin) {} // main no suelta el hilo
}

bloquearMain(2500);`,
    },
    {
      id: 'late',
      file: 'la-fila.ts',
      note: 'Ningún clic se pierde: e.timeStamp es la hora del toque, así que la resta con ahora es lo que esperó en la fila.',
      code: `document.addEventListener('pointerdown', (e) => {
  const espera = performance.now() - e.timeStamp;
  console.log(\`clic atendido \${Math.round(espera)} ms tarde\`);
});`,
    },
    {
      id: 'chunk',
      file: 'trocear.ts',
      note: 'La salida: cortar el trabajo en pedazos para que la fila avance entre uno y otro. Si es pesado de verdad, va a un worker.',
      code: `async function procesar(items) {
  for (const [i, item] of items.entries()) {
    hacerAlgo(item);
    if (i % 500 === 0) await new Promise((r) => setTimeout(r)); // cede el turno
  }
}`,
    },
  ],
  setup: ({ scene, stage, code }) => {
    scene.board('clics en fila', '0');
    // El primer toque a la escena muestra cómo se escucha un clic.
    const firstTap = () => code('listen');
    stage.addEventListener('pointerdown', firstTap, { once: true });
    return () => {
      stage.removeEventListener('pointerdown', firstTap);
      scene.board(null);
    };
  },
  async run(_pathId, { scene, stage, narrate, threads, code }) {
    scene.board('clics en fila', '0');
    code('listen');
    code('block');
    narrate('¡Quedé atrapado en un bucle de 2,5 s! Tocá la escena ahora, varias veces.');
    await scene.dropOnMain(FREEZE);
    const done = threads.work('main', 'bucle síncrono · 2,5 s');
    await settle();

    // Los toques del congelamiento quedan en cola y se despachan apenas main se
    // suelta: todo lo que llega mientras estos oyentes están puestos esperó en la
    // fila. Se atrapan antes de que lleguen a la escena (si no, main los toma por
    // cosquillas). El atraso sale de `timeStamp` (la hora real del toque); si el
    // navegador no la da, se muestra solo que esperó.
    // `handled` es cuándo main atendió el toque de verdad: al soltarse.
    const queued: { x: number; y: number; late: number; handled: number }[] = [];
    let start = 0;
    const lateOf = (e: Event) => performance.now() - Math.max(e.timeStamp, start);
    const onTap = (e: PointerEvent) => {
      e.stopPropagation();
      queued.push({
        ...scene.toScene(e.clientX, e.clientY),
        late: lateOf(e),
        handled: performance.now(),
      });
    };
    const onKey = (e: KeyboardEvent) => {
      queued.push({
        x: 260 + queued.length * 40,
        y: 230,
        late: lateOf(e),
        handled: performance.now(),
      });
    };
    stage.addEventListener('pointerdown', onTap, true);
    addEventListener('keydown', onKey, true);
    start = performance.now();
    busyBlock(FREEZE_MS); // <- acá se congela todo
    done();
    await wait(80);
    stage.removeEventListener('pointerdown', onTap, true);
    removeEventListener('keydown', onKey, true);

    // Recién ahora main puede dibujar la fila: cada clic, en la hora en que llegó.
    // La escena lo repite despacio; el panel usa las horas reales.
    const shown = queued
      .slice(0, 12)
      .map((c) => ({ ...c, id: threads.enqueue('click', c.handled - c.late) }));
    const thawing = scene.thaw();
    let n = 0;
    await Promise.all(
      shown.map(async (c, i) => {
        await wait(i * 220);
        await scene.queuedClick(
          c.x,
          c.y,
          c.late >= LATE_MIN_MS ? `+${secs(c.late)} s` : '¡esperé!',
        );
        threads.take(c.id, 'clic', c.handled);
        await scene.boardValue(String(++n));
      }),
    );
    await thawing;
    if (queued.length) code('late');
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
  compositor: 'gira el ventilador · CSS',
  code: [
    {
      id: 'css',
      file: 'ventilador.css',
      note: 'Una animación CSS de transform no la mueve main: el navegador se la pasa al compositor, otro hilo.',
      code: `.ventilador {
  animation: girar 0.9s linear infinite;
}
@keyframes girar {
  to { transform: rotate(360deg); } /* transform y opacity: compositor */
}`,
    },
    {
      id: 'block',
      file: 'en-main.ts',
      note: 'El trabajo pesado en main lo traba entero: lo que dibuja main (el reloj, el pulso) se frena; el ventilador no.',
      code: `bloquearMain(2500);`,
    },
    {
      id: 'create',
      file: 'main.ts',
      note: 'El mismo trabajo, en un worker: main queda libre y todo sigue vivo.',
      code: `const worker = new Worker(new URL('./trabajo.worker.ts', import.meta.url), {
  type: 'module',
});
worker.onmessage = () => mostrar('¡listo!'); // main se entera al final
worker.postMessage({ command: 'bloquear', ms: 2500 });`,
    },
  ],
  setup: ({ scene, code }) => {
    const node = document.createElement('div');
    node.innerHTML =
      '<div class="lv-fan"><div class="lv-fan-blades"><i></i><i></i><i></i></div><b></b><span>CSS</span></div>';
    code('css');
    return scene.pin(node, 330, 150);
  },
  async run(pathId, { scene, ctl, narrate, threads, code }) {
    if (pathId === 'main') {
      code('block');
      narrate('Me trabo 2,5 s. Mirá el ventilador, el reloj, el pulso y los hilos.');
      await scene.dropOnMain(FREEZE);
      const done = threads.work('main', 'trabajo pesado · 2,5 s');
      ctl.blockMainComp();
      await until(() => ctl.compMode() === 'idle');
      done();
      await scene.thaw();
      return {
        caption: main(
          'Estuve congelado: el reloj y el pulso se frenaron, y la escena también. Pero el ventilador nunca paró: lo gira el compositor, no yo. Mirá su carril en los hilos: siguió andando.',
        ),
        completed: true,
      };
    }
    narrate('Me llevo el mismo trabajo a mi hilo…', 'worker');
    code('create');
    await scene.handToWorker(['mismo trabajo', '4 000 000']);
    const done = threads.work('worker', 'trabajo pesado');
    ctl.blockWorkerComp();
    await until(() => ctl.compMode() === 'idle');
    done();
    threads.blip('main', 'message');
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
