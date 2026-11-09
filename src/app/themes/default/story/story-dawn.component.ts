import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import gsap from 'gsap';
import { readStored } from '../../../core/utils/safe-storage';
import { pageWasTouched, playChime, SOUND_KEY } from './story.audio';
import { StoryLanternSignComponent } from './story-lantern-sign.component';
import { cloudPath, hash, Landmark, Point } from './story.map';

/** Cómo se despertó: con el play o tocando en otro lado (cambia cómo se hunde el cartel). */
export type DawnBy = 'play' | 'tap';

/**
 * Lo que la noche necesita saber del mapa, en unidades del viewBox del mundo:
 * las capas de la noche usan el mismo viewBox, así que caen justo encima.
 */
export interface NightScene {
  view: { w: number; h: number };
  /** Escala del dibujo (más grande en el celular parado). */
  s: number;
  horizon: number;
  /** La cresta de las montañas lejanas: de ahí para arriba es cielo. */
  skyline: string;
  /** Donde de día está el sol: ahí duerme la luna y de ahí nace el amanecer. */
  moon: Point;
  /** Los pies de main y su escala. */
  hero: Point & { scale: number };
  /** Los hitos de cada capítulo, para prenderles las ventanas. */
  marks: readonly Landmark[];
  /** Escala de los hitos. */
  art: number;
}

/** Ya amaneció en esta página: volver al mapa (desde un nivel) no repite la noche. */
let dawned = false;

/** Una estrella fugaz cada tantos segundos. */
const SHOOTING_EVERY = 9;
/** Un destello de cuatro puntas, para las estrellas grandes. */
const SPARKLE = 'M0 -10Q1.2 -1.2 10 0Q1.2 1.2 0 10Q-1.2 1.2 -10 0Q-1.2 -1.2 0 -10Z';
/** Las gotas de la burbuja al reventar: hacia dónde sale cada una. */
const DROPS = [-150, -110, -70, -30, 10, 50, 120].map((deg, i) => {
  const a = (deg * Math.PI) / 180;
  const d = 70 + (i % 3) * 22;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 3 + (i % 2) * 2 };
});

