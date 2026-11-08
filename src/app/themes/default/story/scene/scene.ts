import gsap from 'gsap';
import { CONTENT, DOOR_X, EXT, MAIN_AT, SCENE_SVG, WORKER_AT } from './scene.art';
import { clamp, jugglePoint, MAX_STEP, seeded, spring, Spring, stepSprings } from './scene.physics';

/**
 * Escena de la historia: `main` (el hilo principal) hace malabares con lo que
 * atiende. Tres capas que no se pisan (ver la skill de animación vectorial):
 *  - vida: respiración, parpadeo, malabar, viento; se pausa fuera de pantalla;
 *  - toque: resortes que suman velocidad (tocar, arrastrar, soltar);
 *  - reacción: los gags guionados con GSAP (el cálculo cae, el worker ataja).
 *
 * La escena NO calcula nada: el componente corre el cálculo real (en el main o
 * en un worker) y le avisa. Cuando el cálculo va en el main, la escena se
 * congela de verdad porque vive en ese hilo: el monitor marca el plano rojo y el
 * reloj salta, igual que el pulso del theme.
 */
/**
 * Lo que pasa en la escena y se puede oír. La escena solo avisa; quien quiera
 * sonido (la pantalla de nivel) decide qué suena.
 */
export type SceneCue =
  | { kind: 'hit'; force: number }
  | { kind: 'poke'; who: Who; angry: boolean }
  | {
      kind:
        | 'twinkle'
        | 'lamp'
        | 'lift'
        | 'spill'
        | 'fall'
        | 'thaw'
        | 'door'
        | 'catch'
        | 'deliver'
        | 'fumble'
        | 'cheer';
    };

export interface Scene {
  /** El trabajo cae sobre main. Resuelve en el golpe, justo antes de calcular. */
  dropOnMain(label?: BlockLabel): Promise<void>;
  /** Después del congelamiento real: main se descongela y suelta todo. Resuelve al terminar. */
  thaw(): Promise<void>;
  /** El worker entra (si no estaba) y ataja el trabajo. Resuelve cuando lo tiene. */
  handToWorker(label?: BlockLabel): Promise<void>;
  /** El worker terminó: el trabajo se vuelve resultado y se lo pasa a main. */
  deliver(label: string): Promise<void>;
  /** El worker falló: suelta el bloque. */
  fumble(): Promise<void>;
  /** El worker entra por la puerta sin nada en las manos. */
  workerEnter(): Promise<void>;
  /** Muestra (o esconde, con null) el tablero de la pared con su título. */
  board(title: string | null, value?: string): void;
  /** Cambia el valor del tablero; con `from`, el dato sale volando de ese personaje. */
  boardValue(value: string, from?: Who): Promise<void>;
  /** Un clic que esperó en la fila: aparece donde se hizo (con su cartel) y vuela hasta main. */
  queuedClick(x: number, y: number, label: string): Promise<void>;
  /** Un globo sobre la cabeza del personaje. */
  say(who: Who, text: string, strong?: boolean): void;
  /** Festejo: saltan y vuelan chispas. */
  celebrate(): void;
  /** De coordenadas de pantalla a las de la escena (viewBox). */
  toScene(clientX: number, clientY: number): { x: number; y: number };
  /** De la escena a píxeles dentro del contenedor (para ubicar HTML sin escalarlo). */
  toScreen(x: number, y: number): { x: number; y: number };
  /** Avisa cada vez que cambia el encuadre (tamaño, `frame` o el viaje de la cámara). */
  onView(listener: () => void): void;
  /** Avisa de cada golpe, toque y momento de la escena (para el sonido). */
  onCue(listener: (cue: SceneCue) => void): void;
  /**
   * Avisa cada vez que main atrapa una pelota del malabar: cada pelota es algo
   * que main atiende (0 un clic, 1 el scroll, 2 una animación). Congelado, no
   * atrapa nada.
   */
  onJuggle(listener: (ball: JuggleBall) => void): void;
  /**
   * Fija un elemento HTML a un punto de la escena, escalado con ella. Sirve para
   * lo que tiene que moverse aunque main esté congelado (el compositor no anima
   * SVG). Devuelve la función que lo suelta.
   */
  pin(node: HTMLElement, x: number, y: number): () => void;
  /**
   * Encuadra la escena a pantalla completa: lo importante (`CONTENT`) entra
   * entero en el hueco que dejan arriba y abajo los textos y botones (en px), y
   * la sala sigue hasta los bordes. Se recalcula al cambiar el tamaño.
   */
  frame(insets: FrameInsets, pan?: boolean): void;
  destroy(): void;
}

export type Who = 'main' | 'worker';
/** Las pelotas del malabar, en orden: un clic, el scroll, una animación. */
export type JuggleBall = 0 | 1 | 2;
export interface FrameInsets {
  top: number;
  bottom: number;
  /** Lo que tapa el costado derecho (la hoja del código al final del nivel). */
  right?: number;
}
/** Las dos líneas del bloque que cae: chica arriba, grande abajo. */
export type BlockLabel = readonly [string, string];

const NS = 'http://www.w3.org/2000/svg';
const GRAVITY = 2400;
const BALL_R = 15;
const FLOOR_Y = MAIN_AT.y;
const ECG_N = 95;
const ECG_STEP_MS = 25;
const JUGGLE_RATE = 0.55; // vueltas por segundo
const HAND_Y = -60; // altura de las manos de main sobre sus pies
const BLOCK_ON_MAIN = MAIN_AT.y - 244;
const BLOCK_ON_WORKER = WORKER_AT.y - 186;
const BOARD = { x: 330, y: 150 };
const DEFAULT_BLOCK: BlockLabel = ['contar primos', '5 000 000'];

type Attrs = Record<string, string | number>;
const el = <K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
  attrs: Attrs = {},
): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent.appendChild(node);
  return node;
};

type BallMode = 'juggle' | 'fall' | 'rest' | 'return';
interface Ball {
  g: SVGGElement;
  offset: number;
  mode: BallMode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
  /** Para `return`: desde dónde y cuánto lleva. */
  fromX: number;
  fromY: number;
  p: number;
  delay: number;
}

const POKE_HEAD = ['¡ey!', '¡mi corona!', '¡boing!'];
const POKE_BODY = ['¡jiji!', '¡boing!', '¡cosquillas!'];
const POKE_ANGRY = ['¡estoy ocupado!', '¡de a uno!', '¡uff!'];
const POKE_WORKER = ['¡a la orden!', '¡boing!', '¡ups!'];

