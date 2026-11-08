import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { readStored } from '../../../core/utils/safe-storage';
import { pageWasTouched, playChime, SOUND_KEY } from './story.audio';

/** Un punto en píxeles dentro del mapa. */
export interface DawnPoint {
  x: number;
  y: number;
}

/** Cómo se despertó: con el play (y entonces se entra a jugar) o tocando en otro lado. */
export type DawnBy = 'play' | 'tap';

/** Estrellas del cielo de noche: x, y (en % de la pantalla) y desfase del titileo. */
const STARS: readonly (readonly [number, number, number])[] = [
  [6, 30, 0.2],
  [14, 9, 1.4],
  [22, 22, 0.7],
  [31, 6, 2.1],
  [38, 27, 1.1],
  [46, 13, 0.4],
  [53, 4, 1.8],
  [59, 24, 0.9],
  [67, 10, 2.4],
  [74, 31, 0.1],
  [81, 7, 1.6],
  [88, 20, 0.6],
  [94, 33, 2],
  [97, 5, 1.2],
];

/** Ya amaneció en esta página: volver al mapa (desde un nivel) no repite la noche. */
let dawned = false;

/**
 * La entrada al juego: el mapa de noche, con main dormido y, bajo sus pies, el
 * play. Tocarlo da el toque que el navegador pide para dejar sonar (suena un
 * arpegio que lo confirma), amanece desde el sol, main se despierta y entra al
 * nivel que toca. Tocar en cualquier otro lado también amanece, pero se queda
 * en el mapa para elegir. Existe por el sonido: sin un toque antes, la música
 * del nivel no podría arrancar sola.
 *  - `woke`: en el mismo clic, para que el mapa despierte a main.
 *  - `lit`: cuando la luz ya llenó el mapa; el mapa quita la noche.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-dawn',
  host: {
    class: 'sd',
    '(click)': 'wake($event, "tap")',
  },
  template: `
    <div
      #dark
      class="sd-dark"
      [style.--sd-mx]="sleeper().x + 'px'"
      [style.--sd-my]="sleeper().y + 'px'"
      [style.--sd-hx]="sun().x + 'px'"
      [style.--sd-hy]="sun().y + 'px'"
    ></div>
    <div #sky class="sd-sky" aria-hidden="true">
      @for (s of stars; track $index) {
        <i [style.left.%]="s[0]" [style.top.%]="s[1]" [style.animation-delay.s]="s[2]"></i>
      }
    </div>
    <span
      #zzz
      class="sd-zzz"
      aria-hidden="true"
      [style.left.px]="sleeper().x"
      [style.top.px]="sleeper().y"
    >
      <i>z</i><i>z</i><i>z</i>
    </span>
    <button
      #play
      type="button"
      class="sd-play"
      [style.left.px]="at().x"
      [style.top.px]="at().y"
      [attr.aria-label]="'Jugar' + (soundOn ? ' con música' : '') + ': ' + level()"
      (click)="wake($event, 'play')"
    >
      <!-- GSAP hunde esta capa y no el botón: reescribiría el translate que lo centra. -->
      <span #press class="sd-play-bob">
        <span class="sd-play-ring" aria-hidden="true"></span>
        <span class="sd-play-tri" aria-hidden="true"></span>
        <span class="sd-play-text" aria-hidden="true">
          <strong>¡Jugar!</strong>
          <small>
            <svg viewBox="0 0 24 24">
              <path class="sd-cone" d="M4 9h4l5-4v14l-5-4H4z" />
              @if (soundOn) {
                <path class="sd-wave" d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
              } @else {
                <path class="sd-wave" d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
              }
            </svg>
            {{ soundOn ? 'con música' : 'sin sonido' }}
          </small>
        </span>
      </span>
    </button>
  `,
  styleUrl: './story-dawn.component.scss',
})
export class StoryDawnComponent {
  /** De dónde sale la luz al amanecer: el sol del mapa. */
  readonly sun = input.required<DawnPoint>();
  /** La cabeza de main, de donde suben las "z" y alrededor de la que queda algo de luz. */
  readonly sleeper = input.required<DawnPoint>();
  /** Dónde va el play: bajo los pies de main, en el lugar del botón del mapa. */
  readonly at = input.required<DawnPoint>();
  /** El nivel al que entra el play (para el lector de pantalla). */
  readonly level = input.required<string>();
  readonly woke = output<DawnBy>();
  readonly lit = output<DawnBy>();

  /** ¿Hace falta la noche? Solo la primera vez y si todavía nadie tocó nada en la página. */
  static needed(): boolean {
    return !dawned && !pageWasTouched();
  }

  protected readonly stars = STARS;
  protected readonly soundOn = readStored(SOUND_KEY) !== 'off';
  private readonly dark = viewChild.required<ElementRef<HTMLElement>>('dark');
  private readonly sky = viewChild.required<ElementRef<HTMLElement>>('sky');
  private readonly zzz = viewChild.required<ElementRef<HTMLElement>>('zzz');
  private readonly play = viewChild.required<ElementRef<HTMLElement>>('play');
  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private woken = false;

  /** Pone el foco en el play, para entrar con el teclado. */
  focus(): void {
    this.play().nativeElement.focus({ preventScroll: true });
  }

  /**
   * El play se hunde y suena; la luz nace en el sol y se derrama hasta la
   * esquina más lejana; las estrellas y las "z" se apagan.
   */
  protected wake(event: Event, by: DawnBy): void {
    event.stopPropagation();
    if (this.woken) return;
    this.woken = true;
    dawned = true;
    if (this.soundOn) playChime();
    this.woke.emit(by);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.lit.emit(by);
      return;
    }
    const dark = this.dark().nativeElement;
    const { x, y } = this.sun();
    const far = Math.hypot(Math.max(x, dark.clientWidth - x), Math.max(y, dark.clientHeight - y));
    gsap
      .timeline({ onComplete: () => this.lit.emit(by) })
      .to(this.press().nativeElement, { scale: by === 'play' ? 0.86 : 1, duration: 0.08 })
      .addLabel('sol')
      .to(this.press().nativeElement, { scale: 0.6, autoAlpha: 0, duration: 0.3 }, 'sol')
      .to(this.zzz().nativeElement, { autoAlpha: 0, scale: 1.4, duration: 0.15 }, 'sol')
      .to(this.sky().nativeElement, { autoAlpha: 0, duration: 0.5 }, 'sol')
      .to(dark, { '--sd-hole': `${far + 220}px`, duration: 1, ease: 'power2.inOut' }, 'sol');
  }
}