/**
 * La entrada al juego: el mapa de noche. La luna duerme con su gorro donde de
 * día está el sol, titilan las estrellas, pasa alguna fugaz, las ventanas de
 * los hitos están encendidas, el faro barre y hay luciérnagas. Main ronca con
 * una burbuja que se infla y se desinfla. Lo único que brilla de verdad es el
 * play en el medio de la pantalla: el cartel de `story-lantern-sign`, con
 * su farol prendido.
 *
 * Tocarlo da el toque que el navegador pide para dejar sonar (suena un arpegio
 * que lo confirma) y arranca una cadena: la burbuja revienta, main se
 * despierta, la luna abre los ojos sorprendida y se hunde tras las montañas, y
 * desde ahí entra el día, con un borde rosado y dorado, mientras las estrellas
 * se apagan y las luciérnagas se van. Tocar en cualquier otro lado también
 * amanece, pero se queda en el mapa para elegir.
 *
 * Capas, todas con el viewBox del mundo:
 *  - `sd-tint` multiplica: el suelo queda en azul de luna, más claro alrededor
 *    de main (y es la que recibe el toque "en cualquier lado").
 *  - `sd-night` tapa: el cielo de noche, recortado por la cresta para que la
 *    luna se esconda detrás de las montañas; y la burbuja y las "z" de main.
 *  - `sd-glow` aclara (screen): ventanas, faro, luciérnagas, el charco de luz
 *    de main y el borde del amanecer.
 * El amanecer es un agujero que crece en la máscara `sd-m-hole`, compartida.
 *
 * Eventos: `woke` cuando revienta la burbuja (el mapa abre los ojos de main) y
 * `lit` cuando la luz ya llenó el mapa (el mapa quita la noche).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-dawn',
  imports: [StoryLanternSignComponent],
  host: {
    class: 'sd',
    '(click)': 'wake($event, "tap")',
    '(window:keydown)': 'keyboard.set(true)',
  },
  template: `
    <svg
      #tint
      class="sd-tint"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <!-- La máscara mide la luminancia en linearRGB: estos grises dan un
             borde parejo (sin ellos, la noche se ve solo en la orilla). -->
        <radialGradient id="sd-g-hole">
          <stop offset="0.6" stop-color="#000" />
          <stop offset="0.7" stop-color="#878787" />
          <stop offset="0.8" stop-color="#bababa" />
          <stop offset="0.9" stop-color="#e0e0e0" />
          <stop offset="1" stop-color="#fff" />
        </radialGradient>
        <mask
          id="sd-m-hole"
          maskUnits="userSpaceOnUse"
          x="-8000"
          y="-8000"
          width="24000"
          height="24000"
        >
          <rect x="-8000" y="-8000" width="24000" height="24000" fill="#fff" />
          <circle
            #hole
            [attr.cx]="sc().moon.x"
            [attr.cy]="sc().moon.y"
            r="0"
            fill="url(#sd-g-hole)"
          />
        </mask>
        <radialGradient
          id="sd-g-moonlight"
          gradientUnits="userSpaceOnUse"
          [attr.cx]="sc().hero.x"
          [attr.cy]="sc().hero.y - 80 * sc().s"
          [attr.r]="sc().view.w * 0.8"
        >
          <stop offset="0" stop-color="#d9dcf6" />
          <stop offset="0.22" stop-color="#a9b2e6" />
          <stop offset="0.62" stop-color="#6670bb" />
          <stop offset="1" stop-color="#3d4185" />
        </radialGradient>
      </defs>
      <rect
        mask="url(#sd-m-hole)"
        x="-8000"
        y="-8000"
        width="24000"
        height="24000"
        fill="url(#sd-g-moonlight)"
      />
    </svg>

    <svg
      class="sd-night"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sd-g-sky"
          gradientUnits="userSpaceOnUse"
          x1="0"
          x2="0"
          [attr.y1]="sc().horizon - 900 * sc().s"
          [attr.y2]="sc().horizon"
        >
          <stop offset="0" stop-color="#141236" />
          <stop offset="0.45" stop-color="#2b2766" />
          <stop offset="0.8" stop-color="#5a4a8f" />
          <stop offset="1" stop-color="#b07aa6" />
        </linearGradient>
        <radialGradient id="sd-g-halo">
          <stop offset="0" stop-color="#fff4d6" stop-opacity="0.55" />
          <stop offset="0.35" stop-color="#c9c2ff" stop-opacity="0.22" />
          <stop offset="1" stop-color="#c9c2ff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="sd-g-moon" cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stop-color="#fffdf2" />
          <stop offset="0.6" stop-color="#f7ebc4" />
          <stop offset="1" stop-color="#dcc690" />
        </radialGradient>
        <linearGradient id="sd-g-trail" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.95" />
        </linearGradient>
        <mask
          id="sd-m-sky"
          maskUnits="userSpaceOnUse"
          x="-8000"
          y="-8000"
          width="24000"
          height="24000"
        >
          <rect x="-8000" y="-8000" width="24000" height="24000" fill="#fff" />
          <path [attr.d]="sc().skyline" fill="#000" />
        </mask>
      </defs>

      <g mask="url(#sd-m-hole)">
        <g mask="url(#sd-m-sky)">
          <rect
            x="-8000"
            y="-8000"
            width="24000"
            [attr.height]="8000 + sc().horizon + 80"
            fill="url(#sd-g-sky)"
          />
          @for (st of stars(); track $index) {
            <g class="sd-star" [attr.transform]="'translate(' + st.x + ' ' + st.y + ')'">
              @if (st.big) {
                <path
                  class="sd-twinkle"
                  [attr.data-tone]="st.tone"
                  [attr.d]="sparkle"
                  [attr.transform]="'scale(' + st.r / 9 + ')'"
                  [style.animation-delay.s]="st.delay"
                  [style.animation-duration.s]="st.dur"
                />
              } @else {
                <circle
                  class="sd-twinkle"
                  [attr.data-tone]="st.tone"
                  [attr.r]="st.r"
                  [style.animation-delay.s]="st.delay"
                  [style.animation-duration.s]="st.dur"
                />
              }
            </g>
          }
          <g
            class="sd-shoot"
            [attr.transform]="shooting().at"
            [style.animation-duration.s]="shootingEvery"
          >
            <path
              d="M-180 -70L0 0"
              stroke="url(#sd-g-trail)"
              [attr.stroke-width]="4 * sc().s"
              stroke-linecap="round"
            />
            <circle [attr.r]="3.5 * sc().s" fill="#fff" />
          </g>

          <!-- La luna, con su gorro de dormir -->
          <g
            [attr.transform]="
              'translate(' + moonAt().x + ' ' + moonAt().y + ') scale(' + sc().s + ')'
            "
          >
            <circle r="300" fill="url(#sd-g-halo)" />
            <g #moonSink>
              <g class="sd-moon-bob">
                <circle r="56" fill="url(#sd-g-moon)" />
                <circle class="sd-crater" cx="-24" cy="-6" r="10" />
                <circle class="sd-crater" cx="26" cy="22" r="7" />
                <circle class="sd-crater" cx="8" cy="34" r="4" />
                <ellipse class="sd-moon-cheek" cx="-26" cy="18" rx="9" ry="5" />
                <ellipse class="sd-moon-cheek" cx="28" cy="10" rx="8" ry="4.5" />
                <g #moonSleep class="sd-moon-ink">
                  <path d="M-22 2Q-15 9 -7 3" />
                  <path d="M9 0Q16 7 24 0" />
                  <path d="M-4 20Q2 24 8 19" />
                </g>
                <g #moonAwake class="sd-moon-awake" opacity="0">
                  <ellipse cx="-14" cy="2" rx="6" ry="8" />
                  <ellipse cx="16" cy="0" rx="6.5" ry="8.5" />
                  <circle class="sd-moon-o" cx="2" cy="22" r="5" />
                </g>
                <!-- El gorro: cae hacia la derecha y la borla se hamaca -->
                <path
                  class="sd-cap"
                  d="M-50 -24C-46 -70 10 -92 52 -62C70 -48 76 -20 70 6C62 -18 46 -40 30 -44C10 -50 -30 -46 -50 -24Z"
                />
                <path class="sd-cap-stripe" d="M-20 -60C0 -72 26 -70 44 -56" />
                <path
                  class="sd-cap-band"
                  d="M-56 -22C-34 -48 30 -52 54 -30C56 -24 54 -18 50 -16C28 -36 -30 -34 -52 -10C-58 -12 -60 -18 -56 -22Z"
                />
                <g transform="translate(70 6)">
                  <g class="sd-pompom">
                    <circle cy="10" r="11" class="sd-pom" />
                    <circle cx="-3" cy="6" r="4" class="sd-pom-hi" />
                  </g>
                </g>
              </g>
            </g>
          </g>

          @for (c of clouds(); track $index) {
            <g
              class="sd-cloud"
              [style.animation-duration.s]="c.dur"
              [style.animation-delay.s]="c.delay"
            >
              <path class="sd-cloud-rim" [attr.d]="c.d" />
              <path
                class="sd-cloud-body"
                [attr.d]="c.d"
                [attr.transform]="'translate(0 ' + 6 * sc().s + ')'"
              />
            </g>
          }
        </g>
      </g>

      <!-- Main ronca: la burbuja respira con él y las "z" suben -->
      <g
        [attr.transform]="
          'translate(' + sc().hero.x + ' ' + sc().hero.y + ') scale(' + sc().hero.scale + ')'
        "
      >
        <g #zzz class="sd-zzz">
          <text x="-70" y="-250">z</text>
          <text x="-70" y="-250">z</text>
          <text x="-70" y="-250">z</text>
        </g>
        <g transform="translate(36 -112)">
          <g #bubble>
            <g class="sd-bubble">
              <circle cx="40" cy="-12" r="40" class="sd-bubble-skin" />
              <path d="M18 -34Q30 -46 48 -43" class="sd-bubble-hi" />
              <circle cx="60" cy="6" r="4.5" class="sd-bubble-dot" />
            </g>
          </g>
          <g #pop opacity="0">
            @for (d of drops; track $index) {
              <circle class="sd-drop" cx="40" cy="-12" [attr.r]="d.r * 1.6" />
            }
            <text #popWord class="sd-pop" x="130" y="-10" text-anchor="middle">¡pop!</text>
          </g>
        </g>
      </g>
    </svg>

    <svg
      class="sd-glow"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sd-g-warm">
          <stop offset="0" stop-color="#ffcf7a" stop-opacity="0.9" />
          <stop offset="0.4" stop-color="#ff9f5a" stop-opacity="0.35" />
          <stop offset="1" stop-color="#ff9f5a" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="sd-g-fly">
          <stop offset="0" stop-color="#f4ffb0" stop-opacity="1" />
          <stop offset="0.3" stop-color="#c8f27a" stop-opacity="0.5" />
          <stop offset="1" stop-color="#9be36a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="sd-g-beam-night" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffe2a0" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="sd-g-ring">
          <stop offset="0.72" stop-color="#ffd27a" stop-opacity="0" />
          <stop offset="0.84" stop-color="#ffc46b" stop-opacity="0.3" />
          <stop offset="0.93" stop-color="#ff7fa0" stop-opacity="0.42" />
          <stop offset="1" stop-color="#ffd27a" stop-opacity="0" />
        </radialGradient>
      </defs>

      <g mask="url(#sd-m-hole)">
        <!-- El charco de luz de main y su play -->
        <ellipse
          [attr.cx]="sc().hero.x"
          [attr.cy]="sc().hero.y + 30 * sc().s"
          [attr.rx]="420 * sc().hero.scale"
          [attr.ry]="190 * sc().hero.scale"
          fill="url(#sd-g-warm)"
          opacity="0.75"
        />

        @for (m of sc().marks; track m.chapter) {
          <g [attr.transform]="'translate(' + m.x + ' ' + m.y + ') scale(' + sc().art + ')'">
            @switch (m.chapter) {
              @case ('prologue') {
                <ellipse cy="-62" rx="62" ry="40" fill="url(#sd-g-warm)" />
                <rect class="sd-lit" x="-35" y="-61" width="15" height="14" rx="2.5" />
                <rect class="sd-lit sd-flicker" x="20" y="-61" width="15" height="14" rx="2.5" />
                <circle class="sd-lit" cy="-88" r="7.5" />
              }
              @case ('understanding') {
                <circle cy="-69" r="56" fill="url(#sd-g-warm)" />
                <circle class="sd-lit sd-lit-soft" cy="-69" r="15" />
              }
              @case ('communication') {
                <circle cx="-4" cy="-96" r="40" fill="url(#sd-g-warm)" opacity="0.6" />
              }
              @case ('optimization') {
                <circle cy="-53" r="40" fill="url(#sd-g-warm)" />
                <path class="sd-lit" d="M-5 -45V-55Q-5 -61 0 -61Q5 -61 5 -55V-45Z" />
              }
              @case ('management') {
                <ellipse cx="-22" cy="-49" rx="70" ry="38" fill="url(#sd-g-warm)" />
                <rect class="sd-lit" x="-46" y="-54" width="12" height="10" rx="2" />
                <rect class="sd-lit sd-flicker" x="-28" y="-54" width="12" height="10" rx="2" />
                <rect class="sd-lit" x="-10" y="-54" width="12" height="10" rx="2" />
              }
              @case ('advanced') {
                <g transform="translate(0 -109)">
                  <g class="sd-beam">
                    <path d="M0 -5L380 -70V70L0 5Z" fill="url(#sd-g-beam-night)" />
                  </g>
                </g>
                <circle cy="-109" r="60" fill="url(#sd-g-warm)" />
                <rect class="sd-lit" x="-9" y="-118" width="18" height="18" rx="3" />
              }
            }
          </g>
        }

        @for (f of flies(); track $index) {
          <g #fly [attr.transform]="'translate(' + f.x + ' ' + f.y + ')'">
            <g
              class="sd-fly"
              [style.--ax.px]="f.ax"
              [style.--ay.px]="f.ay"
              [style.--bx.px]="f.bx"
              [style.--by.px]="f.by"
              [style.animation-duration.s]="f.dur"
              [style.animation-delay.s]="-f.dur * f.phase"
            >
              <circle
                class="sd-fly-glow"
                [attr.r]="16 * sc().s"
                fill="url(#sd-g-fly)"
                [style.animation-delay.s]="f.delay"
              />
              <circle [attr.r]="2.4 * sc().s" fill="#fbffd2" />
            </g>
          </g>
        }
      </g>

      <!-- El borde del amanecer: rosado y dorado, viaja con el agujero -->
      <circle #ring [attr.cx]="sc().moon.x" [attr.cy]="sc().moon.y" r="0" fill="url(#sd-g-ring)" />
    </svg>

    <!-- Alrededor del cartel el mapa se apaga: que nada compita con él
         (el molino, el camino y los nombres quedaban justo detrás). -->
    <div
      #hush
      class="sd-hush"
      [style.--sd-x]="at().x + 'px'"
      [style.--sd-y]="at().y + 'px'"
      aria-hidden="true"
    ></div>

    <button
      #play
      type="button"
      class="sd-play"
      [class.is-quiet-focus]="!keyboard()"
      [style.left.px]="at().x"
      [style.top.px]="at().y"
      [attr.aria-label]="'Jugar' + (soundOn ? ' con música' : '') + ': ' + level()"
      (click)="wake($event, 'play')"
    >
      <!-- GSAP hunde esta capa y no el botón: reescribiría el translate que lo centra. -->
      <span #press class="sd-press">
        <story-lantern-sign
          label="¡Jugar!"
          [plate]="soundOn ? 'con música' : 'sin sonido'"
          [glow]="true"
          [sound]="soundOn"
        />
      </span>
    </button>
  `,
  styleUrl: './story-dawn.component.scss',
})
export class StoryDawnComponent {
  /** El mundo del mapa, en unidades de su viewBox. */
  readonly scene = input.required<NightScene>();
  /** Dónde va el play, en píxeles: el centro de arriba del cartel. */
  readonly at = input.required<Point>();
  /** El nivel al que entra el play (para el lector de pantalla). */
  readonly level = input.required<string>();
  readonly woke = output<DawnBy>();
  readonly lit = output<DawnBy>();

  /** ¿Hace falta la noche? Solo la primera vez y si todavía nadie tocó nada en la página. */
  static needed(): boolean {
    return !dawned && !pageWasTouched();
  }

  protected readonly sc = this.scene;
  protected readonly sparkle = SPARKLE;
  protected readonly drops = DROPS;
  protected readonly shootingEvery = SHOOTING_EVERY;
  protected readonly soundOn = readStored(SOUND_KEY) !== 'off';
  /**
   * El cartel recibe el foco apenas carga (para entrar con Enter), y Chrome
   * le dibuja el marco de foco aunque nadie use el teclado: se veía como un
   * rectángulo "seleccionado" alrededor del cartel. El marco sale recién
   * cuando se toca una tecla.
   */
  protected readonly keyboard = signal(false);

  protected readonly viewBox = computed(() => {
    const { w, h } = this.scene().view;
    return `0 0 ${w} ${h}`;
  });

  /**
   * Dónde se dibuja la luna: un poco más arriba que el sol, para que asome
   * sobre las montañas. En el celular parado el título tapa casi todo el
   * cielo: la luna se corre a la derecha, al hueco que deja la palabra "main".
   */
  protected readonly moonAt = computed<Point>(() => {
    const { view, horizon, s, moon } = this.scene();
    return view.h > view.w
      ? { x: view.w * 0.85, y: horizon - 115 * s }
      : { x: moon.x, y: moon.y - 70 * s };
  });

  /**
   * Estrellas sembradas con semilla, también fuera del viewBox (una pantalla
   * más ancha que el dibujo ve el borde del cielo), y ninguna pegada a la luna.
   * Van de la más cercana a la luna a la más lejana: así se apagan en orden.
   */
  protected readonly stars = computed(() => {
    const { view, horizon, s, moon } = this.scene();
    const top = -0.5 * horizon;
    const n = Math.round((2 * view.w * (horizon - top)) / 11000);
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = -0.5 * view.w + hash(i, 41) * 2 * view.w;
      const y = top + hash(i, 42) * (horizon - top);
      const dist = Math.hypot(x - moon.x, y - moon.y);
      if (dist < 130 * s) continue;
      const big = hash(i, 43) < 0.1;
      out.push({
        x: Math.round(x),
        y: Math.round(y),
        big,
        r: (big ? 7 + hash(i, 44) * 5 : 1.2 + hash(i, 44) * 2.2) * s,
        tone: hash(i, 45) < 0.6 ? 'a' : hash(i, 45) < 0.82 ? 'b' : 'c',
        delay: -hash(i, 46) * 4,
        dur: 1.8 + hash(i, 47) * 2.6,
        dist,
      });
    }
    return out.sort((a, b) => a.dist - b.dist);
  });

  protected readonly clouds = computed(() => {
    const { view, horizon, s, moon } = this.scene();
    return Array.from({ length: 4 }, (_, i) => ({
      // Una pasa siempre cerca de la luna, para que su borde se ilumine.
      d: cloudPath(
        i === 0 ? moon.x - 160 * s : -100 + hash(i, 51) * (view.w + 200),
        i === 0 ? moon.y - 30 * s : 90 * s + hash(i, 52) * (horizon - 260 * s),
        (150 + hash(i, 53) * 130) * s,
      ),
      dur: 34 + hash(i, 54) * 24,
      delay: -hash(i, 55) * 30,
    }));
  });

  /** La estrella fugaz cruza la parte alta del cielo, lejos de la luna. */
  protected readonly shooting = computed(() => {
    const { view, horizon, moon } = this.scene();
    const x = moon.x > view.w / 2 ? view.w * 0.22 : view.w * 0.6;
    return { at: `translate(${Math.round(x)} ${Math.round(horizon * 0.22)})` };
  });

  /** Luciérnagas en la tierra, cada una con su vuelo y su ritmo. */
  protected readonly flies = computed(() => {
    const { view, horizon, s } = this.scene();
    const n = Math.round((view.w * (view.h - horizon)) / 90000);
    return Array.from({ length: n }, (_, i) => {
      const k = (j: number) => (hash(i, 60 + j) - 0.5) * 2;
      return {
        x: Math.round(-0.05 * view.w + hash(i, 61) * 1.1 * view.w),
        y: Math.round(horizon + 120 * s + hash(i, 62) * (view.h - horizon - 150 * s)),
        ax: k(3) * 40 * s,
        ay: k(4) * 30 * s,
        bx: k(5) * 46 * s,
        by: k(6) * 34 * s,
        dur: 5 + hash(i, 67) * 5,
        phase: hash(i, 68),
        delay: -hash(i, 69) * 3,
      };
    });
  });

  private readonly tint = viewChild.required<ElementRef<SVGSVGElement>>('tint');
  private readonly hole = viewChild.required<ElementRef<SVGCircleElement>>('hole');
  private readonly ring = viewChild.required<ElementRef<SVGCircleElement>>('ring');
  private readonly moonSink = viewChild.required<ElementRef<SVGGElement>>('moonSink');
  private readonly moonSleep = viewChild.required<ElementRef<SVGGElement>>('moonSleep');
  private readonly moonAwake = viewChild.required<ElementRef<SVGGElement>>('moonAwake');
  private readonly bubble = viewChild.required<ElementRef<SVGGElement>>('bubble');
  private readonly pop = viewChild.required<ElementRef<SVGGElement>>('pop');
  private readonly popWord = viewChild.required<ElementRef<SVGTextElement>>('popWord');
  private readonly zzz = viewChild.required<ElementRef<SVGGElement>>('zzz');
  private readonly play = viewChild.required<ElementRef<HTMLElement>>('play');
  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private readonly hush = viewChild.required<ElementRef<HTMLElement>>('hush');
  private readonly flyEls = viewChildren<ElementRef<SVGGElement>>('fly');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private woken = false;
  private dawn?: gsap.core.Timeline;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dawn?.kill());
  }

  /**
   * Hasta dónde tiene que crecer el agujero del amanecer: la esquina de lo que
   * se ve (la pantalla, no todo el mapa del celular parado) más lejana de la
   * luna, en unidades del viewBox. El agujero es negro hasta el 60 % del radio.
   */
  private reach(): number {
    const svg = this.tint().nativeElement;
    const m = svg.getScreenCTM()?.inverse();
    const { moon, view } = this.scene();
    if (!m) return Math.hypot(view.w, view.h) / 0.6;
    const box = svg.getBoundingClientRect();
    const top = Math.max(box.top, 0);
    const bottom = Math.min(box.bottom, innerHeight);
    let far = 0;
    for (const [x, y] of [
      [box.left, top],
      [box.right, top],
      [box.left, bottom],
      [box.right, bottom],
    ]) {
      const p = new DOMPoint(x, y).matrixTransform(m);
      far = Math.max(far, Math.hypot(p.x - moon.x, p.y - moon.y));
    }
    return far / 0.6;
  }

  /** Pone el foco en el play, para entrar con el teclado. */
  focus(): void {
    this.play().nativeElement.focus({ preventScroll: true });
  }

  /**
   * La cadena del amanecer: el play se hunde y suena; revienta la burbuja y
   * main se despierta; la luna abre los ojos, salta y se hunde tras las
   * montañas; el día nace donde estaba y se derrama con su borde rosado,
   * apagando estrellas y espantando luciérnagas.
   */
  protected wake(event: Event, by: DawnBy): void {
    event.stopPropagation();
    if (this.woken) return;
    this.woken = true;
    dawned = true;
    if (this.soundOn) playChime();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.woke.emit(by);
      this.lit.emit(by);
      return;
    }
    const far = this.reach();
    const host = this.host.nativeElement;
    const stars = host.querySelectorAll('.sd-star');
    const flies = this.flyEls().map((f) => f.nativeElement);
    const press = this.press().nativeElement;

    this.dawn = gsap
      .timeline({ onComplete: () => this.lit.emit(by) })
      // La medalla se aplasta (desde abajo, conservando el volumen) y salta antes de irse.
      .set(press, { transformOrigin: '50% 100%' })
      .to(press, {
        scaleX: by === 'play' ? 1.1 : 1,
        scaleY: by === 'play' ? 0.84 : 1,
        duration: 0.08,
        ease: 'power2.out',
      })
      .addLabel('pop')
      .call(() => this.woke.emit(by), [], 'pop')
      .to(press, { scaleX: 0.9, scaleY: 1.12, y: -14, duration: 0.12, ease: 'power2.out' }, 'pop')
      .to(press, { scale: 0.5, y: 6, autoAlpha: 0, duration: 0.24, ease: 'power2.in' }, 'pop+=0.12')
      .to(this.bubble().nativeElement, { scale: 1.3, autoAlpha: 0, duration: 0.06 }, 'pop')
      .set(this.pop().nativeElement, { opacity: 1 }, 'pop')
      .fromTo(
        this.pop().nativeElement.querySelectorAll('.sd-drop'),
        { x: 0, y: 0, autoAlpha: 1 },
        {
          x: (i: number) => DROPS[i].x,
          y: (i: number) => DROPS[i].y,
          autoAlpha: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        'pop',
      )
      .fromTo(
        this.popWord().nativeElement,
        { autoAlpha: 0, scale: 0.4, y: 10, svgOrigin: '130 -10' },
        { autoAlpha: 1, scale: 1, y: -10, duration: 0.24, ease: 'back.out(2.6)' },
        'pop',
      )
      .to(this.popWord().nativeElement, { autoAlpha: 0, y: -40, duration: 0.3 }, 'pop+=0.4')
      .to(this.zzz().nativeElement, { autoAlpha: 0, duration: 0.15 }, 'pop')
      .to(this.hush().nativeElement, { autoAlpha: 0, duration: 0.45 }, 'pop')
      .addLabel('moon', 'pop+=0.2')
      .set(this.moonSleep().nativeElement, { autoAlpha: 0 }, 'moon')
      .fromTo(
        this.moonAwake().nativeElement,
        { autoAlpha: 1, scaleY: 0.2, svgOrigin: '0 4' },
        { scaleY: 1, duration: 0.2, ease: 'back.out(3)' },
        'moon',
      )
      .to(this.moonSink().nativeElement, { y: -18, duration: 0.16, ease: 'power2.out' }, 'moon')
      .to(this.moonSink().nativeElement, { y: 360, duration: 0.7, ease: 'power3.in' }, 'moon+=0.24')
      .addLabel('dawn', 'moon+=0.45')
      .to(
        stars,
        { autoAlpha: 0, duration: 0.2, stagger: { amount: 0.8 }, ease: 'power1.in' },
        'dawn-=0.1',
      )
      .to(
        flies,
        { y: '-=140', autoAlpha: 0, duration: 0.7, stagger: { amount: 0.5, from: 'random' } },
        'dawn-=0.2',
      )
      .to(
        this.hole().nativeElement,
        { attr: { r: far }, duration: 1.3, ease: 'power1.inOut' },
        'dawn',
      )
      .fromTo(
        this.ring().nativeElement,
        { attr: { r: 0 }, autoAlpha: 1 },
        { attr: { r: far }, duration: 1.3, ease: 'power1.inOut' },
        'dawn',
      )
      .to(this.ring().nativeElement, { autoAlpha: 0, duration: 0.35 }, 'dawn+=0.95');
  }
}