export function createScene(host: HTMLElement, calm: boolean): Scene {
  host.innerHTML = SCENE_SVG;
  const svg = host.querySelector('svg') as SVGSVGElement;
  const $ = <T extends Element = SVGGElement>(sel: string): T => svg.querySelector(sel) as T;
  const $$ = (sel: string): SVGElement[] => Array.from(svg.querySelectorAll<SVGElement>(sel));
  const cueListeners: ((cue: SceneCue) => void)[] = [];
  const cue = (c: SceneCue) => {
    for (const l of cueListeners) l(c);
  };
  const juggleListeners: ((ball: JuggleBall) => void)[] = [];
  const dur = (s: number) => (calm ? 0 : s);

  const main = {
    lift: $('.jh-main-lift'),
    rig: $('.jh-main-rig'),
    all: $('.jh-main-all'),
    body: $('.jh-main-body'),
    headSpring: $('.jh-main-headspring'),
    head: $('.jh-main-head'),
    armL: $('.jh-main-arm-l'),
    armR: $('.jh-main-arm-r'),
    crown: $('.jh-crown'),
    contact: $('.jh-main-contact'),
    lids: $$('.jh-main-head .jh-eye-lid'),
    pupils: $$('.jh-main-head .jh-pupil'),
    brows: $$('.jh-main-head .jh-brow'),
    mouth: $('.jh-main-head .jh-mouth'),
    mouthO: $('.jh-main-head .jh-mouth-o'),
    frost: $('.jh-frost'),
    stars: $('.jh-stars'),
  };
  const worker = {
    pose: $('.jh-worker-pose'),
    rig: $('.jh-worker-rig'),
    all: $('.jh-worker-all'),
    body: $('.jh-worker-body'),
    headSpring: $('.jh-worker-headspring'),
    armL: $('.jh-worker-arm-l'),
    armR: $('.jh-worker-arm-r'),
    hat: $('.jh-hat'),
    lids: $$('.jh-worker-pose .jh-eye-lid'),
    pupils: $$('.jh-worker-pose .jh-pupil'),
    brows: $$('.jh-worker-pose .jh-brow'),
    mouth: $('.jh-worker-pose .jh-mouth'),
  };
  const block = $('.jh-block');
  const orb = $('.jh-orb');
  const door = $('.jh-door');
  const lamp = $('.jh-lamp');
  const pool = $<SVGEllipseElement>('.jh-pool');
  const floorShape = $<SVGPathElement>('.jh-floor');
  const fx = $('.jh-fx');
  const fxFloor = $('.jh-fx-floor');
  const fxWall = $('.jh-fx-wall');
  const front = $('.jh-front');
  const ecgLive = $<SVGPathElement>('.jh-ecg-live');
  const ecgDead = $<SVGPathElement>('.jh-ecg-dead');
  const led = $('.jh-led');
  const secHand = $('.jh-sec');
  const minHand = $('.jh-min');
  const hourHand = $('.jh-hour');

  // ── Detalle por código (con semilla: sale igual en cada carga) ──
  const panels = $('.jh-panels');
  for (let x = 30 - Math.ceil(EXT / 92) * 92; x < 1200 + EXT; x += 92) {
    el(panels, 'rect', {
      class: 'jh-panel',
      x: x + seeded(x) * 6,
      y: 316,
      width: 64,
      height: 96,
      rx: 6,
    });
  }
  const planks = $('.jh-planks');
  // Las tablas se separan más hacia adelante (perspectiva) y siguen fuera del viewBox.
  [452, 478, 512, 552, 600, 660, 732].forEach((y, i) => {
    el(planks, 'path', {
      class: 'jh-plank',
      d: `M${-EXT} ${y}H${1200 + EXT}`,
      'stroke-opacity': Math.max(0.5 - i * 0.08, 0.1),
    });
    for (let k = 0; k < 15; k++) {
      const x = -600 + seeded(i * 31 + k) * 2400;
      el(planks, 'path', { class: 'jh-plank', d: `M${x} ${y}V${y + 22 + i * 8}` });
    }
  });
  const ticks = $('.jh-ticks');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 40 : 46;
    el(ticks, 'path', {
      class: 'jh-tick',
      d: `M${Math.sin(a) * r0} ${-Math.cos(a) * r0}L${Math.sin(a) * 51} ${-Math.cos(a) * 51}`,
    });
  }
  const grid = $('.jh-grid');
  for (let x = 656; x < 850; x += 24)
    el(grid, 'path', { class: 'jh-grid-line', d: `M${x} 86V184` });
  for (let y = 98; y < 184; y += 24)
    el(grid, 'path', { class: 'jh-grid-line', d: `M656 ${y}H844` });

  // Tablero de la pared (lo usan los niveles que cuentan algo). Entre el reloj y
  // la lámpara, para que el cono de luz no lo tape.
  const boardG = el($('.jh-back'), 'g', {
    class: 'jh-board',
    transform: `translate(${BOARD.x} ${BOARD.y})`,
  });
  el(boardG, 'path', { class: 'jh-trim-line', d: 'M0 -92V-58' });
  el(boardG, 'rect', { class: 'jh-bezel', x: -70, y: -58, width: 140, height: 104, rx: 14 });
  el(boardG, 'rect', { class: 'jh-screen', x: -60, y: -48, width: 120, height: 84, rx: 8 });
  const boardTitle = el(boardG, 'text', {
    class: 'jh-screen-label',
    y: -30,
    'text-anchor': 'middle',
  });
  const boardNum = el(boardG, 'text', { class: 'jh-board-value', y: 22, 'text-anchor': 'middle' });
  gsap.set(boardG, { autoAlpha: 0 });

  const blockSmall = $<SVGTextElement>('.jh-block-small');
  const blockBig = $<SVGTextElement>('.jh-block-big');
  const label = (l: BlockLabel = DEFAULT_BLOCK) => {
    blockSmall.textContent = l[0];
    blockBig.textContent = l[1];
  };

  // Planta en primer plano: hojas que enmarcan, más densas en los bordes.
  const plantL = el(front, 'g', { class: 'jh-plant' });
  const plantR = el(front, 'g', { class: 'jh-plant' });
  const leaf = (g: SVGGElement, baseX: number, i: number, dir: number) => {
    const h = 120 + seeded(i + 3) * 150;
    const lean = dir * (30 + seeded(i + 9) * 110);
    const x = baseX + (seeded(i + 17) - 0.5) * 50;
    const tipX = x + lean;
    const tipY = 572 - h;
    const w = 16 + seeded(i + 23) * 14;
    el(g, 'path', {
      class: i % 3 ? 'jh-leaf' : 'jh-leaf jh-leaf-light',
      d: `M${x} 572C${x - w} ${572 - h * 0.45} ${tipX - w * 0.4} ${tipY + 20} ${tipX} ${tipY}C${tipX + w * 0.3} ${tipY + 30} ${x + w} ${572 - h * 0.4} ${x} 572Z`,
    });
  };
  for (let i = 0; i < 9; i++) leaf(plantL, 40, i, i % 2 ? 1 : 0.6);
  for (let i = 0; i < 8; i++) leaf(plantR, 1170, i + 40, i % 2 ? -1 : -0.6);
  el(plantL, 'path', { class: 'jh-pot', d: 'M-10 560L100 560L88 486L2 486Z' });
  el(plantR, 'path', { class: 'jh-pot', d: 'M1110 560L1220 560L1216 494L1114 494Z' });

  // Pelotas del malabar: lo que main atiende (clic, scroll, animación).
  const glyphs = [
    'M-5 -8L-5 7L-1 3L2 9L5 7L2 1L7 1Z', // puntero
    'M-4 -7H4M-6 -2H6M-6 3H6M-4 8H4', // scroll
    'M-4 -7L7 0L-4 7Z', // animación
  ];
  const ballsLayer = $('.jh-balls');
  const balls: Ball[] = glyphs.map((d, i) => {
    const g = el(ballsLayer, 'g', { class: `jh-ball jh-ball-${i}` });
    el(g, 'circle', { class: 'jh-ball-fill', r: BALL_R });
    el(g, 'ellipse', { class: 'jh-ball-hi', cx: -5, cy: -6, rx: 6, ry: 4 });
    el(g, 'path', { class: i === 1 ? 'jh-ball-glyph jh-ball-glyph-line' : 'jh-ball-glyph', d });
    return {
      g,
      offset: i / 3,
      mode: 'juggle' as BallMode,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      spin: 0,
      angle: 0,
      fromX: 0,
      fromY: 0,
      p: 0,
      delay: 0,
    };
  });

  // Estrellitas de mareo.
  const starPath = 'M0 -9L2.6 -2.8L9 -2.8L3.8 1.2L5.6 8L0 4L-5.6 8L-3.8 1.2L-9 -2.8L-2.6 -2.8Z';
  const stars = [0, 1, 2].map(() => el(main.stars, 'path', { class: 'jh-star', d: starPath }));

  // ── Estado ──
  const r = {
    sq: spring(0, 260, 11),
    rot: spring(0, 130, 10),
    skew: spring(0, 200, 10),
    head: spring(0, 170, 9),
    armL: spring(0, 170, 12),
    armR: spring(0, 170, 12),
    crown: spring(0, 80, 5),
    x: spring(0, 60, 11),
    wsq: spring(0, 260, 11),
    wrot: spring(0, 130, 10),
    whead: spring(0, 170, 9),
    warmL: spring(0, 120, 12),
    warmR: spring(0, 120, 12),
    hat: spring(0, 90, 6),
    lamp: spring(0, 40, 1.6),
  };
  const springs: Spring[] = Object.values(r);

  let wind = 0.1;
  let windTarget = 0.1;
  let windDir = 1;
  let windUntil = 0;
  let heat = 0;
  let alto = 0;
  let vy = 0;
  let juggling = true;
  let jt = 0;
  let dizzy = 0;
  let workerIn = false;
  let workerBusy = false;
  let faceLocked = 0;
  let pointer: { x: number; y: number; at: number } | null = null;
  let lookAt: { x: number; y: number } | null = null;
  let workerLookAt: { x: number; y: number } | null = null;
  let reaction: gsap.core.Timeline | null = null;
  let workerTl: gsap.core.Timeline | null = null;
  let jitter: gsap.core.Tween | null = null;
  let sparkCall: gsap.core.Tween | null = null;
  let drag: { id: number; x0: number; y0: number; active: boolean } | null = null;
  let lastNow = performance.now();
  // Al cargar, los primeros cuadros tardan (se está armando la página): no es el
  // congelamiento que la escena quiere mostrar, así que no se marca en rojo.
  let ignoreGapsUntil = lastNow + 1200;
  let ecgAcc = 0;
  let beat = 0;
  const ecg: { y: number; dead: boolean }[] = Array.from({ length: ECG_N }, () => ({
    y: 150,
    dead: false,
  }));

  // Las animaciones sueltas no se guardan: al desmontar se matan todas las de la
  // escena de una vez (ver destroy). Así una escena que vive horas no acumula nada.
  const add = <T>(make: () => T): T => make();
  let blinkCall: gsap.core.Tween | null = null;
  let ledCall: gsap.core.Tween | null = null;

  gsap.set(worker.pose, { autoAlpha: 0 });
  // El origen (los pies del bloque) se fija UNA vez: volver a pasarle svgOrigin a
  // un elemento ya movido hace que GSAP lo "compense" y lo corra de lugar.
  gsap.set([block, orb], { autoAlpha: 0, svgOrigin: '0 0' });
  gsap.set(main.frost, { opacity: 0 });
  gsap.set(main.stars, { opacity: 0 });
  gsap.set([...main.lids, ...worker.lids], { transformOrigin: '50% 50%' });
  gsap.set([...main.brows, ...worker.brows], { transformOrigin: '50% 50%' });

  const mainX = () => MAIN_AT.x + r.x.x;
  const handsCenter = () => ({ x: mainX() + 2, y: FLOOR_Y + HAND_Y - alto });

  // ── Vida ──
  if (!calm) {
    add(() => [
      gsap.to(main.body, {
        scaleY: 1.022,
        scaleX: 0.99,
        svgOrigin: '0 0',
        duration: 1.1,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
      gsap.to(worker.body, {
        scaleY: 1.03,
        scaleX: 0.988,
        svgOrigin: '0 0',
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
    ]);
    const blink = () => {
      const lids = [...(faceLocked ? [] : main.lids), ...(workerBusy ? [] : worker.lids)];
      if (lids.length) {
        add(() =>
          gsap
            .timeline()
            .to(lids, { scaleY: 0.08, duration: 0.05, ease: 'power1.in' })
            .to(lids, { scaleY: 1, duration: 0.08, ease: 'power1.out' }, '+=0.04'),
        );
      }
      blinkCall = gsap.delayedCall(1.6 + seeded(performance.now()) * 3.4, blink);
    };
    blinkCall = gsap.delayedCall(1.2, blink);
  }

  // ── Partículas y textos (con tope de elementos) ──
  const trim = (layer: Element, max = 50) => {
    while (layer.childElementCount > max) layer.firstElementChild?.remove();
  };
  // Con `key`, un texto nuevo reemplaza al anterior del mismo personaje: así los
  // clics rápidos no apilan globos uno encima del otro.
  const lastPop = new Map<string, SVGTextElement>();
  const pop = (x: number, y: number, text: string, cls = '', key?: string) => {
    const t = el(fx, 'text', { class: `jh-pop ${cls}`, x, y, 'text-anchor': 'middle' });
    t.textContent = text;
    trim(fx);
    if (key) {
      const prev = lastPop.get(key);
      if (prev) {
        gsap.killTweensOf(prev);
        gsap.to(prev, { opacity: 0, duration: dur(0.08), onComplete: () => prev.remove() });
      }
      lastPop.set(key, t);
    }
    add(() =>
      gsap
        .timeline({ onComplete: () => t.remove() })
        .fromTo(
          t,
          { opacity: 0, y: calm ? 0 : 20, scale: 0.7, transformOrigin: '50% 50%' },
          { opacity: 1, y: 0, scale: 1, duration: dur(0.26), ease: 'back.out(2.2)' },
        )
        .to(t, { opacity: 0, y: calm ? 0 : -34, duration: dur(0.5), ease: 'power1.in' }, '+=0.7'),
    );
  };
  const dust = (x: number, y: number, n = 7, spread = 70) => {
    if (calm) return;
    for (let i = 0; i < n; i++) {
      const s = seeded(x + i * 7.3 + performance.now());
      const c = el(fxFloor, 'circle', { class: 'jh-dust', cx: x, cy: y - 6, r: 9 + s * 10 });
      add(() =>
        gsap.to(c, {
          attr: { cx: x + (i / (n - 1) - 0.5) * spread * 2, cy: y - 20 - s * 30, r: 2 },
          opacity: 0,
          duration: 0.6 + s * 0.4,
          ease: 'power2.out',
          onComplete: () => c.remove(),
        }),
      );
    }
    trim(fxFloor, 60);
  };
  const sparks = (x: number, y: number, layer = fxWall, n = 6) => {
    if (calm) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seeded(x + i) * 0.6;
      const s = el(layer, 'path', { class: 'jh-spark', d: starPath });
      add(() =>
        gsap.fromTo(
          s,
          { x, y, scale: 0.4, opacity: 1, transformOrigin: '50% 50%' },
          {
            x: x + Math.cos(a) * 46,
            y: y + Math.sin(a) * 46 + 10,
            scale: 0.9,
            rotation: 90,
            opacity: 0,
            duration: 0.55,
            ease: 'power2.out',
            onComplete: () => s.remove(),
          },
        ),
      );
    }
    trim(layer, 60);
  };
  const ripple = (x: number, y: number) => {
    if (calm) return;
    const e = el(fxFloor, 'ellipse', { class: 'jh-ring', cx: x, cy: y, rx: 6, ry: 2 });
    add(() =>
      gsap.to(e, {
        attr: { rx: 90, ry: 14 },
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => e.remove(),
      }),
    );
  };

  // ── Impacto: todo golpe pasa por acá ──
  const gust = (f: number, dir: number) => {
    windTarget = Math.max(windTarget, f);
    windDir = dir;
    windUntil = performance.now() + 650;
  };
  const impacto = (x: number, y: number, f: number) => {
    cue({ kind: 'hit', force: f });
    if (calm) return;
    const dx = mainX() - x;
    const d = Math.hypot(dx, FLOOR_Y - 120 - y);
    const near = clamp(1 - d / 900, 0.1, 1);
    const s = dx >= 0 ? 1 : -1;
    r.rot.v += s * f * near * 150;
    r.skew.v += -s * f * near * 50;
    r.sq.v = Math.min(r.sq.v + f * near * 3.5, 6.5);
    r.head.v += s * f * near * 120;
    if (workerIn) {
      const wdx = WORKER_AT.x - x;
      const wnear = clamp(1 - Math.hypot(wdx, FLOOR_Y - 90 - y) / 900, 0.1, 1);
      const ws = wdx >= 0 ? 1 : -1;
      r.wrot.v += ws * f * wnear * 150;
      r.wsq.v = Math.min(r.wsq.v + f * wnear * 3.5, 6.5);
      r.whead.v += ws * f * wnear * 120;
    }
    r.lamp.v += (x < 470 ? 1 : -1) * f * 14;
    gust(0.25 + f * 0.5, s);
  };

  // ── Malabar ──
  const juggleAt = (ball: Ball) => {
    const c = handsCenter();
    const p = jugglePoint(jt * JUGGLE_RATE + ball.offset, 95, 190);
    return { x: c.x + p.x, y: c.y + p.y };
  };
  const dropBalls = () => {
    if (!juggling) return;
    juggling = false;
    cue({ kind: 'spill' });
    balls.forEach((b, i) => {
      b.mode = 'fall';
      b.vx = (i - 1) * 140 + (seeded(i + performance.now()) - 0.5) * 120;
      b.vy = -260 - seeded(i * 3) * 200;
      b.spin = (seeded(i + 5) - 0.5) * 720;
      if (calm) {
        b.mode = 'rest';
        b.x = mainX() - 150 + i * 150;
        b.y = FLOOR_Y - BALL_R;
      }
    });
  };
  const pickUp = (delay = 0) => {
    balls.forEach((b, i) => {
      if (b.mode === 'juggle') return;
      b.mode = 'return';
      b.fromX = b.x;
      b.fromY = b.y;
      b.p = 0;
      b.delay = delay + i * 0.22;
    });
  };

  // ── Reposo: antes de cada reacción, todo a su pose ──
  const mouthNormal = () => {
    gsap.to(main.mouth, { opacity: 1, duration: dur(0.1), overwrite: 'auto' });
    gsap.to(main.mouthO, { attr: { ry: 0.1 }, duration: dur(0.12), overwrite: 'auto' });
  };
  const alReposo = () => {
    reaction?.kill();
    reaction = null;
    faceLocked = 0;
    dizzy = 0;
    lookAt = null;
    add(() => {
      gsap.to(main.rig, { x: 0, y: 0, duration: dur(0.2), overwrite: 'auto' });
      gsap.to(main.lids, { scaleY: 1, duration: dur(0.12), overwrite: 'auto' });
      gsap.to(main.brows, { rotation: 0, y: 0, duration: dur(0.2), overwrite: 'auto' });
      gsap.to(main.frost, { opacity: 0, duration: dur(0.2), overwrite: 'auto' });
      gsap.to(main.stars, { opacity: 0, duration: dur(0.2), overwrite: 'auto' });
      mouthNormal();
    });
  };

  // ── Toques ──
  const toSvg = (e: PointerEvent) =>
    new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());

  const pokeMain = (p: DOMPoint) => {
    const lx = p.x - mainX();
    const ly = p.y - (FLOOR_Y - alto);
    heat += 1;
    const side = clamp(lx / 110, -1, 1);
    if (!calm) {
      r.rot.v += side * 170 + (seeded(performance.now()) - 0.5) * 60;
      r.skew.v += side * -70;
      r.sq.v = Math.min(r.sq.v + (ly < -130 ? 5.5 : 4), 5.5);
      r.head.v += side * 260;
      r.crown.v += side * 320;
      sparks(p.x, p.y, fx, 4);
    }
    cue({ kind: 'poke', who: 'main', angry: heat >= 4 });
    const words = heat >= 4 ? POKE_ANGRY : ly < -130 ? POKE_HEAD : POKE_BODY;
    pop(p.x, p.y - 30, words[Math.floor(seeded(performance.now()) * words.length)], '', 'main');
    if (heat >= 4 && !faceLocked) {
      add(() =>
        gsap
          .timeline()
          .to(main.brows[0], { rotation: 18, y: 4, duration: dur(0.12), overwrite: 'auto' })
          .to(main.brows[1], { rotation: -18, y: 4, duration: dur(0.12), overwrite: 'auto' }, '<')
          .to(main.brows, { rotation: 0, y: 0, duration: dur(0.4) }, '+=1.1'),
      );
    }
    if (heat >= 7 && juggling) {
      heat = 2;
      dropBalls();
      pop(mainX(), FLOOR_Y - 290, '¡se me cae todo!', 'jh-pop-strong');
      pickUp(1.4);
    }
  };
  const pokeWorker = (p: DOMPoint) => {
    const lx = p.x - WORKER_AT.x;
    const side = clamp(lx / 80, -1, 1);
    cue({ kind: 'poke', who: 'worker', angry: false });
    if (!calm) {
      r.wrot.v += side * 170;
      r.wsq.v = Math.min(r.wsq.v + 5, 6.5);
      r.whead.v += side * 240;
      r.hat.v += side * 300;
      sparks(p.x, p.y, fx, 4);
    }
    pop(
      p.x,
      p.y - 26,
      POKE_WORKER[Math.floor(seeded(performance.now()) * POKE_WORKER.length)],
      '',
      'worker',
    );
  };

  const onDown = (e: PointerEvent) => {
    const p = toSvg(e);
    pointer = { x: p.x, y: p.y, at: performance.now() };
    const target = e.target as Element;
    if (target.closest('.jh-main-pose')) {
      pokeMain(p);
      if (!calm) {
        drag = { id: e.pointerId, x0: p.x, y0: p.y, active: false };
        svg.setPointerCapture(e.pointerId);
      }
      return;
    }
    if (target.closest('.jh-worker-pose')) {
      pokeWorker(p);
      return;
    }
    if (target.closest('.jh-lamp')) {
      r.lamp.v += (p.x < 470 ? 1 : -1) * 60;
      cue({ kind: 'lamp' });
      sparks(p.x, p.y, fx, 5);
      return;
    }
    if (floorShape.isPointInFill(new DOMPoint(p.x, p.y))) {
      dust(p.x, p.y + 10, 6, 50);
      ripple(p.x, p.y + 6);
      impacto(p.x, p.y, 0.45);
    } else {
      sparks(p.x, p.y);
      cue({ kind: 'twinkle' });
      impacto(p.x, p.y, 0.3);
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = toSvg(e);
    pointer = { x: p.x, y: p.y, at: performance.now() };
    if (!drag || drag.id !== e.pointerId) return;
    const dx = p.x - drag.x0;
    const dy = p.y - drag.y0;
    const d = Math.hypot(dx, dy);
    if (!drag.active && d > 24) {
      drag.active = true;
      cue({ kind: 'lift' });
      pop(mainX(), FLOOR_Y - 300, '¡eh, bajame!');
    }
    if (!drag.active) return;
    r.x.t = clamp(dx, -300, 300);
    r.rot.t = clamp(dx * 0.05, -24, 24);
    r.sq.t = -clamp(d / 1400, 0, 0.2);
    alto = clamp(-dy, 0, 200);
    vy = 0;
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.active) {
      r.x.t = 0;
      r.rot.t = 0;
      r.sq.t = 0;
      r.sq.v += 7;
    }
    drag = null;
  };
  const onLeave = () => {
    pointer = null;
  };
  // En el celular, arrastrar a main no tiene que mover la página (el resto sí).
  const mainPose = $('.jh-main-pose');
  const noScroll = (e: TouchEvent) => {
    if (!calm) e.preventDefault();
  };
  mainPose.addEventListener('touchstart', noScroll, { passive: false });
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  svg.addEventListener('pointerleave', onLeave);

  // ── Monitor y reloj (información: corren también sin movimiento) ──
  const ecgPath = (dead: boolean) => {
    let d = '';
    let open = false;
    for (let i = 0; i < ECG_N; i++) {
      const s = ecg[i];
      const x = 656 + i * 2;
      const mine = s.dead === dead || (i > 0 && ecg[i - 1].dead === dead);
      if (mine) {
        d += `${open ? 'L' : 'M'}${x} ${s.y.toFixed(1)}`;
        open = true;
      } else open = false;
    }
    return d;
  };
  const pushEcg = (gapMs: number) => {
    if (gapMs > 90 && performance.now() < ignoreGapsUntil) {
      ecgAcc = 0;
      return;
    }
    const froze = gapMs > 90;
    if (froze) {
      const n = Math.min(ECG_N, Math.round(gapMs / ECG_STEP_MS));
      for (let k = 0; k < n; k++) {
        ecg.push({ y: 140, dead: true });
        ecg.shift();
      }
      ecgAcc = 0;
      led.classList.add('is-dead');
      ledCall?.kill();
      ledCall = gsap.delayedCall(1.6, () => led.classList.remove('is-dead'));
      return;
    }
    ecgAcc += gapMs;
    while (ecgAcc >= ECG_STEP_MS) {
      ecgAcc -= ECG_STEP_MS;
      beat += ECG_STEP_MS;
      const ph = beat % 800;
      const y = ph < 25 ? 104 : ph < 50 ? 162 : ph < 75 ? 132 : 140 + (seeded(beat) - 0.5) * 2;
      ecg.push({ y, dead: false });
      ecg.shift();
    }
  };
  const clock = () => {
    const d = new Date();
    const s = d.getSeconds();
    const ms = d.getMilliseconds();
    const tickIn = calm ? 1 : Math.min(1, ms / 120);
    const sec = (s - 1 + tickIn) * 6;
    secHand.setAttribute('transform', `rotate(${sec})`);
    minHand.setAttribute('transform', `rotate(${(d.getMinutes() + s / 60) * 6})`);
    hourHand.setAttribute(
      'transform',
      `rotate(${((d.getHours() % 12) + d.getMinutes() / 60) * 30})`,
    );
  };

  // ── Cada cuadro ──
  const gaze = (
    pupils: SVGElement[],
    eyes: { x: number; y: number },
    target: { x: number; y: number } | null,
    limit: number,
  ) => {
    let ox = 0;
    let oy = 0;
    if (target) {
      const dx = target.x - eyes.x;
      const dy = target.y - eyes.y;
      const len = Math.hypot(dx, dy) || 1;
      const m = Math.min(limit, len / 30);
      ox = (dx / len) * m;
      oy = (dy / len) * m;
    }
    for (const p of pupils)
      p.setAttribute('transform', `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`);
  };

  const tick = () => {
    const now = performance.now();
    const gapMs = now - lastNow;
    lastNow = now;
    const dt = Math.min(gapMs / 1000, MAX_STEP);
    pushEcg(gapMs);
    ecgLive.setAttribute('d', ecgPath(false));
    ecgDead.setAttribute('d', ecgPath(true));
    clock();
    heat = Math.max(0, heat - dt * 0.45);

    if (!calm) {
      if (now > windUntil) windTarget = 0.1;
      wind += (windTarget - wind) * Math.min(1, dt * (windTarget > wind ? 6 : 1.1));
      const t = now / 1000;
      const a = Math.sin(t * (1.4 + wind * 7)) * (0.7 + wind * 2.4) + (wind - 0.1) * windDir * 5;
      front.setAttribute(
        'transform',
        `translate(600 572) skewX(${(-a).toFixed(2)}) translate(-600 -572)`,
      );
      r.lamp.t = (wind - 0.1) * windDir * 4;

      // Los accesorios siguen la velocidad del cuerpo, no su posición.
      r.crown.t = clamp(-r.rot.v * 0.14 - r.sq.v * 2, -40, 40);
      r.head.t = clamp(-r.rot.x * 0.35, -14, 14);
      r.hat.t = clamp(-r.wrot.v * 0.14 - r.wsq.v * 2, -36, 36);
      r.whead.t = clamp(-r.wrot.x * 0.35, -14, 14);
      if (juggling && !faceLocked) {
        const bob = Math.sin(jt * JUGGLE_RATE * Math.PI * 6);
        r.armL.t = bob * 10;
        r.armR.t = -bob * 10;
      } else if (!faceLocked) {
        r.armL.t = 0;
        r.armR.t = 0;
      }

      // Arrastre y vuelo.
      if (!drag?.active && alto > 0) {
        vy -= GRAVITY * dt;
        alto += vy * dt;
        r.sq.t = -clamp(Math.abs(vy) / 9000, 0, 0.12);
        if (alto <= 0) {
          const hit = Math.abs(vy);
          alto = 0;
          vy = 0;
          r.sq.t = 0;
          r.sq.v += Math.min(9, hit / 115);
          if (hit > 260) {
            impacto(mainX(), FLOOR_Y, 0.8);
            dust(mainX(), FLOOR_Y, 9, 90);
          }
          if (hit > 700 && juggling) {
            dropBalls();
            pop(mainX(), FLOOR_Y - 290, '¡mis tareas!', 'jh-pop-strong');
            pickUp(1.2);
          }
        }
      }
      stepSprings(springs, dt);
    }

    // Escribir transformaciones.
    const sq = clamp(r.sq.x, -0.24, 0.24);
    main.lift.setAttribute('transform', `translate(${r.x.x.toFixed(2)} ${(-alto).toFixed(2)})`);
    main.all.setAttribute(
      'transform',
      `rotate(${r.rot.x.toFixed(2)}) skewX(${r.skew.x.toFixed(2)}) scale(${(1 + sq * 0.82).toFixed(4)} ${(1 - sq).toFixed(4)})`,
    );
    main.headSpring.setAttribute('transform', `rotate(${r.head.x.toFixed(2)} 0 50)`);
    main.armL.setAttribute('transform', `rotate(${r.armL.x.toFixed(2)})`);
    main.armR.setAttribute('transform', `rotate(${r.armR.x.toFixed(2)})`);
    main.crown.setAttribute('transform', `rotate(${r.crown.x.toFixed(2)} 0 4)`);
    const shadow = clamp(1 - alto / 320, 0.4, 1);
    main.contact.setAttribute(
      'transform',
      `translate(${r.x.x.toFixed(2)} 0) scale(${(shadow * (1 + sq * 0.6)).toFixed(3)} ${shadow.toFixed(3)})`,
    );
    const wsq = clamp(r.wsq.x, -0.3, 0.3);
    worker.all.setAttribute(
      'transform',
      `rotate(${r.wrot.x.toFixed(2)}) scale(${(1 + wsq * 0.82).toFixed(4)} ${(1 - wsq).toFixed(4)})`,
    );
    worker.headSpring.setAttribute('transform', `rotate(${r.whead.x.toFixed(2)} 0 40)`);
    worker.armL.setAttribute('transform', `rotate(${r.warmL.x.toFixed(2)})`);
    worker.armR.setAttribute('transform', `rotate(${r.warmR.x.toFixed(2)})`);
    worker.hat.setAttribute('transform', `rotate(${r.hat.x.toFixed(2)} 0 8)`);
    lamp.setAttribute('transform', `rotate(${r.lamp.x.toFixed(2)} 470 0)`);
    pool.setAttribute('cx', (470 + Math.sin((r.lamp.x * Math.PI) / 180) * 492).toFixed(1));

    // Mirada: hacia lo que pasa o hacia el puntero.
    const recent = pointer && now - pointer.at < 2500 ? pointer : null;
    const mainEyes = { x: mainX() + 14, y: FLOOR_Y - 140 - alto };
    gaze(
      main.pupils,
      mainEyes,
      lookAt ?? recent ?? (workerBusy ? { x: WORKER_AT.x, y: 300 } : null),
      7,
    );
    gaze(worker.pupils, { x: WORKER_AT.x + 10, y: FLOOR_Y - 96 }, workerLookAt ?? recent, 5);

    // Pelotas.
    const jtBefore = jt;
    if (juggling && !calm) jt += dt;
    for (const [i, b] of balls.entries()) {
      if (b.mode === 'juggle') {
        // La pelota llega a la mano cuando su vuelta pasa por la mitad.
        const lap = (t: number) => Math.floor(t * JUGGLE_RATE + b.offset - 0.5);
        if (juggling && lap(jt) > lap(jtBefore)) {
          for (const l of juggleListeners) l(i as JuggleBall);
        }
        const p = juggleAt(b);
        b.x = p.x;
        b.y = p.y;
      } else if (b.mode === 'fall') {
        b.vy += GRAVITY * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += b.spin * dt;
        if (b.y > FLOOR_Y - BALL_R) {
          b.y = FLOOR_Y - BALL_R;
          b.vy *= -0.45;
          b.vx *= 0.7;
          b.spin *= 0.6;
          if (Math.abs(b.vy) < 60) {
            b.vy = 0;
            b.mode = 'rest';
          }
        }
        b.x = clamp(b.x, 300, 900);
      } else if (b.mode === 'return') {
        b.delay -= dt;
        if (b.delay <= 0 || calm) {
          b.p = calm ? 1 : Math.min(1, b.p + dt / 0.45);
          const target = juggleAt(b);
          const e = 1 - (1 - b.p) * (1 - b.p);
          b.x = b.fromX + (target.x - b.fromX) * e;
          b.y = b.fromY + (target.y - b.fromY) * e - Math.sin(b.p * Math.PI) * 90;
          if (b.p >= 1) {
            b.mode = 'juggle';
            b.angle = 0;
          }
        }
      }
      b.g.setAttribute(
        'transform',
        `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.angle.toFixed(1)})`,
      );
    }
    if (!juggling && balls.every((b) => b.mode === 'juggle')) juggling = true;

    // Estrellitas de mareo.
    if (dizzy > 0) {
      dizzy -= dt;
      const t = now / 1000;
      stars.forEach((s, i) => {
        const a = t * 5 + (i / 3) * Math.PI * 2;
        s.setAttribute(
          'transform',
          `translate(${(Math.cos(a) * 60 + 12).toFixed(1)} ${(-226 + Math.sin(a) * 14).toFixed(1)})`,
        );
      });
    }
  };

  // Primer cuadro ya ubicado, después el ticker. Fuera de pantalla, la vida se pausa.
  tick();
  let running = false;
  const start = () => {
    if (running) return;
    running = true;
    lastNow = performance.now();
    gsap.ticker.add(tick);
    gsap.globalTimeline.resume();
  };
  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
    gsap.globalTimeline.pause();
  };
  // Pestaña oculta: el navegador frena los cuadros, pero eso no es main congelado.
  const onVisibility = () => {
    lastNow = performance.now();
    ignoreGapsUntil = lastNow + 300;
  };
  document.addEventListener('visibilitychange', onVisibility);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) start();
      else stop();
    }
  });
  io.observe(host);
  start();

  // ── Reacciones ──
  const dropOnMain = (l?: BlockLabel): Promise<void> =>
    new Promise((resolve) => {
      label(l);
      alReposo();
      workerTl?.kill();
      const x = mainX();
      faceLocked = 1;
      lookAt = { x, y: 0 };
      const shadow = el(fxFloor, 'ellipse', {
        class: 'jh-incoming',
        cx: x,
        cy: FLOOR_Y,
        rx: 20,
        ry: 5,
      });
      add(() => {
        reaction = gsap
          .timeline({
            onComplete: () => {
              shadow.remove();
              resolve();
            },
          })
          .set(block, {
            autoAlpha: 1,
            x,
            y: calm ? BLOCK_ON_MAIN : -6,
            rotation: -4,
            scale: 1,
          })
          .call(() => cue({ kind: 'fall' }), [], 0)
          .to(main.brows, { y: -6, duration: dur(0.15), ease: 'back.out(2)' }, 0)
          .to(main.mouthO, { attr: { ry: 10 }, duration: dur(0.12) }, 0)
          .to(main.mouth, { opacity: 0, duration: dur(0.08) }, 0)
          .to(
            shadow,
            { attr: { rx: 110, ry: 16 }, opacity: 0.5, duration: dur(0.36), ease: 'power2.in' },
            0,
          )
          .to(
            block,
            { y: BLOCK_ON_MAIN, rotation: 2, duration: dur(0.34), ease: 'power2.in' },
            dur(0.12),
          )
          .call(() => {
            if (!calm) {
              r.sq.v += 6;
              r.crown.v += 420;
              r.head.v += 120;
            }
            dust(x, FLOOR_Y, 9, 110);
            impacto(x, BLOCK_ON_MAIN, 0.6);
            pop(x + 130, BLOCK_ON_MAIN - 60, '¡PUM!', 'jh-pop-strong');
          })
          .to(main.lids, { scaleY: 0.35, duration: dur(0.05) }, '<')
          .to(block, { scaleY: 0.9, scaleX: 1.06, duration: dur(0.06), ease: 'power2.out' }, '<')
          .to(block, { scaleY: 1, scaleX: 1, duration: dur(0.12), ease: 'power2.out' })
          // Un respiro para que el aplastón se vea antes de congelarse en el lugar.
          .to({}, { duration: dur(0.08) });
      });
    });

  const thaw = (): Promise<void> =>
    new Promise((done) => {
      const x = mainX();
      add(() => {
        reaction = gsap
          .timeline({
            onComplete: () => {
              faceLocked = 0;
              lookAt = null;
              done();
            },
          })
          .set(main.frost, { opacity: 0.75 })
          .call(() => {
            cue({ kind: 'thaw' });
            pop(x, FLOOR_Y - 300, '¡brrr!', 'jh-pop-strong');
            dropBalls();
            dizzy = calm ? 0 : 1.8;
          })
          .to(main.rig, {
            x: 6,
            duration: dur(0.04),
            repeat: calm ? 0 : 7,
            yoyo: true,
            ease: 'sine.inOut',
          })
          .to(main.rig, { x: 0, duration: dur(0.04) })
          .to(main.frost, { opacity: 0, duration: dur(0.45), ease: 'power1.in' }, dur(0.1))
          .call(() => shards(x), [], dur(0.1))
          // El cálculo se resbala de la cabeza y se rompe en el piso.
          .to(
            block,
            { x: x + 170, y: FLOOR_Y + 4, rotation: 84, duration: dur(0.42), ease: 'power2.in' },
            dur(0.18),
          )
          .call(() => {
            dust(x + 170, FLOOR_Y, 8, 80);
            impacto(x + 170, FLOOR_Y, 0.5);
          })
          .to(block, { y: FLOOR_Y - 10, duration: dur(0.09), ease: 'power2.out' })
          .to(block, { y: FLOOR_Y + 4, duration: dur(0.11), ease: 'power2.in' })
          .to(main.stars, { opacity: calm ? 0 : 1, duration: dur(0.15) }, dur(0.2))
          .to(main.lids, { scaleY: 0.3, duration: dur(0.1) }, dur(0.2))
          .to(block, { autoAlpha: 0, scale: 0.6, duration: dur(0.4), ease: 'power2.in' }, '+=0.5')
          .to(main.stars, { opacity: 0, duration: dur(0.2) }, '+=0.5')
          .to(main.lids, { scaleY: 1, duration: dur(0.12) }, '<')
          .to(main.brows, { y: 0, rotation: 0, duration: dur(0.2) }, '<')
          .call(() => {
            mouthNormal();
            pickUp();
          });
      });
    });

  const shards = (x: number) => {
    if (calm) return;
    for (let i = 0; i < 8; i++) {
      const s = el(fx, 'path', { class: 'jh-shard', d: 'M0 -8L5 0L0 8L-4 0Z' });
      const sx = x + (seeded(i + 2) - 0.5) * 160;
      const sy = FLOOR_Y - 60 - seeded(i + 9) * 140;
      add(() =>
        gsap.fromTo(
          s,
          { x: sx, y: sy, rotation: 0, opacity: 1 },
          {
            x: sx + (seeded(i + 4) - 0.5) * 120,
            y: FLOOR_Y - 4,
            rotation: 200,
            duration: 0.5 + seeded(i) * 0.3,
            ease: 'power2.in',
            onComplete: () => {
              gsap.to(s, { opacity: 0, duration: 0.3, onComplete: () => s.remove() });
            },
          },
        ),
      );
    }
  };

  /** La entrada por la puerta, dos saltos hasta su lugar. No-op si ya está. */
  let entering: gsap.core.Timeline | null = null;
  const enterDoor = (tl: gsap.core.Timeline) => {
    if (workerIn) return;
    workerIn = true;
    const doorDx = DOOR_X - WORKER_AT.x;
    tl.call(() => cue({ kind: 'door' }))
      .to(door, {
        scaleX: 0.12,
        svgOrigin: '1014 194',
        duration: dur(0.25),
        ease: 'power2.out',
      })
      .set(worker.rig, { x: doorDx, y: -58, scale: 0.78, svgOrigin: '0 0' })
      .to(worker.pose, { autoAlpha: 1, duration: dur(0.15) })
      .call(() => pop(DOOR_X, 170, '¡voy!'));
    // Dos saltos hasta su lugar, bajando del umbral al piso.
    tl.to(worker.rig, { x: doorDx * 0.5, y: -110, duration: dur(0.17), ease: 'power2.out' })
      .to(worker.rig, {
        y: -30,
        scale: 0.9,
        svgOrigin: '0 0',
        duration: dur(0.17),
        ease: 'power2.in',
      })
      .call(() => {
        if (!calm) r.wsq.v += 5;
      })
      .to(worker.rig, { x: doorDx * 0.15, y: -80, duration: dur(0.16), ease: 'power2.out' })
      .to(worker.rig, {
        x: 0,
        y: 0,
        scale: 1,
        svgOrigin: '0 0',
        duration: dur(0.17),
        ease: 'power2.in',
      })
      .call(() => {
        if (!calm) r.wsq.v += 6;
        dust(WORKER_AT.x, FLOOR_Y, 7, 70);
        impacto(WORKER_AT.x, FLOOR_Y, 0.4);
      })
      .to(
        door,
        { scaleX: 1, svgOrigin: '1014 194', duration: dur(0.3), ease: 'back.out(1.6)' },
        '+=0.05',
      );
  };

  const handToWorker = (l?: BlockLabel): Promise<void> =>
    new Promise((resolve) => {
      label(l);
      // Si todavía estaba entrando, termina de entrar de una.
      entering?.progress(1);
      workerTl?.kill();
      reaction?.kill();
      reaction = null;
      workerBusy = true;
      const tl = add(() => gsap.timeline({ onComplete: resolve }));
      workerTl = tl;
      enterDoor(tl);
      // Levanta los brazos y ataja el cálculo.
      tl.call(() => {
        r.warmL.t = calm ? 0 : 160;
        r.warmR.t = calm ? 0 : -160;
        if (calm) {
          r.warmL.x = 160;
          r.warmR.x = -160;
        }
        workerLookAt = { x: WORKER_AT.x, y: 0 };
      })
        .set(block, {
          autoAlpha: 1,
          x: WORKER_AT.x,
          y: calm ? BLOCK_ON_WORKER : -6,
          rotation: 3,
          scale: 1,
        })
        .to(worker.brows, { y: -5, duration: dur(0.12) })
        .to(
          block,
          { y: BLOCK_ON_WORKER, rotation: 0, duration: dur(0.32), ease: 'power2.in' },
          '+=0.08',
        )
        .call(() => {
          if (!calm) {
            r.wsq.v += 5;
            r.hat.v += 200;
          }
          impacto(WORKER_AT.x, BLOCK_ON_WORKER, 0.35);
          cue({ kind: 'catch' });
          pop(WORKER_AT.x - 150, BLOCK_ON_WORKER + 40, '¡lo tengo!'); // hacia el centro: en el celular se ve
          workerLookAt = null;
        })
        .to(block, { scaleY: 0.92, scaleX: 1.05, duration: dur(0.06) }, '<')
        .to(block, { scaleY: 1, scaleX: 1, duration: dur(0.14), ease: 'back.out(2)' })
        .to(worker.brows[0], { rotation: 16, y: 3, duration: dur(0.12) })
        .to(worker.brows[1], { rotation: -16, y: 3, duration: dur(0.12) }, '<')
        .call(() => {
          if (calm) return;
          // Mientras calcula: el bloque tiembla y suelta chispas, y main sigue jugando.
          jitter = gsap.to(block, {
            x: WORKER_AT.x + 3,
            duration: 0.05,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          });
          const spark = () => {
            sparks(
              WORKER_AT.x + (seeded(performance.now()) - 0.5) * 120,
              BLOCK_ON_WORKER - 70,
              fx,
              3,
            );
            sparkCall = gsap.delayedCall(0.18, spark);
          };
          spark();
        });
    });

  const stopWork = () => {
    jitter?.kill();
    sparkCall?.kill();
    jitter = null;
    sparkCall = null;
  };
  const armsDown = () => {
    r.warmL.t = 0;
    r.warmR.t = 0;
    if (calm) {
      r.warmL.x = 0;
      r.warmR.x = 0;
    }
  };

  const deliver = (label: string): Promise<void> =>
    new Promise((done) => {
      stopWork();
      workerTl?.kill();
      const hc = handsCenter();
      const startY = BLOCK_ON_WORKER - 56;
      add(() => {
        workerTl = gsap
          .timeline({
            onComplete: () => {
              workerBusy = false;
              done();
            },
          })
          .to(block, {
            x: WORKER_AT.x,
            scale: 0,
            autoAlpha: 0,
            duration: dur(0.22),
            ease: 'back.in(2)',
          })
          .set(orb, { autoAlpha: 1, x: WORKER_AT.x, y: startY, scale: 0.2 }, '<0.1')
          .to(orb, { scale: 1, duration: dur(0.22), ease: 'back.out(2.4)' })
          .call(() => {
            // Por debajo del monitor, para no tapar el pulso.
            cue({ kind: 'deliver' });
            pop(WORKER_AT.x + 30, startY + 16, label, 'jh-pop-strong');
            sparks(WORKER_AT.x, startY, fx, 8);
          })
          .to(worker.brows, { rotation: 0, y: 0, duration: dur(0.2) }, '<')
          .call(armsDown, [], '+=0.35')
          .to(orb, { x: hc.x, duration: dur(0.6), ease: 'none' }, '<')
          .to(orb, { y: hc.y - 210, duration: dur(0.3), ease: 'power2.out' }, '<')
          .to(orb, { y: hc.y - 40, duration: dur(0.3), ease: 'power2.in' }, '>')
          .call(() => {
            if (!calm) {
              r.sq.v += 3;
              r.crown.v += 160;
            }
            pop(hc.x - 120, hc.y - 170, '¡gracias!');
            sparks(hc.x, hc.y - 40, fx, 6);
          })
          .to(orb, { scale: 0, autoAlpha: 0, duration: dur(0.25), ease: 'power2.in' })
          .call(() => {
            if (!calm) r.wsq.v += 4;
          });
      });
    });

  const fumble = (): Promise<void> =>
    new Promise((done) => {
      stopWork();
      workerTl?.kill();
      add(() => {
        workerTl = gsap
          .timeline({
            onComplete: () => {
              workerBusy = false;
              done();
            },
          })
          .call(armsDown)
          .call(() => cue({ kind: 'fumble' }))
          .to(block, {
            x: WORKER_AT.x + 120,
            y: FLOOR_Y + 4,
            rotation: 70,
            duration: dur(0.4),
            ease: 'power2.in',
          })
          .call(() => {
            dust(WORKER_AT.x + 120, FLOOR_Y, 8, 80);
            impacto(WORKER_AT.x + 120, FLOOR_Y, 0.5);
            pop(WORKER_AT.x, FLOOR_Y - 220, '¡uy!');
          })
          .to(worker.brows, { rotation: 0, y: 0, duration: dur(0.2) })
          .to(block, { autoAlpha: 0, duration: dur(0.4) }, '+=0.6');
      });
    });

  const workerEnter = (): Promise<void> =>
    new Promise((resolve) => {
      if (workerIn) return resolve();
      const tl = add(() =>
        gsap.timeline({
          onComplete: () => {
            entering = null;
            resolve();
          },
        }),
      );
      entering = tl;
      enterDoor(tl);
    });

  // ── Tablero ──
  const board = (title: string | null, value = '') => {
    boardTitle.textContent = title ?? '';
    boardNum.textContent = value;
    gsap.to(boardG, { autoAlpha: title === null ? 0 : 1, duration: dur(0.2), overwrite: 'auto' });
  };
  const bumpBoard = (value: string) => {
    boardNum.textContent = value;
    if (calm) return;
    gsap.fromTo(
      boardNum,
      { scale: 1.5, transformOrigin: '50% 60%' },
      { scale: 1, duration: 0.3, ease: 'back.out(2.4)', overwrite: 'auto' },
    );
    sparks(BOARD.x, BOARD.y, fxWall, 5);
  };
  const boardValue = (value: string, from?: Who): Promise<void> =>
    new Promise((done) => {
      if (!from || calm) {
        bumpBoard(value);
        return done();
      }
      // El dato sale de las manos de quien lo produjo y vuela hasta el tablero.
      const src =
        from === 'worker'
          ? { x: WORKER_AT.x - 40, y: FLOOR_Y - 120 }
          : { x: handsCenter().x, y: handsCenter().y - 40 };
      if (from === 'worker') r.warmL.v += 420;
      else r.armL.v += 300;
      const dot = el(fx, 'circle', { class: 'jh-tic', r: 11 });
      add(() =>
        gsap
          .timeline({
            onComplete: () => {
              dot.remove();
              bumpBoard(value);
              done();
            },
          })
          .fromTo(dot, { x: src.x, y: src.y }, { x: BOARD.x, duration: 0.42, ease: 'none' })
          .to(dot, { y: src.y - 200, duration: 0.2, ease: 'power2.out' }, 0)
          .to(dot, { y: BOARD.y, duration: 0.22, ease: 'power2.in' }, 0.2),
      );
    });

  // ── Clics que esperaron en la fila ──
  const queuedClick = (x: number, y: number, label: string): Promise<void> =>
    new Promise((done) => {
      const g = el(fx, 'g', { class: 'jh-queued' });
      el(g, 'circle', { class: 'jh-queued-fill', r: 17 });
      el(g, 'path', { class: 'jh-ball-glyph', d: glyphs[0] });
      pop(x, y - 34, label, '', `late-${Math.round(x)}-${Math.round(y)}`);
      const hc = handsCenter();
      add(() =>
        gsap
          .timeline({
            onComplete: () => {
              g.remove();
              if (!calm) {
                r.sq.v += 2.5;
                r.head.v += (x < hc.x ? 1 : -1) * 90;
              }
              sparks(hc.x, hc.y - 30, fx, 4);
              done();
            },
          })
          .fromTo(
            g,
            { x, y, scale: 0.3, transformOrigin: '50% 50%' },
            { scale: 1, duration: dur(0.22), ease: 'back.out(2.4)' },
          )
          .to(g, { x: hc.x, duration: dur(0.5), ease: 'power1.inOut' }, '+=0.25')
          .to(g, { y: Math.min(y, hc.y) - 120, duration: dur(0.22), ease: 'power2.out' }, '<')
          .to(g, { y: hc.y - 30, scale: 0.6, duration: dur(0.28), ease: 'power2.in' }, '>'),
      );
    });

  const say = (who: Who, text: string, strong = false) => {
    const x = who === 'main' ? mainX() : WORKER_AT.x;
    const y = who === 'main' ? FLOOR_Y - 300 - alto : FLOOR_Y - 230;
    pop(x, y, text, strong ? 'jh-pop-strong' : '', who);
  };

  const celebrate = () => {
    cue({ kind: 'cheer' });
    if (calm) {
      say('main', '¡bien!', true);
      return;
    }
    vy = 760;
    alto = Math.max(alto, 1);
    r.crown.v += 500;
    say('main', '¡bien!', true);
    sparks(mainX(), FLOOR_Y - 260, fx, 10);
    if (workerIn) {
      r.wsq.v += 6;
      r.hat.v += 400;
      sparks(WORKER_AT.x, FLOOR_Y - 200, fx, 8);
    }
  };

  const toScene = (clientX: number, clientY: number) => {
    const p = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  // Elementos HTML fijados a un punto de la escena (se recolocan al cambiar el tamaño).
  const pins = new Map<HTMLElement, { x: number; y: number }>();
  const placePins = () => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const box = host.getBoundingClientRect();
    for (const [node, at] of pins) {
      const p = new DOMPoint(at.x, at.y).matrixTransform(ctm);
      node.style.transform = `translate(${(p.x - box.left).toFixed(1)}px, ${(p.y - box.top).toFixed(1)}px) scale(${ctm.a.toFixed(4)})`;
    }
  };
  let insets: FrameInsets | null = null;
  let camera: gsap.core.Tween | undefined;
  const viewListeners: (() => void)[] = [];
  const viewChanged = () => {
    placePins();
    for (const l of viewListeners) l();
  };
  const toScreen = (x: number, y: number) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const box = host.getBoundingClientRect();
    const p = new DOMPoint(x, y).matrixTransform(ctm);
    return { x: p.x - box.left, y: p.y - box.top };
  };
  const fit = (pan = false) => {
    if (!insets) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    const wide = Math.max(w - (insets.right ?? 0), w * 0.4);
    const room = Math.max(h - insets.top - insets.bottom, h * 0.2);
    const k = Math.min(wide / CONTENT.w, room / CONTENT.h);
    // Centrado en el ancho libre; a lo alto, con los pies cerca de lo de abajo:
    // si sobra lugar (pantallas altas y angostas) casi todo queda arriba, como
    // pared, y un poco de piso separa a main de su diálogo.
    const left = (wide - CONTENT.w * k) / 2;
    const top = insets.top + (room - CONTENT.h * k) * 0.75;
    const viewBox = [CONTENT.x - left / k, CONTENT.y - top / k, w / k, h / k]
      .map((n) => n.toFixed(2))
      .join(' ');
    camera?.kill();
    if (!pan || calm) {
      svg.setAttribute('viewBox', viewBox);
      viewChanged();
      return;
    }
    // La cámara viaja (no salta): los pins la siguen cuadro a cuadro.
    camera = gsap.to(svg, {
      attr: { viewBox },
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: viewChanged,
    });
  };
  const resize = new ResizeObserver(() => {
    fit();
    viewChanged();
  });
  resize.observe(host);
  const pin = (node: HTMLElement, x: number, y: number) => {
    node.classList.add('jh-pin');
    host.appendChild(node);
    pins.set(node, { x, y });
    placePins();
    return () => {
      pins.delete(node);
      node.remove();
    };
  };

  return {
    dropOnMain,
    thaw,
    handToWorker,
    deliver,
    fumble,
    workerEnter,
    board,
    boardValue,
    queuedClick,
    say,
    celebrate,
    toScene,
    toScreen,
    onView: (listener) => viewListeners.push(listener),
    onCue: (listener) => cueListeners.push(listener),
    onJuggle: (listener) => juggleListeners.push(listener),
    pin,
    frame: (next, pan) => {
      insets = next;
      fit(pan);
      placePins();
    },
    destroy: () => {
      stop();
      resize.disconnect();
      camera?.kill();
      viewListeners.length = 0;
      cueListeners.length = 0;
      juggleListeners.length = 0;
      pins.clear();
      gsap.globalTimeline.resume();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerup', onUp);
      svg.removeEventListener('pointercancel', onUp);
      svg.removeEventListener('pointerleave', onLeave);
      mainPose.removeEventListener('touchstart', noScroll);
      stopWork();
      for (const t of [blinkCall, ledCall, reaction, workerTl, entering]) t?.kill();
      gsap.killTweensOf(Array.from(svg.querySelectorAll('*')));
      host.innerHTML = '';
    },
  };
}
