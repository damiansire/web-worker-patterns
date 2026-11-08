import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';

/** Un punto en píxeles dentro de la pantalla del nivel. */
export interface IntroPoint {
  x: number;
  y: number;
}

/**
 * La entrada a un nivel con sonido: la sala con la luz apagada, main dormido y,
 * colgando de la lámpara, la cuerdita para encenderla. Tirar de ella (o tocar
 * cualquier lado) enciende la luz, que se derrama desde la lámpara: recién ahí
 * se juega. Existe porque el navegador no deja sonar nada sin un toque de la
 * persona, y así la música arranca con ese toque.
 *  - `pull`: en el mismo clic (para soltar el sonido dentro del gesto).
 *  - `lit`: cuando la luz ya llenó la sala; la pantalla quita la intro.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-intro',
  host: {
    class: 'si',
    '(click)': 'switchOn($event)',
  },
  template: `
    <div
      #dark
      class="si-dark"
      [style.--si-hx]="lamp().x + 'px'"
      [style.--si-hy]="lamp().y + 'px'"
    ></div>
    <span
      #zzz
      class="si-zzz"
      aria-hidden="true"
      [style.left.px]="sleeper().x"
      [style.top.px]="sleeper().y"
    >
      <i>z</i><i>z</i><i>z</i>
    </span>
    <!-- Tres capas: la que se mece (CSS), la que baja con el tirón y la
         etiqueta que bambolea (GSAP). GSAP no toca las que tienen
         translate/rotate en el CSS: los reescribiría. -->
    <div
      class="si-hang"
      [style.left.px]="lamp().x"
      [style.top.px]="lamp().y"
      [style.--si-len]="cordLength() + 'px'"
    >
      <button
        #cord
        type="button"
        class="si-cord"
        [attr.aria-label]="
          'Encender la luz y empezar a jugar' + (soundOn() ? ', con música y sonidos' : '')
        "
      >
        <span class="si-string"></span>
        <span class="si-bead"></span>
        <span #swing class="si-swing">
          <span class="si-tag" aria-hidden="true">
            <b>Tirá para encender</b>
            <small>
              <svg viewBox="0 0 24 24">
                <path class="si-cone" d="M4 9h4l5-4v14l-5-4H4z" />
                @if (soundOn()) {
                  <path class="si-wave" d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
                } @else {
                  <path class="si-wave" d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
                }
              </svg>
              {{ soundOn() ? 'con música' : 'sin sonido' }}
            </small>
          </span>
        </span>
      </button>
    </div>
  `,
  styleUrl: './story-intro.component.scss',
})
export class StoryIntroComponent {
  /** De dónde cuelga la cuerda: el foco de la lámpara. De ahí sale la luz. */
  readonly lamp = input.required<IntroPoint>();
  /** Largo de la cuerda, en píxeles (sigue la escala de la escena). */
  readonly cordLength = input.required<number>();
  /** Junto a la cabeza de main, de donde suben las "z". */
  readonly sleeper = input.required<IntroPoint>();
  readonly soundOn = input.required<boolean>();
  readonly pull = output<void>();
  readonly lit = output<void>();

  private readonly dark = viewChild.required<ElementRef<HTMLElement>>('dark');
  private readonly cord = viewChild.required<ElementRef<HTMLElement>>('cord');
  private readonly swing = viewChild.required<ElementRef<HTMLElement>>('swing');
  private readonly zzz = viewChild.required<ElementRef<HTMLElement>>('zzz');
  private pulled = false;

  /** Pone el foco en la cuerda, para entrar con el teclado. */
  focus(): void {
    this.cord().nativeElement.focus();
  }

  /**
   * La cuerda baja, vuelve con el clic del interruptor y la luz se derrama
   * desde la lámpara hasta la esquina más lejana; las "z" se cortan y la
   * etiqueta queda bamboleándose hasta que se va.
   */
  protected switchOn(event: Event): void {
    if (this.pulled) return;
    this.pulled = true;
    event.preventDefault();
    this.pull.emit();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.lit.emit();
      return;
    }
    const dark = this.dark().nativeElement;
    const cord = this.cord().nativeElement;
    const { x, y } = this.lamp();
    const far = Math.hypot(Math.max(x, dark.clientWidth - x), Math.max(y, dark.clientHeight - y));
    gsap
      .timeline({ onComplete: () => this.lit.emit() })
      .to(cord, { y: 22, duration: 0.1, ease: 'power2.in' })
      .addLabel('clic')
      .to(cord, { y: 0, duration: 0.35, ease: 'back.out(2.5)' }, 'clic')
      .fromTo(
        this.swing().nativeElement,
        { rotation: -16, transformOrigin: '50% 0' },
        { rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)' },
        'clic',
      )
      .to(this.zzz().nativeElement, { autoAlpha: 0, scale: 1.4, duration: 0.15 }, 'clic')
      .to(dark, { '--si-hole': `${far + 160}px`, duration: 0.7, ease: 'power3.out' }, 'clic')
      .to(cord, { autoAlpha: 0, duration: 0.25 }, 'clic+=0.7');
  }
}
