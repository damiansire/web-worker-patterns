import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { ThemeService } from '../../../theming/theme.service';
import { MAIN_BODY } from './scene/scene.art';
import { NightScene, StoryDawnComponent } from './story-dawn.component';
import { StoryPlayComponent } from './story-play.component';
import { IconPart, levelIcon } from './story.icons';
import { StoryProgress } from './story-progress.service';
import { CHAPTERS, currentLevel, Level, LEVELS, levelState, LevelState } from './story.levels';
import {
  chapterRoads,
  cloudPath,
  hash,
  landmarks,
  MAP_SPECS,
  MapShape,
  mapSpots,
  Point,
  ridge,
  roadPath,
  scatter,
  segments,
  segmentTail,
  wrapWords,
} from './story.map';

interface Spot {
  level: Level;
  x: number;
  y: number;
  state: LevelState;
  name: string[];
  /** La placa crema del nombre, en unidades de la baldosa. */
  plate: { w: number; h: number };
  icon: readonly IconPart[];
}

interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  d: number;
}

const spring = (k: number, d: number): Spring => ({ x: 0, v: 0, t: 0, k, d });
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const NS = 'http://www.w3.org/2000/svg';

/**
 * El nombre de cada parada, sobre una placa crema debajo de la baldosa (en
 * unidades de la baldosa). El ancho sale de los caracteres: en la letra
 * redondeada del theme, a 800, un carácter mide entre 0,50 y 0,57 de alto.
 */
const NAME = { size: 20, lh: 24, top: 46, base: 67, padX: 11, r: 10, em: 0.57 };
const plateFor = (lines: readonly string[]) => ({
  w: Math.max(...lines.map((l) => l.length)) * NAME.size * NAME.em + NAME.padX * 2,
  h: NAME.base - NAME.top + (lines.length - 1) * NAME.lh + 8,
});

/** Lo que suma el nombre del nivel debajo de la medalla, en píxeles. */
const CAPTION_H = 15;
const POKES = ['¡ey!', '¡jiji!', '¡boing!', '¡cosquillas!'];

