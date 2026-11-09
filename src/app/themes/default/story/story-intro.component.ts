import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ThemeService } from '../../../theming/theme.service';
import { MAIN_BODY } from './scene/scene.art';
import { spring, stepSprings } from './scene/scene.physics';
import { StoryProgress } from './story-progress.service';
import {
  advance,
  arrive,
  clampStep,
  emptyLoop,
  emptyTrace,
  formatMs,
  hiddenInQueue,
  INTRO_STEPS,
  IntroTask,
  IntroTaskKind,
  isFrozen,
  MainLoop,
  MainTrace,
  nextStep,
  PAINT_PHASES,
  PaintPhase,
  paintPhaseAt,
  prevStep,
  progressOf,
  TraceKind,
  traceEnd,
  tracePrune,
  traceStart,
  traceStop,
} from './story.intro.logic';
import { INTRO_ID, nextLevel } from './story.levels';

interface Pt {
  x: number;
  y: number;
}

/**
 * Dónde va cada cosa del dibujo, en unidades del viewBox. Hay dos trazados con
 * el mismo dibujo: `wide` (pantalla apaisada: main a la izquierda, lo demás a
 * la derecha) y `tall` (celular parado: la ventanita arriba, main abajo), para
 * que en un celular todo se lea grande.
 */
interface Layout {
  view: { w: number; h: number };
  /** Los pies de main y su escala. */
  main: Pt & { s: number };
  /** Lo que main tiene entre manos: arriba de su corona. */
  held: Pt;
  /** La primera tarjeta de la fila, cuánto se corre cada una y cuántas entran. */
  queue: Pt & { step: number; slots: number };
  /** La hoja del código: en reposo y cuando main la lee. */
  code: { home: Pt; run: Pt };
  /** La esquina de la ventanita del navegador (mide 420 x 262). */
  win: Pt;
  /** El ovillo del primer paso y el cartel del hilo. */
  yarn: Pt;
  plate: Pt;
  /** Las cuatro tareas de main, en el paso final. */
  jobs: readonly Pt[];
  /** Dónde habla main: sobre su cabeza, o al costado si ahí tiene una tarea. */
  say: Pt;
  sayBusy: Pt;
}

const LAYOUTS: Record<'wide' | 'tall', Layout> = {
  wide: {
    view: { w: 900, h: 560 },
    main: { x: 230, y: 482, s: 0.92 },
    held: { x: 236, y: 178 },
    queue: { x: 408, y: 434, step: 92, slots: 5 },
    code: { home: { x: 650, y: 286 }, run: { x: 540, y: 270 } },
    win: { x: 420, y: 100 },
    yarn: { x: 446, y: 462 },
    plate: { x: 600, y: 404 },
    jobs: [
      { x: 480, y: 150 },
      { x: 620, y: 280 },
      { x: 750, y: 150 },
      { x: 770, y: 400 },
    ],
    say: { x: 230, y: 178 },
    sayBusy: { x: 276, y: 66 },
  },
  tall: {
    view: { w: 520, h: 700 },
    main: { x: 150, y: 650, s: 0.8 },
    held: { x: 156, y: 380 },
    queue: { x: 300, y: 604, step: 84, slots: 3 },
    code: { home: { x: 260, y: 160 }, run: { x: 300, y: 290 } },
    win: { x: 50, y: 30 },
    yarn: { x: 340, y: 632 },
    plate: { x: 360, y: 548 },
    jobs: [
      { x: 110, y: 120 },
      { x: 400, y: 120 },
      { x: 110, y: 300 },
      { x: 400, y: 300 },
    ],
    say: { x: 300, y: 425 },
    sayBusy: { x: 350, y: 410 },
  },
};

/** Qué es cada pedazo de una línea de código: le da su color en la hoja. */
type CodeTokenKind = 'kw' | 'var' | 'op' | 'num' | 'obj' | 'prop' | 'fn' | 'str' | 'punct';
type CodeToken = readonly [kind: CodeTokenKind, text: string];

/** El código de app.js, ya cortado en pedazos con color. */
const CODE_LINES: readonly (readonly CodeToken[])[] = [
  [
    ['kw', 'let'],
    ['op', ' '],
    ['var', 'likes'],
    ['op', ' = '],
    ['num', '0'],
  ],
  [
    ['var', 'likes'],
    ['op', ' = '],
    ['var', 'likes'],
    ['op', ' + '],
    ['num', '1'],
  ],
  [
    ['obj', 'corazon'],
    ['punct', '.'],
    ['prop', 'texto'],
    ['op', ' = '],
    ['var', 'likes'],
  ],
  [
    ['obj', 'console'],
    ['punct', '.'],
    ['fn', 'log'],
    ['punct', '('],
    ['str', "'listo'"],
    ['punct', ')'],
  ],
];
const LINE_MS = 650;
/** Cuánto se ve en la línea de main que atendió un saludo (estirado: de verdad es un instante). */
const HELLO_MS = 300;
const PHASE_LABEL: Record<PaintPhase, string> = {
  style: 'estilo',
  layout: 'layout',
  paint: 'paint',
};

/** Una caja en la ventanita, en coordenadas de la ventanita. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}
/** Las cajas que se turnan en el paso de pintar. */
const BOXES: readonly Box[] = [
  { x: 50, y: 82, w: 110, h: 90, color: 'var(--in-coral)' },
  { x: 200, y: 122, w: 160, h: 110, color: 'var(--in-sky)' },
  { x: 80, y: 142, w: 220, h: 80, color: 'var(--in-leaf)' },
  { x: 236, y: 64, w: 90, h: 150, color: 'var(--in-gold)' },
];

const POKES = ['¡hola!', '¡jiji!', '¡boing!', '¡cosquillas!'];
const KIND_ICON: Record<IntroTaskKind, string> = {
  click: '👆',
  key: '⌨',
  timer: '⏱',
  message: '✉',
  long: '🧱',
};
/** Lo que dice main al entrar a cada paso. */
const HELLO: Record<string, string> = {
  hello: '¡Hola! Soy main',
  code: 'Pasame el código',
  loop: 'De a una, por favor',
  paint: '¿Le cambio la caja?',
  input: 'Te escucho',
  freeze: 'Ojo con lo pesado',
  recap: '¡Vamos al prólogo!',
};
const JOBS = [
  { icon: '📜', label: 'código' },
  { icon: '🚶', label: 'fila' },
  { icon: '🎨', label: 'pintar' },
  { icon: '👆', label: 'clics' },
] as const;

const NS = 'http://www.w3.org/2000/svg';