/**
 * El mapa de la historia: la portada. Un mundo a pantalla completa (cielo,
 * cerros, un prado con un hito por capítulo) cruzado por un camino con una
 * baldosa en cada parada. Main vive ahí, parado en el centro de la suya:
 * respira, parpadea, mira lo que tocás y camina hasta el nivel que elegís;
 * recién al llegar se entra. El botón de jugar va arriba de su cabeza y lo sigue.
 * Cada baldosa lleva el ícono de su caso (`story.icons.ts`) y su estado se ve
 * en el dibujo, sin insignias: pintada (se juega), de piedra con candado
 * (bloqueada, tiembla al tocarla), clarita con un conito (en obra: abre la
 * versión clásica) o con banderita (superada). El nombre va en una placa crema.
 *
 * Capas de animación: la vida (nubes, molino, humo, faro) es CSS y se apaga con
 * movimiento reducido; los toques son resortes (`gsap.ticker`) sobre el grupo
 * `spring` de main; los saltos y el viaje son GSAP sobre otros grupos, para que
 * nadie pise la propiedad de otro. Sin encapsulación: los efectos se crean por
 * código y cuelgan de `.sm`.
 *
 * La primera vez se llega de noche (`story-dawn`): main duerme y el play, lo
 * único encendido, da el toque que el navegador pide para que suene la música
 * del nivel. Al tocarlo amanece y queda el mapa: el nivel lo elige el alumno.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'default-story-map',
  imports: [StoryDawnComponent, StoryPlayComponent],
  template: `
    <section
      #stage
      class="sm"
      [attr.data-shape]="shape()"
      [class.is-play-cramped]="playCramped()"
      [class.is-saying]="!!heroSays()"
      [class.is-night]="night()"
    >
      <svg
        #world
        class="sm-world"
        [attr.viewBox]="'0 0 ' + spec().view.w + ' ' + spec().view.h"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Mapa de niveles"
        (pointerdown)="tap($event)"
        (pointermove)="look($event)"
      >
        <defs>
          <linearGradient
            id="sm-g-sky"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            [attr.y1]="spec().horizon - 900"
            [attr.y2]="spec().horizon"
          >
            <stop offset="0" class="sm-s-sky-top" />
            <stop offset="1" class="sm-s-sky-bot" />
          </linearGradient>
          <linearGradient
            id="sm-g-ground"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            [attr.y1]="spec().horizon"
            [attr.y2]="spec().view.h + 200"
          >
            <stop offset="0" class="sm-s-ground-top" />
            <stop offset="1" class="sm-s-ground-bot" />
          </linearGradient>
          <radialGradient id="sm-g-sun">
            <stop offset="0" class="sm-s-sun" stop-opacity="0.75" />
            <stop offset="1" class="sm-s-sun" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="sm-g-main" cx="0.36" cy="0.28" r="0.85">
            <stop offset="0" class="sm-s-main-light" />
            <stop offset="0.55" class="sm-s-main" />
            <stop offset="1" class="sm-s-main-dark" />
          </radialGradient>
          <linearGradient id="sm-g-beam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" class="sm-s-sun" stop-opacity="0.7" />
            <stop offset="1" class="sm-s-sun" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Cielo, sol y nubes -->
        <rect
          x="-6000"
          y="-6000"
          width="14000"
          [attr.height]="6000 + spec().horizon + 60"
          fill="url(#sm-g-sky)"
        />
        <circle
          [attr.cx]="sun().x"
          [attr.cy]="sun().y"
          [attr.r]="420 * spec().s"
          fill="url(#sm-g-sun)"
        />
        <circle class="sm-sun" [attr.cx]="sun().x" [attr.cy]="sun().y" [attr.r]="58 * spec().s" />
        <g aria-hidden="true">
          @for (c of clouds(); track $index) {
            <path
              class="sm-cloud"
              [attr.d]="c.d"
              [style.animation-duration.s]="c.dur"
              [style.animation-delay.s]="c.delay"
            />
          }
        </g>
        <g class="sm-birds" aria-hidden="true" [style.--sm-fly]="spec().view.w + 1400 + 'px'">
          @for (b of birds(); track $index) {
            <path class="sm-bird" [attr.d]="b" [style.animation-delay.s]="-$index * 0.17" />
          }
        </g>

        <!-- Lejos, medio y suelo -->
        <path class="sm-far" [attr.d]="far()[0]" />
        <path class="sm-far2" [attr.d]="far()[1]" />
        <path [attr.d]="far()[2]" fill="url(#sm-g-ground)" />
        <path class="sm-mid" [attr.d]="far()[3]" />

        <!-- Matas, flores y árboles, por profundidad -->
        <g aria-hidden="true">
          @for (t of tufts(); track $index) {
            <g
              [attr.transform]="
                'translate(' + t.x + ' ' + t.y + ') scale(' + t.size * spec().s + ')'
              "
            >
              @if (t.k < 0.35) {
                <g class="sm-flower" [attr.data-k]="t.k < 0.12 ? 'a' : t.k < 0.24 ? 'b' : 'c'">
                  <circle cx="-5" cy="-12" r="5" />
                  <circle cx="5" cy="-12" r="5" />
                  <circle cx="0" cy="-19" r="5" />
                  <circle cx="0" cy="-6" r="5" />
                  <circle class="sm-flower-eye" cy="-12" r="3.4" />
                </g>
              } @else {
                <path class="sm-tuft" d="M-10 0Q-9 -9 -4 -14M0 0Q0 -12 3 -19M9 0Q8 -9 4 -13" />
              }
            </g>
          }
          @for (t of trees(); track $index) {
            <g
              [attr.transform]="
                'translate(' + t.x + ' ' + t.y + ') scale(' + t.size * spec().s * 0.95 + ')'
              "
            >
              <ellipse class="sm-contact" rx="34" ry="8" />
              @if (t.k < 0.32) {
                <path class="sm-trunk" d="M-5 0V-22H5V0Z" />
                <path class="sm-pine" d="M-30 -18L0 -64L30 -18Z" />
                <path class="sm-pine" d="M-24 -46L0 -92L24 -46Z" />
                <path class="sm-pine-hi" d="M0 -92L-24 -46L-12 -46L0 -78Z" />
              } @else {
                <path class="sm-trunk" d="M-5 0V-28H5V0Z" />
                <circle class="sm-leaf" cx="-17" cy="-38" r="19" />
                <circle class="sm-leaf" cx="17" cy="-40" r="20" />
                <circle class="sm-leaf" cy="-56" r="25" />
                <circle class="sm-leaf-hi" cx="-8" cy="-64" r="12" />
              }
            </g>
          }
        </g>

        <!-- Un hito por capítulo -->
        @for (m of marks(); track m.chapter) {
          <g
            class="sm-lm"
            [attr.data-chapter]="m.chapter"
            [attr.transform]="'translate(' + m.x + ' ' + m.y + ') scale(' + art() + ')'"
            aria-hidden="true"
          >
            <ellipse class="sm-contact" rx="66" ry="10" />
            @switch (m.chapter) {
              @case ('prologue') {
                <path class="lm-wall" d="M-48 0V-62H48V0Z" />
                <path class="lm-wall-shade" d="M22 0V-62H48V0Z" />
                <path class="lm-roof" d="M-62 -58L0 -110L62 -58Z" />
                <path class="lm-roof-shade" d="M0 -110L62 -58H34Z" />
                <rect class="lm-window" x="26" y="-50" width="14" height="14" rx="3" />
                <g transform="translate(0 -108)">
                  <path class="lm-gold" d="M-14 2L-17 -16L-7 -7L0 -20L7 -7L17 -16L14 2Z" />
                </g>
              }
              @case ('understanding') {
                <path class="lm-stone" d="M-28 0L-24 -110H24L28 0Z" />
                <path class="lm-stone-shade" d="M10 0L11 -110H24L28 0Z" />
                <path class="lm-roof" d="M-34 -108L0 -144L34 -108Z" />
                <g transform="translate(0 -82)">
                  <circle class="lm-face" r="18" />
                  <rect
                    class="lm-ink"
                    x="-1.6"
                    y="-11"
                    width="3.2"
                    height="12"
                    rx="1.6"
                    transform="rotate(50)"
                  />
                  <g class="lm-tick">
                    <rect class="lm-red" x="-1" y="-15" width="2" height="17" rx="1" />
                  </g>
                  <circle class="lm-ink" r="2.6" />
                </g>
              }
              @case ('communication') {
                <rect class="lm-post" x="-6" y="-58" width="12" height="58" />
                <g transform="translate(-4 -92)">
                  <g class="lm-letter">
                    <rect class="lm-paper" x="-13" y="-12" width="26" height="17" rx="2" />
                    <path class="lm-paper-line" d="M-13 -12L0 -3L13 -12" />
                  </g>
                </g>
                <path class="lm-box" d="M-36 -56V-90C-36 -112 36 -112 36 -90V-56Z" />
                <path class="lm-box-shade" d="M14 -56V-106C28 -102 36 -96 36 -90V-56Z" />
                <rect class="lm-slot" x="-22" y="-88" width="30" height="5" rx="2.5" />
                <g transform="translate(36 -64)">
                  <g class="lm-flag">
                    <rect class="lm-post" x="-2" y="-34" width="4" height="34" />
                    <path class="lm-red" d="M2 -34H22V-22H2Z" />
                  </g>
                </g>
              }
              @case ('optimization') {
                <path class="lm-stone" d="M-26 0L-15 -98H15L26 0Z" />
                <path class="lm-stone-shade" d="M7 0L8 -98H15L26 0Z" />
                <path class="lm-roof" d="M-19 -96Q0 -122 19 -96Z" />
                <rect class="lm-door" x="-9" y="-26" width="18" height="26" rx="7" />
                <g transform="translate(0 -100)">
                  <g class="lm-blades">
                    <path class="lm-blade" d="M-4 0L-9 -54H9L4 0Z" />
                    <path class="lm-blade" d="M-4 0L-9 -54H9L4 0Z" transform="rotate(90)" />
                    <path class="lm-blade" d="M-4 0L-9 -54H9L4 0Z" transform="rotate(180)" />
                    <path class="lm-blade" d="M-4 0L-9 -54H9L4 0Z" transform="rotate(270)" />
                    <circle class="lm-hub" r="7" />
                  </g>
                </g>
              }
              @case ('management') {
                <rect class="lm-stone" x="26" y="-116" width="18" height="64" />
                <g transform="translate(35 -120)">
                  <circle class="lm-smoke" r="10" />
                  <circle class="lm-smoke" r="10" />
                  <circle class="lm-smoke" r="10" />
                </g>
                <path class="lm-brick" d="M-56 0V-54L-34 -72V-54L-12 -72V-54L10 -72V-54H56V0Z" />
                <path class="lm-brick-shade" d="M30 0V-54H56V0Z" />
                <rect class="lm-window" x="-46" y="-44" width="14" height="12" rx="3" />
                <rect class="lm-window" x="-22" y="-44" width="14" height="12" rx="3" />
                <rect class="lm-window" x="2" y="-44" width="14" height="12" rx="3" />
              }
              @case ('advanced') {
                <g transform="translate(0 -124)">
                  <g class="lm-beam">
                    <path d="M0 -5L190 -34V34L0 5Z" fill="url(#sm-g-beam)" />
                  </g>
                </g>
                <path class="lm-white" d="M-24 0L-14 -110H14L24 0Z" />
                <path class="lm-red" d="M-21.8 -24L-19.6 -48H19.6L21.8 -24Z" />
                <path class="lm-red" d="M-17.4 -72L-15.6 -94H15.6L17.4 -72Z" />
                <rect class="lm-stone" x="-21" y="-116" width="42" height="8" rx="3" />
                <rect class="lm-lamp" x="-11" y="-134" width="22" height="18" rx="4" />
                <path class="lm-roof" d="M-16 -134L0 -150L16 -134Z" />
              }
            }
            <g class="lm-ribbon">
              <path class="lm-ribbon-tail" d="M-64 -34L-82 -22L-64 -8ZM64 -34L82 -22L64 -8Z" />
              <rect class="lm-ribbon-band" x="-68" y="-46" width="136" height="44" rx="11" />
              @if (chapterOf(m.chapter).n) {
                <text class="lm-kick" y="-29" text-anchor="middle">
                  CAPÍTULO {{ chapterOf(m.chapter).n }}
                </text>
                <text class="lm-ch" y="-9.5" text-anchor="middle">
                  {{ chapterOf(m.chapter).title }}
                </text>
              } @else {
                <text class="lm-ch" y="-17" text-anchor="middle">
                  {{ chapterOf(m.chapter).title }}
                </text>
              }
            </g>
          </g>
        }

        <!-- El camino -->
        <path #roadEl class="sm-road-edge" [attr.d]="road()" [style.stroke-width]="46 * spec().s" />
        @for (r of chapterRoads(); track r.chapter) {
          <path
            class="sm-road-ch"
            [attr.data-chapter]="r.chapter"
            [attr.d]="r.d"
            [style.stroke-width]="52 * spec().s"
          />
        }
        <path class="sm-road" [attr.d]="road()" [style.stroke-width]="34 * spec().s" />
        <path class="sm-road-dash" [attr.d]="road()" [style.stroke-width]="4 * spec().s" />
        <path class="sm-road-done" [attr.d]="roadDone()" [style.stroke-width]="9 * spec().s" />
        <path #probe class="sm-probe" d="" />

        <!-- Los niveles: una baldosa en el piso por parada, con el ícono pintado arriba -->
        @for (s of spots(); track s.level.id; let i = $index) {
          <g
            class="sm-node"
            [class.is-here]="i === here() && !walking()"
            [class.is-main-spot]="i === here()"
            [attr.data-state]="s.state"
            [attr.data-chapter]="s.level.chapter"
            [attr.transform]="'translate(' + s.x + ' ' + s.y + ') scale(' + spec().s + ')'"
            role="link"
            tabindex="0"
            [attr.aria-label]="ariaFor(s)"
            (click)="go(i)"
            (keydown.enter)="go(i)"
            (keydown.space)="$event.preventDefault(); go(i)"
          >
            @if (i === here()) {
              <ellipse class="sm-here" rx="62" ry="38" />
            }
            <g class="sm-pop">
              <ellipse class="sm-pad-side" cy="9" rx="52" ry="32" />
              <ellipse class="sm-pad" rx="52" ry="32" />
              <ellipse class="sm-pad-hi" cx="-6" cy="-6" rx="34" ry="17" />
              <g
                class="sm-ico"
                transform="translate(0 -3) scale(0.9)"
                stroke-width="4.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                @for (p of s.state === 'locked' ? padlock : s.icon; track $index) {
                  <path
                    [attr.d]="p.d"
                    [attr.fill]="p.kind === 'fill' ? 'currentColor' : 'none'"
                    [attr.stroke]="p.kind === 'line' ? 'currentColor' : null"
                    [attr.transform]="p.rot ? 'rotate(' + p.rot + ')' : null"
                  />
                }
              </g>
              @if (s.state === 'done') {
                <g class="sm-flag" transform="translate(36 -8)">
                  <path class="sm-flag-pole" d="M0 0V-50" />
                  <path class="sm-flag-cloth" d="M1.5 -50L28 -42L1.5 -33Z" />
                </g>
              } @else if (s.state === 'wip') {
                <!-- En obra: un conito al costado -->
                <g class="sm-cone" transform="translate(44 8)">
                  <path class="sm-cone-base" d="M-14 0H14V-5H-14Z" />
                  <path class="sm-cone-body" d="M-10 -5L-3 -34H3L10 -5Z" />
                  <path class="sm-cone-band" d="M-7.4 -15L-5.6 -23H5.6L7.4 -15Z" />
                </g>
              }
            </g>
            <g class="sm-label">
              <rect
                class="sm-name-shadow"
                [attr.x]="-s.plate.w / 2"
                [attr.y]="NAME.top + 4"
                [attr.width]="s.plate.w"
                [attr.height]="s.plate.h"
                [attr.rx]="NAME.r"
              />
              <rect
                class="sm-name-plate"
                [attr.x]="-s.plate.w / 2"
                [attr.y]="NAME.top"
                [attr.width]="s.plate.w"
                [attr.height]="s.plate.h"
                [attr.rx]="NAME.r"
              />
              <text class="sm-name" [attr.y]="NAME.base" text-anchor="middle">
                @for (line of s.name; track $index) {
                  <tspan x="0" [attr.dy]="$index ? NAME.lh : 0">{{ line }}</tspan>
                }
              </text>
            </g>
          </g>
        }

        <!-- Main -->
        <g #hero class="sm-hero" aria-hidden="true" (pointerdown)="poke($event)">
          <g [attr.transform]="'scale(' + heroScale() + ')'">
            <ellipse class="sm-contact sm-h-contact" rx="94" ry="13" />
            <g #hop>
              <g #spring>
                <g #body>
                  <ellipse class="sm-h-dark" cx="-38" cy="-2" rx="28" ry="12" />
                  <ellipse class="sm-h-dark" cx="44" cy="-2" rx="28" ry="12" />
                  <path [attr.d]="mainBody" fill="url(#sm-g-main)" />
                  <path
                    class="sm-h-shine"
                    d="M-70 -80C-76 -132 -52 -178 -14 -194C-48 -168 -62 -128 -58 -84Z"
                  />
                  <ellipse class="sm-h-belly" cx="10" cy="-58" rx="50" ry="40" />
                  <rect class="sm-h-badge" x="-22" y="-72" width="64" height="24" rx="12" />
                  <text class="sm-h-badge-text" x="10" y="-55" text-anchor="middle">main</text>
                  <g transform="translate(-80 -96)">
                    <path class="sm-h-arm" d="M0 0C-16 10 -22 22 -14 34" />
                    <circle class="sm-h-dark" cx="-13" cy="36" r="13" />
                  </g>
                  <g transform="translate(84 -96)">
                    <path class="sm-h-arm" d="M0 0C16 10 22 22 14 34" />
                    <circle class="sm-h-dark" cx="13" cy="36" r="13" />
                  </g>
                  <g transform="translate(14 -140)">
                    @for (e of eyes; track e.x) {
                      <g [attr.transform]="'translate(' + e.x + ' ' + e.y + ')'">
                        <g class="sm-h-lid">
                          <ellipse class="sm-h-white" [attr.rx]="e.r" [attr.ry]="e.r * 1.12" />
                          <g class="sm-h-pupil">
                            <circle class="sm-h-ink" [attr.r]="e.r * 0.52" />
                            <circle
                              class="sm-h-white"
                              [attr.cx]="e.r * 0.2"
                              [attr.cy]="-e.r * 0.24"
                              [attr.r]="e.r * 0.18"
                            />
                          </g>
                        </g>
                      </g>
                    }
                    <path class="sm-h-brow" d="M-42 -24Q-30 -32 -16 -26" />
                    <path class="sm-h-brow" d="M12 -30Q28 -38 44 -30" />
                    <ellipse class="sm-h-cheek" cx="-40" cy="26" rx="12" ry="6" />
                    <ellipse class="sm-h-cheek" cx="50" cy="24" rx="13" ry="6" />
                    <path class="sm-h-mouth" d="M-8 28Q6 42 20 28" />
                  </g>
                  <g transform="translate(10 -204)">
                    <path class="sm-h-gold" d="M-38 4L-44 -34L-20 -14L0 -44L20 -14L44 -34L38 4Z" />
                    <path class="sm-h-gold-dark" d="M-38 4L38 4L37 -4L-37 -4Z" />
                    <circle class="sm-h-gem" cy="-8" r="5" />
                  </g>
                </g>
              </g>
            </g>
          </g>
          <text
            #say
            class="sm-say"
            text-anchor="middle"
            [attr.x]="sayDx()"
            [attr.y]="playCramped() ? 70 * spec().s : -262 * heroScale() - sayLift()"
            [attr.font-size]="28 * spec().s"
          >
            {{ heroSays() }}
          </text>
        </g>

        <g #fx class="sm-fx" aria-hidden="true"></g>
      </svg>

      <div class="sm-vignette" aria-hidden="true"></div>

      <header class="sm-title">
        <p class="sm-brand">Web Worker Patterns</p>
        <h1>La historia de main</h1>
        <p class="sm-tag">Ayudá a main a no congelarse.</p>
      </header>

      <!-- Jugar: arriba de la cabeza de main, lo sigue de parada en parada -->
      <button
        #play
        type="button"
        class="sm-play"
        [class.is-away]="walking() || night()"
        [style.left.px]="playAt().x"
        [style.top.px]="playAt().y"
        [attr.aria-label]="playLabel() + ': ' + next().title"
        (click)="go(here())"
      >
        <story-play [label]="playLabel()" [caption]="playCramped() ? undefined : next().title" />
      </button>
      <p class="sm-sr" aria-live="polite">{{ status() }}</p>

      @if (night() && nightScene(); as n) {
        <story-dawn
          [scene]="n"
          [at]="nightPlayAt()"
          [level]="next().title"
          (woke)="onWoke()"
          (lit)="onLit()"
        />
      }
    </section>
  `,
  styleUrl: './story-map.component.scss',
})
export class StoryMapComponent {
  private readonly router = inject(Router);
  private readonly progress = inject(StoryProgress);
  private readonly themeId = inject(ThemeService).activeId;
  private readonly stageRef = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly playRef = viewChild.required<ElementRef<HTMLButtonElement>>('play');
  private readonly worldRef = viewChild.required<ElementRef<SVGSVGElement>>('world');
  private readonly heroRef = viewChild.required<ElementRef<SVGGElement>>('hero');
  private readonly hopRef = viewChild.required<ElementRef<SVGGElement>>('hop');
  private readonly springRef = viewChild.required<ElementRef<SVGGElement>>('spring');
  private readonly bodyRef = viewChild.required<ElementRef<SVGGElement>>('body');
  private readonly sayRef = viewChild.required<ElementRef<SVGTextElement>>('say');
  private readonly roadRef = viewChild.required<ElementRef<SVGPathElement>>('roadEl');
  private readonly probeRef = viewChild.required<ElementRef<SVGPathElement>>('probe');
  private readonly fxRef = viewChild.required<ElementRef<SVGGElement>>('fx');
  private readonly dawnCmp = viewChild(StoryDawnComponent);

  protected readonly mainBody = MAIN_BODY;
  protected readonly NAME = NAME;
  /** Lo que se ve en una baldosa bloqueada, en lugar del ícono de su caso. */
  protected readonly padlock: readonly IconPart[] = [
    { kind: 'line', d: 'M-9 -2V-9C-9 -21 9 -21 9 -9V-2' },
    { kind: 'fill', d: 'M-15 -3H15V18H-15Z' },
  ];
  protected readonly star =
    'M0 -11L3.2 -3.4L11 -3.4L4.6 1.5L6.9 9.8L0 4.9L-6.9 9.8L-4.6 1.5L-11 -3.4L-3.2 -3.4Z';
  protected readonly eyes = [
    { x: -28, y: 2, r: 15 },
    { x: 28, y: 0, r: 19 },
  ];

  protected readonly shape = signal<MapShape>('wide');
  protected readonly spec = computed(() => MAP_SPECS[this.shape()]);
  private readonly points = computed(() => mapSpots(this.spec()));
  protected readonly heroScale = computed(
    () => this.spec().s * (this.shape() === 'tall' ? 0.4 : 0.48),
  );
  protected readonly art = computed(() => (this.shape() === 'tall' ? 1.3 : 1.12));

  protected readonly spots = computed<Spot[]>(() => {
    const isDone = (id: string) => this.progress.isDone(id);
    const at = this.points();
    return LEVELS.map((level, i) => {
      const name = wrapWords(level.title, this.spec().chars);
      return {
        level,
        x: at[i].x,
        y: at[i].y,
        state: levelState(level, isDone),
        name,
        plate: plateFor(name),
        icon: levelIcon(level.id),
      };
    });
  });

  /** Índice del nivel donde está main (el que toca jugar). */
  protected readonly here = computed(() => {
    const cur = currentLevel((id) => this.progress.isDone(id));
    return LEVELS.findIndex((l) => l.id === cur.id);
  });

  protected readonly road = computed(() => roadPath(this.points(), this.spec()));
  protected readonly roadDone = computed(() => roadPath(this.points(), this.spec(), this.here()));
  protected readonly chapterRoads = computed(() => chapterRoads(this.points(), this.spec()));
  protected readonly marks = computed(() => landmarks(this.points(), this.spec()));

  protected readonly trees = computed(() => {
    const { s } = this.spec();
    return scatter(this.spec(), this.points(), this.shape() === 'tall' ? 46 : 64, 7, {
      node: 150 * s,
      road: 62 * s,
      landmark: 110 * s,
    });
  });
  protected readonly tufts = computed(() => {
    const { s } = this.spec();
    return scatter(this.spec(), this.points(), 110, 3, {
      node: 84 * s,
      road: 32 * s,
      landmark: 70 * s,
    });
  });

  protected readonly far = computed(() => {
    const { view, horizon, s } = this.spec();
    const from = -view.w * 2;
    const to = view.w * 3;
    return [
      ridge(5, horizon - 10, 150 * s, from, to, 210 * s),
      ridge(9, horizon + 14, 80 * s, from, to, 150 * s),
      ridge(2, horizon + 46, 26 * s, from, to, 240 * s),
      ridge(11, horizon + 150 * s, 30 * s, from, to, 300 * s),
    ];
  });
  protected readonly sun = computed(() => {
    const { view, horizon, s } = this.spec();
    return { x: view.w * 0.62, y: horizon - 150 * s };
  });
  protected readonly clouds = computed(() => {
    const { view, horizon, s } = this.spec();
    return Array.from({ length: 7 }, (_, i) => ({
      d: cloudPath(
        -200 + hash(i, 21) * (view.w + 400),
        70 * s + hash(i, 22) * (horizon - 190 * s),
        (130 + hash(i, 23) * 150) * s,
      ),
      dur: 26 + hash(i, 24) * 30,
      delay: -hash(i, 25) * 30,
    }));
  });
  protected readonly birds = computed(() => {
    const { horizon, s } = this.spec();
    const y = horizon * 0.42;
    return [0, 1, 2].map((i) => {
      const x = -300 + i * 46 * s;
      const by = y + (i % 2) * 22 * s;
      const w = 12 * s;
      return `M${x - w} ${by - 4 * s}Q${x - w / 2} ${by - 9 * s} ${x} ${by}Q${x + w / 2} ${by - 9 * s} ${x + w} ${by - 4 * s}`;
    });
  });

  protected readonly heroSays = signal('');
  protected readonly sayDx = signal(0);
  protected readonly status = signal('');
  /** El nivel que toca jugar: el que nombra el botón de arriba de main. */
  protected readonly next = computed(() => LEVELS[this.here()]);
  protected readonly playLabel = computed(() =>
    this.progress.isDone(this.next().id) ? 'Repetir' : '¡Jugar!',
  );
  /**
   * Dónde va el botón, en píxeles de la escena: arriba de la cabeza de main
   * (es el punto donde apoya su borde de abajo), para que se vea bien a qué
   * nivel entra.
   */
  protected readonly playAt = signal({ x: 0, y: 0 });
  /** El cartel de la noche va en el medio de lo que se ve: es lo único para hacer. */
  protected readonly nightPlayAt = signal({ x: 0, y: 0 });
  /** Cuánto sube lo que dice main para no quedar detrás del botón, en unidades del viewBox. */
  protected readonly sayLift = signal(0);
  /**
   * Entre el título y la corona no entra la medalla entera (la primera
   * parada): va sin el nombre del nivel, que vuelve a su lugar bajo main, y
   * lo que dice main sale ahí abajo en vez de arriba, donde está el título.
   */
  protected readonly playCramped = signal(false);
  protected readonly walking = signal(false);
  /** De noche hasta el primer toque: main duerme y solo se ve el play. */
  protected readonly night = signal(StoryDawnComponent.needed());
  /** Dónde duerme main, en el viewBox: lo fija `placePlay` (main no es un signal). */
  private readonly sleeperAt = signal<Point | null>(null);
  /** Lo que la noche necesita del mundo para dibujarse encima, en su mismo viewBox. */
  protected readonly nightScene = computed<NightScene | null>(() => {
    const hero = this.sleeperAt();
    if (!hero) return null;
    const { view, horizon, s } = this.spec();
    return {
      view,
      horizon,
      s,
      skyline: this.far()[0],
      moon: this.sun(),
      hero: { ...hero, scale: this.heroScale() },
      marks: this.marks(),
      art: this.art(),
    };
  });

  private calm = false;
  private moving = false;
  private heroAt = -1;
  private readonly hp: Point = { x: 0, y: 0 };
  private readonly sq = spring(260, 11);
  private readonly rot = spring(130, 10);
  private gctx?: gsap.Context;
  private walk?: { tween: gsap.core.Tween; finish: () => void };
  private hopLoop?: gsap.core.Tween;
  private sayCall?: gsap.core.Tween;
  private statusCall?: gsap.core.Tween;
  private blinkCall?: gsap.core.Tween;
  private lookUntil = 0;
  private pokeTimes: number[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mq = matchMedia('(max-aspect-ratio: 1/1)');
      const onMq = () => {
        this.shape.set(mq.matches ? 'tall' : 'wide');
        // Otro trazado, otras posiciones: si iba caminando, llega de una.
        this.walk?.finish();
        this.placeHero(this.heroAt < 0 ? this.here() : this.heroAt);
      };
      mq.addEventListener('change', onMq);
      onMq();
      // El botón vive en HTML: se recoloca cuando cambia el tamaño de la escena.
      const ro = new ResizeObserver(() => this.placePlay());
      ro.observe(this.stageRef().nativeElement);

      this.gctx = gsap.context(() => {
        gsap.set(this.bodyRef().nativeElement, { svgOrigin: '0 0' });
        gsap.set(this.worldRef().nativeElement.querySelectorAll('.sm-h-lid'), {
          transformOrigin: '50% 50%',
        });
        if (!this.calm) {
          gsap.to(this.bodyRef().nativeElement, {
            scaleY: 1.03,
            scaleX: 0.985,
            duration: 1.3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
          this.blink();
        }
        if (this.night()) this.lids(0.1);
      }, this.worldRef().nativeElement);
      gsap.ticker.add(this.tick);

      if (this.night()) {
        // En el próximo cuadro la noche ya está pintada y el mundo tiene su
        // forma: recién ahí se mide su play (más ancho) y se le da el foco.
        requestAnimationFrame(() => {
          this.placePlay();
          this.dawnCmp()?.focus();
        });
      } else this.greet();
      if (this.shape() === 'tall' && this.here() > 2) {
        this.heroRef().nativeElement.scrollIntoView({ block: 'center' });
      }

      destroyRef.onDestroy(() => {
        mq.removeEventListener('change', onMq);
        ro.disconnect();
        gsap.ticker.remove(this.tick);
        for (const t of [
          this.walk?.tween,
          this.hopLoop,
          this.sayCall,
          this.statusCall,
          this.blinkCall,
        ])
          t?.kill();
        this.gctx?.revert();
      });
    });
  }

  private greet(): void {
    const fresh = this.here() === 0 && !this.progress.isDone(LEVELS[0].id);
    this.say(fresh ? '¡Hola! ¿Me acompañás?' : '¡Seguimos!');
  }

  /** Cierra (0.1) o abre (1) los ojos de main. */
  private lids(scaleY: number): void {
    const lids = this.worldRef().nativeElement.querySelectorAll('.sm-h-lid');
    if (this.calm || scaleY < 1) {
      gsap.set(lids, { scaleY });
      return;
    }
    this.anim(() =>
      gsap
        .timeline()
        .to(lids, { scaleY: 1.3, duration: 0.08, ease: 'power2.out', overwrite: 'auto' })
        .to(lids, { scaleY: 1, duration: 0.3, ease: 'back.out(2)' }),
    );
  }

  /** Tocaron el play de la noche (o en otro lado): main abre los ojos de golpe. */
  protected onWoke(): void {
    this.lids(1);
    this.sq.v += 3;
    this.greet();
  }

  /**
   * Ya amaneció: se quita la noche y queda el mapa. Ni con el play se entra
   * solo a un nivel: el alumno elige desde el mapa (el foco va al jugar de main).
   */
  protected onLit(): void {
    this.night.set(false);
    this.playRef().nativeElement.focus({ preventScroll: true });
  }

  protected chapterOf(key: Level['chapter']) {
    return CHAPTERS.find((c) => c.key === key)!;
  }

  protected ariaFor(s: Spot): string {
    const what = { locked: 'bloqueado', open: 'para jugar', done: 'superado', wip: 'en obra' };
    const ch = this.chapterOf(s.level.chapter);
    const where = ch.n ? `capítulo ${ch.n}, ${ch.title}` : ch.title;
    return `Nivel ${s.level.n}: ${s.level.title} (${where}), ${what[s.state]}`;
  }

  protected go(i: number): void {
    if (this.moving || this.night()) return;
    const spot = this.spots()[i];
    if (spot.state === 'locked') {
      const prev = LEVELS.slice(0, i)
        .reverse()
        .find((l) => l.scene);
      this.tell(`Todavía no: primero superá «${prev?.title ?? 'el nivel anterior'}».`);
      this.say('¡todavía no!');
      this.wiggle(i);
      this.rot.v += 220;
      return;
    }
    this.tell(
      spot.state === 'wip'
        ? `«${spot.level.title}» todavía está en obra: se abre la versión clásica.`
        : `Vamos a «${spot.level.title}».`,
    );
    this.moving = true;
    this.walking.set(true);
    void this.walkTo(i).then(() => {
      const enter = () => {
        this.moving = false;
        this.walking.set(false);
        void this.router.navigate(['/t', this.themeId(), 'example', spot.level.id]);
      };
      if (this.calm) enter();
      else this.anim(() => gsap.delayedCall(0.28, enter));
    });
  }

  /** Un aviso pasajero para el lector de pantalla; en pantalla lo dice main. */
  private tell(text: string): void {
    this.status.set(text);
    this.statusCall?.kill();
    this.statusCall = gsap.delayedCall(4, () => this.status.set(''));
  }

  /** Main camina por el camino, dando saltitos, hasta el nivel elegido. */
  private walkTo(target: number): Promise<void> {
    const from = this.heroAt;
    if (this.calm || from < 0 || from === target) {
      this.placeHero(target);
      if (!this.calm) this.arrive(target);
      return Promise.resolve();
    }
    const cum = this.lengths();
    const road = this.roadRef().nativeElement;
    const st = { at: cum[from] };
    const dist = Math.abs(cum[target] - cum[from]);
    const s = this.spec().s;
    const hop = this.hopRef().nativeElement;
    return new Promise((resolve) => {
      this.anim(() => {
        this.hopLoop = gsap.to(hop, {
          y: -34,
          duration: 0.13,
          ease: 'power1.out',
          yoyo: true,
          repeat: -1,
        });
        let lastX = this.hp.x;
        const tween = gsap.to(st, {
          at: cum[target],
          duration: clamp(dist / (820 * s), 0.5, 2.4),
          ease: 'power1.inOut',
          onUpdate: () => {
            const p = road.getPointAtLength(st.at);
            this.moveHero(p.x, p.y);
            const dx = p.x - lastX;
            lastX = p.x;
            if (Math.abs(dx) > 0.5) this.rot.t = Math.sign(dx) * 7;
            this.lookToward(Math.sign(dx) * 6, 0);
          },
          onComplete: () => finish(),
        });
        const finish = () => {
          if (!this.walk) return;
          this.walk = undefined;
          tween.kill();
          this.hopLoop?.kill();
          gsap.to(hop, { y: 0, duration: 0.08, overwrite: 'auto' });
          this.rot.t = 0;
          this.placeHero(target);
          this.arrive(target);
          resolve();
        };
        this.walk = { tween, finish };
      });
    });
  }

  /** Largo del camino desde el primer nivel hasta cada uno. */
  private lengths(): number[] {
    const probe = this.probeRef().nativeElement;
    const pts = this.points();
    const cum = [0];
    segments(pts, this.spec()).forEach((g, i) => {
      probe.setAttribute('d', `M${g.a.x} ${g.a.y}${segmentTail(g)}`);
      cum.push(cum[i] + probe.getTotalLength());
    });
    return cum;
  }

  /** Al llegar: se aplasta, levanta polvo y el nivel rebota bajo sus pies. */
  private arrive(i: number): void {
    this.sq.v += 3.2;
    const s = this.spec().s;
    for (let k = 0; k < 6; k++) {
      const side = k % 2 ? 1 : -1;
      this.puff(this.hp.x + side * 18 * s, this.hp.y, side * (30 + k * 9) * s, (10 + k * 3) * s);
    }
    const pop = this.nodePop(i);
    if (pop) {
      this.anim(() =>
        gsap.fromTo(
          pop,
          { scaleX: 1.14, scaleY: 0.86, svgOrigin: '0 0' },
          {
            scaleX: 1,
            scaleY: 1,
            duration: 0.45,
            ease: 'elastic.out(1.1, 0.35)',
            overwrite: 'auto',
          },
        ),
      );
    }
  }

  private wiggle(i: number): void {
    const pop = this.nodePop(i);
    if (!pop || this.calm) return;
    this.anim(() =>
      gsap.fromTo(
        pop,
        { rotation: -12, svgOrigin: '0 0' },
        { rotation: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.25)', overwrite: 'auto' },
      ),
    );
  }

  private nodePop(i: number): Element | null {
    return this.worldRef().nativeElement.querySelectorAll('.sm-node .sm-pop')[i] ?? null;
  }

  private placeHero(i: number): void {
    const p = this.points()[i];
    if (!p) return;
    this.heroAt = i;
    this.moveHero(p.x, p.y);
    this.placePlay();
  }

  /**
   * Lleva el botón arriba de la cabeza de main y el cartel de la noche al
   * medio de lo que se ve, sin que el botón se salga por los costados.
   */
  private placePlay(): void {
    const m = this.worldRef().nativeElement.getScreenCTM();
    if (!m) return;
    const box = this.stageRef().nativeElement.getBoundingClientRect();
    const play = this.playRef().nativeElement;
    const placed = (y: number, width: number) => {
      const p = new DOMPoint(this.hp.x, y).matrixTransform(m);
      const half = width / 2;
      return { x: clamp(p.x - box.left, half + 8, box.width - half - 8), y: p.y - box.top };
    };
    // El borde de abajo del botón queda un poco por encima de la corona. Si
    // así se metiera debajo del título, primero deja el nombre del nivel y,
    // si aun así no entra, baja hasta salir de las letras.
    const crown = placed(this.hp.y - 258 * this.heroScale(), play.offsetWidth);
    // Las puntas de la cinta pueden asomar bajo una letra: se mide sin ellas.
    const half = play.offsetWidth / 2 - 14;
    const top = this.titleBottom(crown.x - half, crown.x + half);
    // `clientHeight` y no el rectángulo: mientras se esconde, el botón está achicado.
    const art = play.querySelector('svg')?.clientHeight ?? play.offsetHeight;
    const cramped = crown.y - top - 4 < art + CAPTION_H;
    const height = cramped ? art : art + CAPTION_H;
    const bottom = Math.max(crown.y, top + 4 + height);
    this.playCramped.set(cramped);
    this.playAt.set({ x: crown.x, y: bottom });
    this.sayLift.set((crown.y - bottom + height + 6) / m.d);
    if (this.night()) {
      // El cartel de la noche va en el medio de lo que se ve de la escena: es
      // lo único que hay para hacer, no tiene que buscarse junto a main.
      const dawnPlay = this.stageRef().nativeElement.querySelector<HTMLElement>('.sd-play');
      const seenTop = Math.max(box.top, 0);
      const seenBottom = Math.min(box.bottom, innerHeight);
      const middle = (seenTop + seenBottom) / 2 - box.top;
      this.nightPlayAt.set({
        x: box.width / 2,
        y: Math.max(8, middle - (dawnPlay?.offsetHeight ?? 0) / 2),
      });
      this.sleeperAt.set({ x: this.hp.x, y: this.hp.y });
    }
  }

  /**
   * Dónde terminan las letras del título entre `left` y `right`, en píxeles
   * de la escena. Mide el texto y no las cajas: el subtítulo es más corto que
   * el título y su caja ocupa todo el ancho.
   */
  private titleBottom(left: number, right: number): number {
    const box = this.stageRef().nativeElement.getBoundingClientRect();
    const range = document.createRange();
    let bottom = -Infinity;
    for (const line of this.stageRef().nativeElement.querySelectorAll('.sm-title > *')) {
      range.selectNodeContents(line);
      const r = range.getBoundingClientRect();
      if (r.right - box.left > left && r.left - box.left < right) {
        bottom = Math.max(bottom, r.bottom - box.top);
      }
    }
    return bottom;
  }

  private moveHero(x: number, y: number): void {
    this.hp.x = x;
    this.hp.y = y;
    gsap.set(this.heroRef().nativeElement, { x, y });
  }

  // ── Vida y toques ──

  /** Los resortes del cuerpo: aplastar (conservando el volumen) y girar desde los pies. */
  private readonly tick = (_time: number, delta: number) => {
    const springs = [this.sq, this.rot];
    if (springs.every((s) => Math.abs(s.v) < 0.001 && Math.abs(s.x - s.t) < 0.001)) return;
    const h = Math.min(delta / 1000, 0.034) / 2;
    for (let n = 0; n < 2; n++) {
      for (const s of springs) {
        s.v += (-(s.x - s.t) * s.k - s.v * s.d) * h;
        s.x += s.v * h;
      }
    }
    const sq = clamp(this.sq.x, -0.3, 0.3);
    this.springRef().nativeElement.setAttribute(
      'transform',
      `rotate(${this.rot.x.toFixed(2)}) scale(${(1 + sq * 0.82).toFixed(3)} ${(1 - sq).toFixed(3)})`,
    );
  };

  private blink(): void {
    this.blinkCall = gsap.delayedCall(2 + Math.random() * 3.5, () => {
      this.anim(() =>
        gsap.to(this.worldRef().nativeElement.querySelectorAll('.sm-h-lid'), {
          scaleY: 0.1,
          duration: 0.06,
          ease: 'power1.in',
          yoyo: true,
          repeat: 1,
        }),
      );
      this.blink();
    });
  }

  /** Tocar a main: suma velocidad a los resortes según dónde cayó el toque. */
  protected poke(e: PointerEvent): void {
    e.stopPropagation();
    const p = this.toWorld(e);
    const sc = this.heroScale();
    const lx = (p.x - this.hp.x) / sc;
    const ly = (this.hp.y - p.y) / sc;
    const side = clamp(lx / 90, -1, 1);
    const high = clamp(ly / 220, 0, 1);
    this.rot.v += side * (140 + high * 160);
    this.sq.v += 2 + (1 - high) * 2.5;
    const now = performance.now();
    this.pokeTimes = [...this.pokeTimes.filter((t) => now - t < 3000), now];
    if (this.pokeTimes.length >= 6) {
      this.pokeTimes = [];
      this.sq.v += 5;
      this.say('¡basta, que tengo mucho que hacer!');
    } else {
      this.word(p, POKES[this.pokeTimes.length % POKES.length]);
    }
  }

  /** Tocar el mundo: en la tierra brota una flor; en el cielo, un destello. Main mira ahí. */
  protected tap(e: PointerEvent): void {
    const t = e.target as Element;
    if (t.closest('.sm-node, .sm-hero')) return;
    const p = this.toWorld(e);
    this.lookAt(p, 1200);
    if (p.y < this.spec().horizon) this.sparkle(p);
    else this.flower(p);
  }

  protected look(e: PointerEvent): void {
    if (this.moving || performance.now() < this.lookUntil) return;
    this.lookAt(this.toWorld(e));
  }

  private lookAt(p: Point, hold = 0): void {
    if (hold) this.lookUntil = performance.now() + hold;
    const head = this.hp.y - 150 * this.heroScale();
    this.lookToward(
      clamp((p.x - this.hp.x) / 260, -1, 1) * 6,
      clamp((p.y - head) / 260, -1, 1) * 5,
    );
  }

  private lookToward(x: number, y: number): void {
    if (this.calm) return;
    const pupils = this.worldRef().nativeElement.querySelectorAll('.sm-h-pupil');
    this.anim(() =>
      gsap.to(pupils, { x, y, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }),
    );
  }

  private say(text: string): void {
    const { view, s } = this.spec();
    const half = text.length * 0.3 * 28 * s;
    this.sayDx.set(clamp(this.hp.x, half + 20, view.w - half - 20) - this.hp.x);
    this.heroSays.set(text);
    this.sayCall?.kill();
    this.sayCall = gsap.delayedCall(2.6, () => this.heroSays.set(''));
    if (!this.calm) {
      this.anim(() =>
        gsap.fromTo(
          this.sayRef().nativeElement,
          { opacity: 0, y: 20 * s, scale: 0.86, transformOrigin: '50% 100%' },
          { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(2.2)', overwrite: 'auto' },
        ),
      );
    }
  }

  // ── Efectos sueltos: se crean, se animan y se van ──

  private fx(tag: string, attrs: Record<string, string | number>): SVGElement {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    this.fxRef().nativeElement.appendChild(n);
    return n;
  }

  private gone(n: Element, tween: gsap.TweenVars): void {
    if (this.calm) {
      gsap.delayedCall(1.2, () => n.remove());
      return;
    }
    this.anim(() => gsap.to(n, { ...tween, onComplete: () => n.remove() }));
  }

  private word(p: Point, text: string): void {
    const s = this.spec().s;
    const n = this.fx('text', {
      class: 'sm-fx-word',
      x: p.x,
      y: p.y,
      'text-anchor': 'middle',
      'font-size': 30 * s,
    });
    n.textContent = text;
    this.gone(n, { y: -70 * s, opacity: 0, duration: 0.8, ease: 'power2.out' });
  }

  private puff(x: number, y: number, dx: number, dy: number): void {
    if (this.calm) return;
    const s = this.spec().s;
    const n = this.fx('circle', { class: 'sm-fx-dust', cx: x, cy: y, r: 9 * s });
    this.gone(n, {
      x: dx,
      y: -dy,
      scale: 1.8,
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out',
      transformOrigin: '50% 50%',
    });
  }

  private flower(p: Point): void {
    const s = this.spec().s;
    const near = this.points().reduce(
      (best, q, i) => {
        const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
        return d < best.d ? { i, d } : best;
      },
      { i: 0, d: Infinity },
    );
    const fx = this.fxRef().nativeElement;
    while (fx.querySelectorAll('.sm-fx-flower').length > 14)
      fx.querySelector('.sm-fx-flower')?.remove();
    const g = this.fx('g', {
      class: 'sm-fx-flower',
      'data-chapter': LEVELS[near.i].chapter,
      transform: `translate(${p.x} ${p.y}) scale(${1.6 * s})`,
    });
    const inner = document.createElementNS(NS, 'g');
    g.appendChild(inner);
    const petals = [
      [-6, -14],
      [6, -14],
      [0, -22],
      [0, -7],
    ];
    inner.innerHTML =
      '<path class="sm-fx-stem" d="M0 0Q-2 -6 0 -12"/>' +
      petals.map(([x, y]) => `<circle class="sm-fx-petal" cx="${x}" cy="${y}" r="6"/>`).join('') +
      '<circle class="sm-fx-eye" cy="-14" r="4"/>';
    if (this.calm) {
      gsap.delayedCall(2.5, () => g.remove());
      return;
    }
    this.anim(() => {
      gsap
        .timeline({ onComplete: () => g.remove() })
        .fromTo(
          inner,
          { scale: 0, svgOrigin: '0 0' },
          { scale: 1, duration: 0.35, ease: 'back.out(2.5)' },
        )
        .to(inner, { rotation: 8, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 3 })
        .to(inner, { scale: 0, duration: 0.3, ease: 'power2.in' }, '+=0.4');
    });
    // Si brota al lado de main, se sobresalta.
    if (Math.hypot(p.x - this.hp.x, p.y - this.hp.y) < 140 * s) {
      this.sq.v -= 2.5;
      this.say('¡uy, una flor!');
    }
  }

  private sparkle(p: Point): void {
    const s = this.spec().s;
    const n = this.fx('path', {
      class: 'sm-fx-spark',
      d: this.star,
      transform: `translate(${p.x} ${p.y}) scale(${2 * s})`,
    });
    if (this.calm) {
      gsap.delayedCall(1, () => n.remove());
      return;
    }
    this.anim(() =>
      gsap
        .timeline({ onComplete: () => n.remove() })
        .fromTo(
          n,
          { scale: 0, rotation: -40, transformOrigin: '50% 50%' },
          { scale: 2 * s, rotation: 0, duration: 0.3, ease: 'back.out(3)' },
        )
        .to(n, { scale: 0, opacity: 0, duration: 0.45, ease: 'power2.in' }, '+=0.2'),
    );
  }

  private toWorld(e: PointerEvent): Point {
    const m = this.worldRef().nativeElement.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  /** Toda animación creada después del arranque entra al contexto, para revertirla al salir. */
  private anim(fn: () => void): void {
    if (this.gctx) this.gctx.add(fn);
    else fn();
  }
}