/**
 * El nivel de entrada, "Conocé a main": qué es el hilo principal y de qué se
 * encarga, en siete pasos cortos (`INTRO_STEPS`). No hay nada que superar: se
 * mira, se toca y se sigue. Main es el mismo de siempre (`MAIN_BODY`, dibujado
 * como en el mapa) y reacciona a lo que pasa en la escena (ver la skill de
 * animación vectorial):
 *  - vida: respira, parpadea y mira lo que pasa (GSAP);
 *  - toque: tocarlo suma velocidad a dos resortes (se aplasta y se tuerce);
 *  - reacción: asiente al terminar cada tarea; con una tarea larga le cae un
 *    bloque encima y queda congelado hasta terminarla.
 * La fila de tareas es la de `story.intro.logic` y avanza con un reloj por
 * cuadro. El texto de cada paso vive en HTML, en la tarjeta; el dibujo es
 * decorado (`aria-hidden`) y todo lo que se hace en él tiene su botón.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-story-intro',
  imports: [RouterLink],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <article
      class="in"
      [attr.data-step]="step().id"
      [attr.data-shape]="shape()"
      [class.is-frozen]="frozen()"
    >
      <header class="in-top">
        <a class="in-back" [routerLink]="['/t', themeId()]">
          <span class="in-back-arrow" aria-hidden="true"></span>
          Mapa
        </a>
        <h1 class="in-sr">Prólogo: Conocé a main</h1>
        <!-- La línea de main: qué hace y cuánto tarda cada cosa, como en las DevTools. -->
        <div #lane class="in-lane" role="img" [attr.aria-label]="laneSummary()">
          <span class="in-lane-name" aria-hidden="true">
            main
            <small>cada raya, 1 s</small>
          </span>
          <div class="in-lane-track" aria-hidden="true">
            <div class="in-lane-grid"></div>
            <div class="in-lane-tape">
              @for (s of trace().spans; track s.id) {
                <span
                  class="in-span"
                  [attr.data-kind]="s.kind"
                  [class.is-running]="s.end === null"
                  [style.--s]="s.start - laneOrigin"
                  [style.--e]="s.end === null ? null : s.end - laneOrigin"
                >
                  <b>{{ s.label }}</b>
                  @if (s.end !== null) {
                    <i>{{ fmtMs(s.end - s.start) }}</i>
                  }
                </span>
              }
            </div>
            <span class="in-lane-now"><b>ahora</b></span>
            @if (!trace().spans.length) {
              <span class="in-lane-idle">libre: esperando algo que hacer</span>
            }
          </div>
        </div>
        <ol class="in-dots" aria-label="Pasos de este nivel">
          @for (s of steps; track s.id; let i = $index) {
            <li>
              <button
                type="button"
                class="in-dot"
                [class.is-here]="i === stepIndex()"
                [class.is-seen]="i < stepIndex()"
                [attr.aria-current]="i === stepIndex() ? 'step' : null"
                [attr.aria-label]="'Paso ' + (i + 1) + ': ' + s.title"
                [title]="s.title"
                (click)="go(i)"
              >
                {{ i + 1 }}
              </button>
            </li>
          }
        </ol>
      </header>

      <div #stage class="in-stage">
        <svg
          #world
          class="in-world"
          [attr.viewBox]="'0 0 ' + L().view.w + ' ' + L().view.h"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          (pointerdown)="onWorldDown($event)"
        >
          <defs>
            <radialGradient id="in-g-main" cx="0.36" cy="0.28" r="0.85">
              <stop offset="0" class="in-s-main-light" />
              <stop offset="0.55" class="in-s-main" />
              <stop offset="1" class="in-s-main-dark" />
            </radialGradient>
            <radialGradient id="in-g-pool">
              <stop offset="0" class="in-s-light" stop-opacity="0.8" />
              <stop offset="1" class="in-s-light" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="in-g-block" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" class="in-s-block-top" />
              <stop offset="1" class="in-s-block-bot" />
            </linearGradient>
          </defs>

          <!-- La sala sigue más allá del dibujo: pared, zócalo y piso. -->
          <rect class="in-wall" x="-3000" y="-3000" width="7000" [attr.height]="3000 + floorY()" />
          <rect class="in-wainscot" x="-3000" [attr.y]="floorY() - 120" width="7000" height="120" />
          <ellipse
            class="in-glow"
            [attr.cx]="L().main.x + 60"
            [attr.cy]="L().main.y - 180"
            rx="320"
            ry="260"
          />
          <rect class="in-trim" x="-3000" [attr.y]="floorY() - 10" width="7000" height="12" />
          <rect class="in-floor" x="-3000" [attr.y]="floorY()" width="7000" height="3000" />
          <ellipse
            class="in-pool"
            [attr.cx]="L().main.x + 40"
            [attr.cy]="L().main.y + 4"
            rx="260"
            ry="44"
            fill="url(#in-g-pool)"
          />

          <!-- Paso 1: el ovillo. Main es el hilo principal; el hilo sale de su mano. -->
          @if (step().id === 'hello') {
            <g class="in-prop">
              <path class="in-thread" [attr.d]="threadPath()" />
              <g [attr.transform]="'translate(' + L().yarn.x + ' ' + L().yarn.y + ')'">
                <g #yarn class="in-yarn" (pointerdown)="poke($event)">
                  <circle class="in-yarn-ball" r="30" />
                  <path class="in-yarn-line" d="M-26 -10C-8 -22 14 -22 26 -8" />
                  <path class="in-yarn-line" d="M-28 6C-6 -8 18 -6 28 8" />
                  <path class="in-yarn-line" d="M-18 22C0 10 16 12 22 20" />
                </g>
              </g>
              <g [attr.transform]="'translate(' + L().plate.x + ' ' + L().plate.y + ')'">
                <g class="in-pop">
                  <rect class="in-plate" x="-100" y="-24" width="200" height="46" rx="14" />
                  <text class="in-plate-text" y="7" text-anchor="middle">el hilo principal</text>
                </g>
              </g>
            </g>
          }

          <!-- Paso 2: el código, en una hoja que se arrastra hasta main. -->
          @if (step().id === 'code') {
            <g
              #code
              class="in-code"
              [class.is-running]="codeLine() >= 0"
              [attr.transform]="'translate(' + L().code.home.x + ' ' + L().code.home.y + ')'"
              (pointerdown)="onCodeDown($event)"
            >
              <rect class="in-paper-shadow" x="-150" y="-84" width="300" height="184" rx="16" />
              <rect class="in-paper" x="-150" y="-92" width="300" height="184" rx="16" />
              <text class="in-paper-title" x="-128" y="-60">app.js</text>
              @if (codeLine() >= 0) {
                <rect
                  class="in-code-mark"
                  x="-140"
                  [attr.y]="-46 + codeLine() * 32"
                  width="280"
                  height="30"
                  rx="8"
                />
              }
              @for (l of codeLines; track $index) {
                <text
                  class="in-code-line"
                  [class.is-read]="$index < codeLine() || codeDone()"
                  x="-128"
                  [attr.y]="-24 + $index * 32"
                >
                  @for (tok of l; track $index) {
                    <tspan [attr.class]="'in-tok in-tok-' + tok[0]">{{ tok[1] }}</tspan>
                  }
                </text>
              }
              @if (codeDone()) {
                <g transform="translate(122 -70)">
                  <g class="in-pop">
                    <circle class="in-check" r="20" />
                    <path class="in-check-mark" d="M-9 0L-2 7L10 -7" />
                  </g>
                </g>
              }
            </g>
          }

          <!-- Pintar, clics y congelarse: la ventanita del navegador. -->
          @if (hasWindow()) {
            <g class="in-prop" [attr.transform]="'translate(' + L().win.x + ' ' + L().win.y + ')'">
              <rect class="in-win-shadow" x="0" y="8" width="420" height="262" rx="18" />
              <rect class="in-win" x="0" y="0" width="420" height="262" rx="18" />
              <path class="in-win-bar" d="M0 34V18Q0 0 18 0H402Q420 0 420 18V34Z" />
              <circle class="in-win-dot" cx="22" cy="17" r="6" />
              <circle class="in-win-dot" cx="42" cy="17" r="6" />
              <circle class="in-win-dot" cx="62" cy="17" r="6" />
              <text class="in-win-title" x="210" y="23" text-anchor="middle">tu página</text>

              @if (step().id === 'paint') {
                <rect
                  class="in-box"
                  [attr.x]="box().x"
                  [attr.y]="box().y"
                  [attr.width]="box().w"
                  [attr.height]="box().h"
                  [style.fill]="box().color"
                  rx="12"
                />
                @if (pending(); as p) {
                  @if (phase() === 'style') {
                    <g [attr.transform]="'translate(' + (p.x + p.w / 2) + ' ' + (p.y - 6) + ')'">
                      <g class="in-pop">
                        <rect class="in-tag" x="-86" y="-30" width="172" height="34" rx="11" />
                        <circle [style.fill]="p.color" cx="-64" cy="-13" r="10" />
                        <text class="in-tag-text" x="14" y="-6" text-anchor="middle">
                          color nuevo
                        </text>
                      </g>
                    </g>
                  }
                  @if (phase() === 'layout' || phase() === 'paint') {
                    <rect
                      class="in-outline"
                      [attr.x]="p.x"
                      [attr.y]="p.y"
                      [attr.width]="p.w"
                      [attr.height]="p.h"
                      rx="12"
                    />
                  }
                  @if (phase() === 'paint') {
                    <rect
                      class="in-fill"
                      [attr.x]="p.x"
                      [attr.y]="p.y"
                      [attr.width]="p.w"
                      [attr.height]="p.h"
                      [style.fill]="p.color"
                      [style.transform-origin]="p.x + 'px ' + p.y + 'px'"
                      rx="12"
                    />
                  }
                }
                <g class="in-phases" transform="translate(0 318)">
                  @for (ph of phases; track ph; let i = $index) {
                    <g
                      class="in-phase"
                      [attr.transform]="'translate(' + (80 + i * 130) + ' 0)'"
                      [class.is-on]="phase() === ph"
                      [class.is-past]="phaseIndex() > i"
                    >
                      <rect x="-60" y="-25" width="120" height="50" rx="16" />
                      <text y="8" text-anchor="middle">{{ phaseName[ph] }}</text>
                    </g>
                  }
                </g>
              } @else {
                <!-- El corazón y lo escrito cambian recién cuando main los atiende. -->
                <g class="in-heart-btn" (pointerdown)="onHeart($event)">
                  <rect class="in-btn" x="30" y="58" width="180" height="84" rx="22" />
                  <g transform="translate(82 100)">
                    <g #heart>
                      <path
                        class="in-heart"
                        d="M0 16C-24 -2 -28 -15 -21 -24C-15 -32 -4 -30 0 -21C4 -30 15 -32 21 -24C28 -15 24 -2 0 16Z"
                      />
                    </g>
                  </g>
                  <text class="in-count" x="160" y="113" text-anchor="middle">{{ likes() }}</text>
                </g>
                <rect class="in-field" x="30" y="166" width="360" height="66" rx="14" />
                <text class="in-typed" [class.is-empty]="!typed()" x="50" y="208">
                  {{ typed() || 'escribí algo…' }}
                </text>
                @if (step().id === 'freeze') {
                  <!-- Una animación de la página: gira solo si main puede pintar. -->
                  <g transform="translate(318 96)">
                    <g #spinner>
                      @for (a of spinnerDots; track a) {
                        <circle
                          class="in-spin-dot"
                          [attr.cx]="dotAt(a).x"
                          [attr.cy]="dotAt(a).y"
                          [attr.r]="3 + a * 0.8"
                        />
                      }
                    </g>
                  </g>
                  <text class="in-win-note" x="318" y="150" text-anchor="middle">animación</text>
                }
              }
            </g>
          }

          <!-- La fila de tareas, en el piso, a la derecha de main. -->
          @if (hasQueue()) {
            <g class="in-queue">
              <path
                class="in-queue-floor"
                [attr.d]="
                  'M' +
                  (L().queue.x - 46) +
                  ' ' +
                  (L().queue.y + 38) +
                  'H' +
                  (L().queue.x + L().queue.slots * L().queue.step)
                "
              />
              <text class="in-queue-label" [attr.x]="L().queue.x - 40" [attr.y]="L().queue.y + 64">
                fila de tareas
              </text>
              @for (t of shownQueue(); track t.id; let i = $index) {
                <g
                  class="in-slot"
                  [style.transform]="
                    'translate(' + (L().queue.x + i * L().queue.step) + 'px,' + L().queue.y + 'px)'
                  "
                >
                  <g class="in-arrive">
                    <g class="in-task" [attr.data-kind]="t.kind">
                      <rect x="-38" y="-32" width="76" height="64" rx="14" />
                      <text class="in-task-icon" y="-1" text-anchor="middle">
                        {{ icon(t.kind) }}
                      </text>
                      <text class="in-task-label" y="22" text-anchor="middle">{{ t.label }}</text>
                    </g>
                  </g>
                </g>
              }
              @if (hidden()) {
                <text
                  class="in-more"
                  [attr.x]="L().queue.x + (L().queue.slots - 1) * L().queue.step"
                  [attr.y]="L().queue.y - 46"
                  text-anchor="middle"
                >
                  +{{ hidden() }}
                </text>
              }
            </g>
          }

          <!-- Main -->
          <g
            [attr.transform]="
              'translate(' + L().main.x + ' ' + L().main.y + ') scale(' + L().main.s + ')'
            "
          >
            <ellipse class="in-contact" rx="94" ry="13" />
            <g #hop>
              <g #spring class="in-hero" (pointerdown)="poke($event)">
                <g #body>
                  <ellipse class="in-h-dark" cx="-38" cy="-2" rx="28" ry="12" />
                  <ellipse class="in-h-dark" cx="44" cy="-2" rx="28" ry="12" />
                  <path [attr.d]="mainBody" fill="url(#in-g-main)" />
                  <path
                    class="in-h-shine"
                    d="M-70 -80C-76 -132 -52 -178 -14 -194C-48 -168 -62 -128 -58 -84Z"
                  />
                  <ellipse class="in-h-belly" cx="10" cy="-58" rx="50" ry="40" />
                  <rect class="in-h-badge" x="-22" y="-72" width="64" height="24" rx="12" />
                  <text class="in-h-badge-text" x="10" y="-55" text-anchor="middle">main</text>
                  <g transform="translate(-80 -96)">
                    <path class="in-h-arm" d="M0 0C-16 10 -22 22 -14 34" />
                    <circle class="in-h-dark" cx="-13" cy="36" r="13" />
                  </g>
                  <g transform="translate(84 -96)">
                    <path class="in-h-arm" d="M0 0C16 10 22 22 14 34" />
                    <circle class="in-h-dark" cx="13" cy="36" r="13" />
                  </g>
                  <g transform="translate(14 -140)">
                    @for (e of eyes; track e.x) {
                      <g [attr.transform]="'translate(' + e.x + ' ' + e.y + ')'">
                        <g class="in-h-lid">
                          <ellipse class="in-h-white" [attr.rx]="e.r" [attr.ry]="e.r * 1.12" />
                          <g class="in-h-pupil">
                            <circle class="in-h-ink" [attr.r]="e.r * 0.52" />
                            <circle
                              class="in-h-white"
                              [attr.cx]="e.r * 0.2"
                              [attr.cy]="-e.r * 0.24"
                              [attr.r]="e.r * 0.18"
                            />
                          </g>
                        </g>
                      </g>
                    }
                    <path class="in-h-brow" d="M-42 -24Q-30 -32 -16 -26" />
                    <path class="in-h-brow" d="M12 -30Q28 -38 44 -30" />
                    <ellipse class="in-h-cheek" cx="-40" cy="26" rx="12" ry="6" />
                    <ellipse class="in-h-cheek" cx="50" cy="24" rx="13" ry="6" />
                    @if (frozen()) {
                      <path class="in-h-mouth" d="M-6 34Q6 28 18 34" />
                    } @else {
                      <path class="in-h-mouth" d="M-8 28Q6 42 20 28" />
                    }
                  </g>
                  <g transform="translate(10 -204)">
                    <path class="in-h-gold" d="M-38 4L-44 -34L-20 -14L0 -44L20 -14L44 -34L38 4Z" />
                    <path class="in-h-gold-dark" d="M-38 4L38 4L37 -4L-37 -4Z" />
                    <circle class="in-h-gem" cy="-8" r="5" />
                  </g>
                  <path class="in-h-frost" [attr.d]="mainBody" />
                </g>
              </g>
            </g>
          </g>

          <!-- Lo que main tiene entre manos, sobre su corona, con lo que le falta. -->
          @if (hasQueue()) {
            <g
              class="in-held"
              [attr.transform]="'translate(' + L().held.x + ' ' + L().held.y + ')'"
            >
              <circle class="in-ring-back" r="56" />
              @for (t of heldList(); track t.id) {
                <g
                  class="in-take"
                  [style.--in-from-x]="takeFrom().x + 'px'"
                  [style.--in-from-y]="takeFrom().y + 'px'"
                >
                  <circle
                    class="in-ring"
                    r="56"
                    pathLength="100"
                    [style.stroke-dashoffset]="100 - progress() * 100"
                  />
                  <g class="in-task" [attr.data-kind]="t.kind">
                    <rect x="-38" y="-32" width="76" height="64" rx="14" />
                    <text class="in-task-icon" y="-1" text-anchor="middle">{{ icon(t.kind) }}</text>
                    <text class="in-task-label" y="22" text-anchor="middle">{{ t.label }}</text>
                  </g>
                </g>
              }
              <g #loopArrow class="in-loop-arrow">
                <path d="M-72 -18A74 74 0 0 1 58 -46" />
                <path class="in-loop-head" d="M48 -62L68 -42L44 -32Z" />
              </g>
              <text class="in-done" x="-100" y="-40" text-anchor="end">hechas</text>
              <text class="in-done-n" x="-100" y="-6" text-anchor="end">{{ loop().done }}</text>
            </g>
          }

          <!-- La tarea larga: un bloque que le cae encima a main. -->
          @if (step().id === 'freeze') {
            <g [attr.transform]="'translate(' + L().held.x + ' 0)'">
              <g #block class="in-block" transform="translate(0 -300)">
                <rect class="in-block-side" x="-92" y="-124" width="184" height="124" rx="14" />
                <rect x="-92" y="-124" width="184" height="114" rx="14" fill="url(#in-g-block)" />
                <text class="in-block-small" y="-84" text-anchor="middle">tarea larga</text>
                <rect class="in-block-track" x="-66" y="-62" width="132" height="16" rx="8" />
                <rect
                  class="in-block-fill"
                  x="-66"
                  y="-62"
                  [attr.width]="132 * longProgress()"
                  height="16"
                  rx="8"
                />
                <text class="in-block-big" y="-22" text-anchor="middle">3 segundos</text>
              </g>
            </g>
          }

          <!-- Paso final: lo que hace main, alrededor de main. -->
          @if (step().id === 'recap') {
            @for (j of jobs; track j.label; let i = $index) {
              <g [attr.transform]="'translate(' + L().jobs[i].x + ' ' + L().jobs[i].y + ')'">
                <g class="in-job" [style.animation-delay]="0.2 + i * 0.15 + 's'">
                  <circle class="in-job-disc" r="56" />
                  <text class="in-job-icon" y="2" text-anchor="middle">{{ j.icon }}</text>
                  <text class="in-job-label" y="34" text-anchor="middle">{{ j.label }}</text>
                </g>
              </g>
            }
          }

          <!-- Lo que dice main (decorado: el texto de verdad está en la tarjeta). -->
          @for (text of saying(); track text) {
            <g [attr.transform]="'translate(' + sayAt().x + ' ' + sayAt().y + ')'">
              <g class="in-say">
                <rect
                  class="in-say-bubble"
                  [attr.x]="-sayWidth(text) / 2"
                  y="-30"
                  [attr.width]="sayWidth(text)"
                  height="50"
                  rx="20"
                />
                <path class="in-say-bubble" d="M-50 16L-74 44L-20 16Z" />
                <text class="in-say-text" y="4" text-anchor="middle">{{ text }}</text>
              </g>
            </g>
          }

          <g #fx class="in-fx"></g>
        </svg>
      </div>

      <section class="in-card" aria-labelledby="in-step-title">
        <p class="in-kicker">Paso {{ stepIndex() + 1 }} de {{ steps.length }}</p>
        @for (s of [step()]; track s.id) {
          <div class="in-text" aria-live="polite">
            <h2 id="in-step-title" class="in-step-title">{{ s.title }}</h2>
            @for (l of s.lines; track $index) {
              <p class="in-line">{{ l }}</p>
            }
          </div>
        }

        @if (step().id !== 'recap') {
          <div class="in-actions">
            @switch (step().id) {
              @case ('hello') {
                <button type="button" class="in-act" (click)="poke(null)">👋 Saludar a main</button>
              }
              @case ('code') {
                <button
                  type="button"
                  class="in-act"
                  [disabled]="codeLine() >= 0"
                  (click)="runCode()"
                >
                  ▶ Pasarle el código
                </button>
              }
              @case ('loop') {
                <button type="button" class="in-act" (click)="send('click')">+ Clic</button>
                <button type="button" class="in-act" (click)="send('timer')">+ Timer</button>
                <button type="button" class="in-act" (click)="send('message')">+ Mensaje</button>
              }
              @case ('paint') {
                <button type="button" class="in-act" [disabled]="!!pending()" (click)="repaint()">
                  🎨 Cambiar la caja
                </button>
              }
              @case ('input') {
                <button type="button" class="in-act" (click)="send('click')">
                  ♥ Tocar el corazón
                </button>
              }
              @case ('freeze') {
                <button
                  type="button"
                  class="in-act in-act--heavy"
                  [disabled]="hasLong()"
                  (click)="send('long')"
                >
                  🧱 Darle una tarea larga
                </button>
                <button type="button" class="in-act" (click)="send('click')">
                  ♥ Tocar el corazón
                </button>
              }
            }
          </div>
        }
        <p class="in-hint">{{ step().hint }}</p>
        <p class="in-note" aria-live="polite">{{ note() }}</p>

        <nav class="in-nav" aria-label="Pasos">
          <button type="button" class="in-prev" [disabled]="isFirst()" (click)="back()">
            <span aria-hidden="true">←</span> Atrás
          </button>
          @if (isLast()) {
            <a class="in-next" [routerLink]="nextLink()">
              Seguir: {{ nextTitle }}
              <span class="in-next-tri" aria-hidden="true"></span>
            </a>
          } @else {
            <button type="button" class="in-next" (click)="forward()">
              Siguiente
              <span class="in-next-tri" aria-hidden="true"></span>
            </button>
          }
        </nav>
      </section>
    </article>
  `,
  styleUrls: ['./story-intro.component.scss', './story-intro.scene.scss'],
})
export class StoryIntroComponent {
  private readonly progressSvc = inject(StoryProgress);
  private readonly injector = inject(Injector);
  protected readonly themeId = inject(ThemeService).activeId;
  private readonly stageEl = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly world = viewChild.required<ElementRef<SVGSVGElement>>('world');
  private readonly springEl = viewChild.required<ElementRef<SVGGElement>>('spring');
  private readonly hopEl = viewChild.required<ElementRef<SVGGElement>>('hop');
  private readonly bodyEl = viewChild.required<ElementRef<SVGGElement>>('body');
  private readonly fxEl = viewChild.required<ElementRef<SVGGElement>>('fx');
  private readonly codeEl = viewChild<ElementRef<SVGGElement>>('code');
  private readonly yarnEl = viewChild<ElementRef<SVGGElement>>('yarn');
  private readonly heartEl = viewChild<ElementRef<SVGGElement>>('heart');
  private readonly spinnerEl = viewChild<ElementRef<SVGGElement>>('spinner');
  private readonly blockEl = viewChild<ElementRef<SVGGElement>>('block');
  private readonly loopArrowEl = viewChild<ElementRef<SVGGElement>>('loopArrow');

  protected readonly mainBody = MAIN_BODY;
  protected readonly steps = INTRO_STEPS;
  protected readonly codeLines = CODE_LINES;
  protected readonly phases = PAINT_PHASES;
  protected readonly jobs = JOBS;
  protected readonly phaseName: Record<PaintPhase, string> = {
    style: '1 Estilo',
    layout: '2 Layout',
    paint: '3 Paint',
  };
  protected readonly spinnerDots = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly eyes = [
    { x: -28, y: 2, r: 15 },
    { x: 28, y: 0, r: 19 },
  ];

  /** Apaisado o parado: lo decide el lugar que hay para el dibujo. */
  protected readonly shape = signal<'wide' | 'tall'>('wide');
  protected readonly L = computed(() => LAYOUTS[this.shape()]);
  protected readonly floorY = computed(() => this.L().main.y + 4);
  /** El hilo, de la mano de main al ovillo. */
  protected readonly threadPath = computed(() => {
    const { main, yarn } = this.L();
    const hx = main.x + 98 * main.s;
    const hy = main.y - 60 * main.s;
    return `M${hx} ${hy}C${hx + 50} ${hy + 20} ${yarn.x - 70} ${yarn.y + 14} ${yarn.x - 26} ${yarn.y + 8}`;
  });
  protected readonly sayAt = computed(() => (this.hasQueue() ? this.L().sayBusy : this.L().say));
  /** Desde dónde vuela la tarjeta que main toma: la primera de la fila. */
  protected readonly takeFrom = computed(() => {
    const { queue, held } = this.L();
    return { x: queue.x - held.x, y: queue.y - held.y };
  });

  protected readonly stepIndex = signal(0);
  protected readonly step = computed(() => INTRO_STEPS[this.stepIndex()]);
  protected readonly isFirst = computed(() => prevStep(this.stepIndex()) === null);
  protected readonly isLast = computed(() => nextStep(this.stepIndex()) === null);
  private readonly after = nextLevel(INTRO_ID);
  protected readonly nextTitle = this.after?.title ?? 'el mapa';
  protected readonly nextLink = computed(() =>
    this.after ? ['/t', this.themeId(), 'example', this.after.id] : ['/t', this.themeId()],
  );

  /** Lo que dice main en el globo, en un arreglo para rearmarlo (y su entrada) en cada cambio. */
  private readonly says = signal('');
  protected readonly saying = computed(() => (this.says() ? [this.says()] : []));
  /** Lo que acaba de pasar, en una línea (por ejemplo, que un clic quedó esperando). */
  protected readonly note = signal('');

  // ── La fila de main ──
  protected readonly loop = signal<MainLoop>(emptyLoop());
  protected readonly frozen = computed(() => isFrozen(this.loop()));
  protected readonly progress = computed(() => progressOf(this.loop()));
  protected readonly hidden = computed(() => hiddenInQueue(this.loop(), this.L().queue.slots));
  protected readonly shownQueue = computed(() => this.loop().queue.slice(0, this.L().queue.slots));
  /** Lo que main tiene entre manos (la tarea larga se dibuja aparte, como bloque). */
  protected readonly heldList = computed<IntroTask[]>(() => {
    const c = this.loop().current;
    return c && c.task.kind !== 'long' ? [c.task] : [];
  });
  protected readonly hasLong = computed(() => {
    const l = this.loop();
    return l.current?.task.kind === 'long' || l.queue.some((t) => t.kind === 'long');
  });
  protected readonly longProgress = computed(() => (this.frozen() ? this.progress() : 0));
  protected readonly hasQueue = computed(() =>
    ['loop', 'input', 'freeze'].includes(this.step().id),
  );
  protected readonly hasWindow = computed(() =>
    ['paint', 'input', 'freeze'].includes(this.step().id),
  );
  protected readonly likes = signal(0);
  protected readonly typed = signal('');

  // ── La línea de main (arriba): qué hace y cuánto tarda ──
  protected readonly trace = signal<MainTrace>(emptyTrace());
  /** La hora en que se armó la línea: cada tramo se ubica respecto de ella. */
  protected readonly laneOrigin = performance.now();
  protected readonly fmtMs = formatMs;
  protected readonly laneSummary = computed(() => {
    const s = this.trace().spans;
    const last = s[s.length - 1];
    if (!last) return 'Línea de main: libre, esperando algo que hacer.';
    return last.end === null
      ? `Línea de main: ahora está haciendo ${last.label}.`
      : `Línea de main: lo último fue ${last.label}, tardó ${formatMs(last.end - last.start)}.`;
  });
  private readonly laneEl = viewChild.required<ElementRef<HTMLElement>>('lane');
  /** Qué tramo de la línea es cada tarea de la fila. */
  private readonly spanOfTask = new Map<number, number>();

  // ── El código ──
  /** La línea que main está leyendo (-1: no está leyendo). */
  protected readonly codeLine = signal(-1);
  protected readonly codeDone = signal(false);

  // ── Pintar ──
  protected readonly box = signal<Box>(BOXES[0]);
  protected readonly pending = signal<Box | null>(null);
  protected readonly phase = signal<PaintPhase | null>(null);
  protected readonly phaseIndex = computed(() => {
    const p = this.phase();
    return p ? PAINT_PHASES.indexOf(p) : -1;
  });
  private paintFrom = 0;
  private boxN = 0;

  /** Calma: sin viajes ni bucles; la información queda igual. */
  private readonly calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private ready = false;
  private raf = 0;
  private dead = false;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private gctx?: gsap.Context;
  private sayCall?: gsap.core.Tween;
  private blinkCall?: gsap.core.Tween;
  /** Resortes del toque: aplastar y torcer. Un toque suma velocidad, no fija una pose. */
  private readonly squash = spring(0, 260, 7);
  private readonly tilt = spring(0, 180, 6);
  private pokes = 0;
  private spin = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const resize = new ResizeObserver(([e]) => {
        const { width, height } = e.contentRect;
        this.shape.set(width < height * 1.05 ? 'tall' : 'wide');
      });
      resize.observe(this.stageEl().nativeElement);
      destroyRef.onDestroy(() => resize.disconnect());
      this.gctx = gsap.context(() => undefined, this.world().nativeElement);
      this.ready = true;
      this.life();
      this.enterStep();
      let last = performance.now();
      const tick = (now: number) => {
        if (this.dead) return;
        this.frame(now, now - last);
        last = now;
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
    // Cada paso arranca de cero: la fila vacía, las cosas en su lugar.
    effect(() => {
      this.stepIndex();
      untracked(() => {
        if (this.ready) this.enterStep();
      });
    });
    // Al cambiar de trazado, la hoja del código vuelve a su lugar del trazado nuevo.
    effect(() => {
      const home = this.L().code.home;
      untracked(() => {
        const code = this.codeEl()?.nativeElement;
        if (code && this.codeLine() < 0) gsap.set(code, { x: home.x, y: home.y });
      });
    });
    destroyRef.onDestroy(() => {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      for (const t of this.timers) clearTimeout(t);
      this.gctx?.revert();
      this.sayCall?.kill();
      this.blinkCall?.kill();
    });
  }

  protected icon(kind: IntroTaskKind): string {
    return KIND_ICON[kind];
  }
  protected dotAt(i: number): Pt {
    const a = (i / 8) * Math.PI * 2;
    return { x: 22 * Math.cos(a), y: 22 * Math.sin(a) };
  }
  protected sayWidth(text: string): number {
    return Math.max(120, text.length * 13.5 + 44);
  }

  // ── Navegación entre pasos ──
  protected go(i: number): void {
    this.stepIndex.set(clampStep(i));
  }
  protected forward(): void {
    const n = nextStep(this.stepIndex());
    if (n !== null) this.go(n);
  }
  protected back(): void {
    const p = prevStep(this.stepIndex());
    if (p !== null) this.go(p);
  }

  /** Pone el paso en su estado inicial y main dice algo. */
  private enterStep(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    this.loop.set(emptyLoop());
    // La línea sigue (el tiempo no vuelve atrás); lo que corría se corta acá.
    this.trace.update((t) => traceStop(t, performance.now()));
    this.spanOfTask.clear();
    this.likes.set(0);
    this.typed.set('');
    this.codeLine.set(-1);
    this.codeDone.set(false);
    this.pending.set(null);
    this.phase.set(null);
    this.note.set('');
    this.toRest();
    const id = this.step().id;
    this.say(HELLO[id]);
    this.look(id === 'recap' ? { x: 0, y: -0.6 } : { x: 1, y: id === 'hello' ? 0.3 : -0.4 });
    if (id === 'recap') {
      // Verlo entero cuenta como recorrido: el mapa lo marca y main festeja.
      this.progressSvc.completePath(INTRO_ID, 'seen');
      this.cheer();
    }
  }

  // ── Cada cuadro: la fila avanza, pintar avanza, los resortes se mueven ──
  private frame(now: number, dt: number): void {
    if (this.hasQueue()) {
      const was = this.loop();
      if (was.current || was.queue.length) {
        const step = advance(was, dt);
        this.loop.set(step.loop);
        // En orden: lo que venía de antes termina; después, cada una que tomó
        // empieza (y, si un cuadro largo alcanzó para todo, también termina).
        const startedIds = new Set(step.started.map((t) => t.id));
        for (const t of step.finished) if (!startedIds.has(t.id)) this.onFinished(t);
        for (const t of step.started) {
          this.onStarted(t);
          const done = step.finished.find((f) => f.id === t.id);
          if (done) this.onFinished(done);
        }
      }
    }
    const pending = this.pending();
    if (pending) {
      const ph = paintPhaseAt(now - this.paintFrom);
      if (ph !== this.phase()) {
        this.phase.set(ph);
        if (ph) {
          this.mark(ph, PHASE_LABEL[ph]);
          this.nod();
        } else {
          this.trace.update((t) => traceStop(t, now));
          this.box.set(pending);
          this.pending.set(null);
          this.say('¡Listo, pintado!');
        }
      }
    }
    // La línea de main corre: un custom property por cuadro, sin re-renderizar los tramos.
    this.laneEl().nativeElement.style.setProperty('--lane-now', (now - this.laneOrigin).toFixed(1));
    this.trace.update((t) => tracePrune(t, now));
    // La animación de la página gira solo mientras main puede pintar.
    const spinner = this.spinnerEl()?.nativeElement;
    if (spinner && !this.frozen()) {
      this.spin = (this.spin + (this.calm ? 0 : dt * 0.25)) % 360;
      spinner.setAttribute('transform', `rotate(${this.spin.toFixed(1)})`);
    }
    stepSprings([this.squash, this.tilt], dt / 1000);
    const sq = this.squash.x;
    this.springEl().nativeElement.setAttribute(
      'transform',
      `rotate(${this.tilt.x.toFixed(2)}) scale(${(1 + sq * 0.6).toFixed(3)} ${(1 - sq).toFixed(3)})`,
    );
  }

  /** Main empieza algo: un tramo nuevo en su línea. Devuelve el tramo. */
  private mark(kind: TraceKind, label: string): number {
    let id = 0;
    this.trace.update((t) => {
      const next = traceStart(t, kind, label, performance.now());
      id = next.id;
      return next.trace;
    });
    return id;
  }
  private unmark(id: number): void {
    this.trace.update((t) => traceEnd(t, id, performance.now()));
  }

  private onStarted(t: IntroTask): void {
    this.spanOfTask.set(t.id, this.mark(t.kind, t.kind === 'key' ? `tecla ${t.label}` : t.label));
    if (t.kind === 'long') {
      this.dropBlock();
      return;
    }
    const arrow = this.loopArrowEl()?.nativeElement;
    if (arrow && !this.calm) {
      this.anim(() =>
        gsap.fromTo(
          arrow,
          { rotation: 0, svgOrigin: '0 0' },
          { rotation: 360, duration: 0.5, ease: 'power2.inOut', overwrite: true },
        ),
      );
    }
    this.look({ x: 0.2, y: -1 });
  }

  private onFinished(t: IntroTask): void {
    const span = this.spanOfTask.get(t.id);
    if (span !== undefined) {
      this.unmark(span);
      this.spanOfTask.delete(t.id);
    }
    if (t.kind === 'long') {
      this.liftBlock();
      this.note.set('Terminé la tarea larga. Ahora atiendo la fila.');
      return;
    }
    if (t.kind === 'click' && this.step().id !== 'loop') {
      this.likes.update((n) => n + 1);
      const heart = this.heartEl()?.nativeElement;
      if (heart && !this.calm) {
        this.anim(() =>
          gsap.fromTo(
            heart,
            { scale: 1.5, transformOrigin: '50% 50%' },
            { scale: 1, duration: 0.35, ease: 'back.out(3)', overwrite: true },
          ),
        );
      }
    }
    if (t.kind === 'key') this.typed.update((s) => (s + t.label).slice(-18));
    this.nod();
    const { held } = this.L();
    this.puff(held.x + 70, held.y - 40, '✓');
  }

  // ── Lo que dispara el alumno ──
  protected send(kind: IntroTaskKind): void {
    if (kind === 'long' && this.hasLong()) return;
    this.loop.update((l) => arrive(l, kind));
    if (kind === 'long') this.note.set('');
    else if (this.hasLong()) this.note.set('Main está ocupado: tu clic espera en la fila.');
  }

  protected onKey(event: KeyboardEvent): void {
    const id = this.step().id;
    if (id !== 'input' && id !== 'freeze') return;
    if (event.ctrlKey || event.metaKey || event.altKey || !/^[\p{L}\p{N}]$/u.test(event.key)) {
      return;
    }
    this.loop.update((l) => arrive(l, 'key', event.key));
    if (this.hasLong()) this.note.set('Main está ocupado: tu tecla espera en la fila.');
  }

  protected onHeart(event: PointerEvent): void {
    event.stopPropagation();
    this.send('click');
    this.spark(event, '♥');
  }

  protected onWorldDown(event: PointerEvent): void {
    // Tocar alrededor también cuenta: main mira hacia ahí.
    const p = this.toWorld(event);
    const { main } = this.L();
    this.look({ x: (p.x - main.x) / 260, y: (p.y - (main.y - 150 * main.s)) / 260 });
  }

  /** Tocar a main (o saludarlo con el botón): los resortes suman velocidad según dónde. */
  protected poke(event: PointerEvent | null): void {
    event?.stopPropagation();
    const { main } = this.L();
    if (this.frozen()) {
      // Congelado no reacciona: ni se mueve. Lo que se toca espera en la fila.
      this.send('click');
      if (event) this.spark(event, '…');
      return;
    }
    const p = event ? this.toWorld(event) : { x: main.x + 40, y: main.y - 200 * main.s };
    const side = Math.sign(p.x - main.x) || 1;
    const high = Math.min(1, Math.max(0, (main.y - p.y) / (240 * main.s)));
    if (!this.calm) {
      this.squash.v += 2.4 + high * 2.2;
      this.tilt.v -= side * (40 + high * 80);
    }
    // Atender el toque también es una tarea de main (estirada para que se vea).
    const hello = this.mark('hello', 'saludo');
    this.later(() => this.unmark(hello), HELLO_MS);
    this.say(POKES[this.pokes++ % POKES.length]);
    if (event) this.spark(event, '✦');
    const yarn = this.yarnEl()?.nativeElement;
    if (yarn && !this.calm) {
      // El ovillo también se sacude: está atado a main.
      this.anim(() =>
        gsap.fromTo(
          yarn,
          { rotation: 0, y: 0, transformOrigin: '50% 50%' },
          {
            keyframes: { y: [0, -30, 0, -9, 0], rotation: [0, 140, 220, 250, 260] },
            duration: 0.9,
            ease: 'power1.out',
            overwrite: true,
          },
        ),
      );
    }
  }

  // ── El código: se arrastra hasta main (o se toca) ──
  protected onCodeDown(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.codeLine() >= 0) return;
    const code = this.codeEl()?.nativeElement;
    if (!code) return;
    const start = this.toWorld(event);
    const from = { x: Number(gsap.getProperty(code, 'x')), y: Number(gsap.getProperty(code, 'y')) };
    let far = 0;
    const target = event.currentTarget as Element;
    target.setPointerCapture?.(event.pointerId);
    const move = (e: Event) => {
      const p = this.toWorld(e as PointerEvent);
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      far = Math.max(far, Math.hypot(dx, dy));
      gsap.set(code, { x: from.x + dx, y: from.y + dy });
      this.look({ x: (from.x + dx - this.L().main.x) / 300, y: -0.4 });
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      const { run, home } = this.L().code;
      const x = Number(gsap.getProperty(code, 'x'));
      const y = Number(gsap.getProperty(code, 'y'));
      // Un toque, o soltarlo más cerca de main que de su lugar: main lo lee.
      const nearer = Math.hypot(x - run.x, y - run.y) < Math.hypot(x - home.x, y - home.y);
      if (far < 8 || nearer) this.runCode();
      else
        this.anim(() => gsap.to(code, { ...home, duration: this.dur(0.5), ease: 'back.out(1.6)' }));
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }

  protected runCode(): void {
    if (this.codeLine() >= 0) return;
    const code = this.codeEl()?.nativeElement;
    const { run } = this.L().code;
    this.codeDone.set(false);
    this.codeLine.set(0);
    this.say('Leo línea por línea…');
    if (code) {
      this.anim(() => gsap.to(code, { ...run, duration: this.dur(0.45), ease: 'back.out(1.4)' }));
    }
    this.look({ x: 1, y: -0.7 });
    CODE_LINES.forEach((_, i) => {
      this.later(
        () => {
          this.codeLine.set(i);
          this.mark('code', `línea ${i + 1}`);
          this.nod();
        },
        450 + i * LINE_MS,
      );
    });
    this.later(
      () => {
        this.codeLine.set(-1);
        this.trace.update((t) => traceStop(t, performance.now()));
        this.codeDone.set(true);
        this.say('¡Listo! Una por vez.');
        this.later(() => {
          this.codeDone.set(false);
          const now = this.codeEl()?.nativeElement;
          if (now) {
            this.anim(() =>
              gsap.to(now, {
                ...this.L().code.home,
                duration: this.dur(0.6),
                ease: 'power2.inOut',
              }),
            );
          }
        }, 2400);
      },
      450 + CODE_LINES.length * LINE_MS,
    );
  }

  // ── Pintar ──
  protected repaint(): void {
    if (this.pending()) return;
    this.boxN = (this.boxN + 1) % BOXES.length;
    this.pending.set(BOXES[this.boxN]);
    this.paintFrom = performance.now();
    this.look({ x: 1, y: -0.6 });
    this.say('Estilo, layout, paint…');
  }

  // ── La tarea larga ──
  private dropBlock(): void {
    const block = this.blockEl()?.nativeElement;
    this.say('');
    if (!block) return;
    const { main } = this.L();
    // El bloque se apoya sobre la corona de main.
    const rest = main.y - 250 * main.s;
    if (this.calm) {
      gsap.set(block, { y: rest });
    } else {
      this.anim(() =>
        gsap.fromTo(
          block,
          { y: -300 },
          {
            y: rest,
            duration: 0.42,
            ease: 'power3.in',
            overwrite: true,
            onComplete: () => {
              // El golpe: main se aplasta, levanta polvo y queda quieto hasta terminar.
              this.squash.v += 9;
              this.dust();
              this.anim(() =>
                gsap.fromTo(
                  block,
                  { y: rest - 20 },
                  { y: rest, duration: 0.24, ease: 'power2.out' },
                ),
              );
            },
          },
        ),
      );
    }
    this.blinkCall?.pause();
  }

  private liftBlock(): void {
    const block = this.blockEl()?.nativeElement;
    if (block) {
      this.anim(() =>
        gsap.to(block, { y: -300, duration: this.dur(0.5), ease: 'back.in(1.6)', overwrite: true }),
      );
    }
    if (!this.calm) this.squash.v -= 4;
    this.blinkCall?.resume();
    this.say('¡Uf! Ya está');
  }

  // ── Main: vida, gestos y globos ──
  private life(): void {
    if (this.calm) return;
    const body = this.bodyEl().nativeElement;
    gsap.set(body, { svgOrigin: '0 0' });
    this.anim(() =>
      gsap.to(body, {
        scaleY: 1.025,
        scaleX: 0.99,
        duration: 1.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
    );
    const blink = () => {
      if (this.dead) return;
      if (!this.frozen()) {
        const lids = this.world().nativeElement.querySelectorAll('.in-h-lid');
        this.anim(() =>
          gsap
            .timeline()
            .to(lids, {
              scaleY: 0.1,
              transformOrigin: '50% 50%',
              duration: 0.05,
              ease: 'power1.in',
            })
            .to(lids, { scaleY: 1, duration: 0.08, ease: 'power1.out' }),
        );
      }
      this.blinkCall = gsap.delayedCall(2 + Math.random() * 3, blink);
    };
    this.blinkCall = gsap.delayedCall(1.5, blink);
  }

  /** Main asiente: una tarea, una línea, un paso de pintar. */
  private nod(): void {
    if (this.calm) return;
    this.anim(() =>
      gsap.fromTo(
        this.hopEl().nativeElement,
        { y: 0 },
        { keyframes: { y: [0, -14, 0] }, duration: 0.28, ease: 'power2.out', overwrite: true },
      ),
    );
    this.squash.v += 1.2;
  }

  private cheer(): void {
    if (this.calm) return;
    this.anim(() =>
      gsap.fromTo(
        this.hopEl().nativeElement,
        { y: 0 },
        {
          keyframes: { y: [0, -60, 0, -24, 0] },
          duration: 1,
          ease: 'power1.inOut',
          delay: 0.3,
          overwrite: true,
        },
      ),
    );
    const { main } = this.L();
    for (let i = 0; i < 8; i++) {
      this.later(
        () => this.puff(main.x - 100 + i * 28, main.y - 230 * main.s - (i % 3) * 30, '✦'),
        300 + i * 60,
      );
    }
  }

  /** Mira hacia una dirección (-1..1 en cada eje). */
  private look(dir: Pt): void {
    if (this.calm) return;
    const pupils = this.world().nativeElement.querySelectorAll('.in-h-pupil');
    const lim = (v: number) => Math.max(-1, Math.min(1, v));
    this.anim(() =>
      gsap.to(pupils, {
        x: lim(dir.x) * 5,
        y: lim(dir.y) * 4,
        duration: 0.3,
        ease: 'power2.inOut',
        overwrite: 'auto',
      }),
    );
  }

  /** Todo a su pose antes de cada paso: nada queda a medio camino. */
  private toRest(): void {
    this.squash.x = this.squash.v = 0;
    this.tilt.x = this.tilt.v = 0;
    gsap.set(this.hopEl().nativeElement, { y: 0 });
    const lids = this.world().nativeElement.querySelectorAll('.in-h-lid');
    gsap.set(lids, { scaleY: 1, transformOrigin: '50% 50%' });
    this.blinkCall?.resume();
  }

  private say(text: string): void {
    this.says.set(text);
    this.sayCall?.kill();
    if (text) this.sayCall = gsap.delayedCall(2.8, () => this.says.set(''));
  }

  /** Una chispa o un ✓ que sube y se va. */
  private puff(x: number, y: number, mark: string): void {
    if (this.calm || this.dead) return;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'in-puff');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('text-anchor', 'middle');
    t.style.fill = 'var(--in-gold)';
    t.style.stroke = 'var(--in-shade)';
    t.style.strokeWidth = '5px';
    t.style.paintOrder = 'stroke';
    t.style.font = '900 34px var(--font-display)';
    t.textContent = mark;
    this.fxEl().nativeElement.appendChild(t);
    this.anim(() =>
      gsap.fromTo(
        t,
        { opacity: 1, y: 0, scale: 0.6, svgOrigin: `${x} ${y}` },
        {
          opacity: 0,
          y: -50,
          scale: 1.2,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => t.remove(),
        },
      ),
    );
  }

  private spark(event: PointerEvent, mark: string): void {
    const p = this.toWorld(event);
    this.puff(p.x, p.y, mark);
  }

  /** Polvo a los costados de los pies (el golpe del bloque). */
  private dust(): void {
    if (this.calm) return;
    const { main } = this.L();
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const cx = main.x + side * 80 * main.s;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(main.y - 6));
      c.setAttribute('r', String(8 + (i % 3) * 4));
      c.style.fill = 'var(--in-dust)';
      this.fxEl().nativeElement.appendChild(c);
      this.anim(() =>
        gsap.to(c, {
          x: side * (40 + i * 12),
          y: -20 - (i % 3) * 10,
          opacity: 0,
          scale: 1.6,
          svgOrigin: `${cx} ${main.y - 6}`,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => c.remove(),
        }),
      );
    }
  }

  private toWorld(event: PointerEvent): Pt {
    const m = this.world().nativeElement.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  private dur(s: number): number {
    return this.calm ? 0 : s;
  }

  /** Toda animación entra al contexto de GSAP: al salir se desarma entera. */
  private anim(fn: () => unknown): void {
    if (this.gctx) this.gctx.add(fn);
    else fn();
  }

  private later(fn: () => void, ms: number): void {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (!this.dead) fn();
    }, ms);
    this.timers.add(t);
  }
}
