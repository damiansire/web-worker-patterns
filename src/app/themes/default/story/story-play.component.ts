import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cada medalla necesita ids propios: de noche hay dos en la página (la del mapa, oculta, y la de la noche). */
let seq = 0;

/**
 * La medalla de jugar: una moneda dorada con el triángulo en relieve, cruzada
 * por una cinta que dice qué hace. Es un objeto del mundo, no un botón de
 * formulario: tiene canto (al apretarla se hunde en él), un brillo que la
 * recorre cada tanto y destellos alrededor.
 *
 * De noche (`glow`) es la única luz fuerte del mapa: tiene halo, un pulso que
 * dice "tocame" y, si va a sonar, una insignia con una nota de la que salen
 * corcheas. Solo dibuja: el botón, su posición y su etiqueta para el lector de
 * pantalla son de quien la usa.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-play',
  host: {
    class: 'sp',
    '[class.is-glow]': 'glow()',
    'aria-hidden': 'true',
  },
  template: `
    <svg class="sp-art" viewBox="0 0 260 156">
      <defs>
        <radialGradient [attr.id]="id + 'face'" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#fff0b8" />
          <stop offset="0.45" stop-color="#f7c443" />
          <stop offset="1" stop-color="#d98a1c" />
        </radialGradient>
        <linearGradient [attr.id]="id + 'band'" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#ef6a6f" />
          <stop offset="1" stop-color="#c63b55" />
        </linearGradient>
        <radialGradient [attr.id]="id + 'halo'">
          <stop offset="0" stop-color="#ffe7a3" stop-opacity="0.85" />
          <stop offset="0.45" stop-color="#ffc85a" stop-opacity="0.32" />
          <stop offset="1" stop-color="#ffc85a" stop-opacity="0" />
        </radialGradient>
        <clipPath [attr.id]="id + 'clip'">
          <circle cx="130" cy="58" r="47" />
        </clipPath>
        <!-- La cinta se arquea: el texto va sobre la línea media del arco -->
        <path [attr.id]="id + 'arc'" d="M30 125Q130 105 230 125" />
      </defs>

      @if (glow()) {
        <circle class="sp-halo" cx="130" cy="64" r="118" [attr.fill]="url('halo')" />
      } @else {
        <ellipse class="sp-contact" cx="130" cy="150" rx="84" ry="6" />
      }

      <g class="sp-bob">
        <!-- El foco del teclado: un aro alrededor de la moneda, no un rectángulo -->
        <circle class="sp-focus" cx="130" cy="61" r="61" />
        @if (glow()) {
          <circle class="sp-pulse" cx="130" cy="58" r="52" />
        }

        <!-- La moneda: el canto oscuro abajo, la cara encima -->
        <circle class="sp-edge" cx="130" cy="64" r="53" />
        <circle class="sp-rim" cx="130" cy="64" r="48" />
        <g class="sp-face">
          <circle cx="130" cy="58" r="48" [attr.fill]="url('face')" />
          <circle class="sp-bevel" cx="130" cy="58" r="39" />
          <circle class="sp-bevel-hi" cx="130" cy="59.5" r="39" />
          <path class="sp-gleam" d="M95 47A37 37 0 0 1 120 23" />
          <g [attr.clip-path]="url('clip')">
            <rect class="sp-shine" x="40" y="0" width="16" height="130" />
          </g>
          <g class="sp-tri">
            <path
              class="sp-tri-hi"
              d="M121 39Q121 33 127 36L154 54Q160 58 154 62L127 80Q121 83 121 77Z"
            />
            <path
              class="sp-tri-ink"
              d="M119 36Q119 30 125 33L152 51Q158 55 152 59L125 77Q119 80 119 74Z"
            />
          </g>
        </g>

        <!-- La cinta: las colas atrás, el pliegue y la banda arqueada adelante -->
        <g class="sp-ribbon">
          <path class="sp-tail" d="M46 116L2 118L17 133L4 149L50 145Z" />
          <path class="sp-tail" d="M214 116L258 118L243 133L256 149L210 145Z" />
          <path class="sp-fold" d="M30 136L50 145L50 131Z" />
          <path class="sp-fold" d="M230 136L210 145L210 131Z" />
          <path
            class="sp-band"
            d="M30 106Q130 86 230 106L230 136Q130 116 30 136Z"
            [attr.fill]="url('band')"
          />
          <path class="sp-band-hi" d="M36 110Q130 92 224 110" />
          <text class="sp-label">
            <textPath [attr.href]="'#' + id + 'arc'" startOffset="50%" text-anchor="middle">
              {{ label() }}
            </textPath>
          </text>
        </g>

        @if (sound() !== null) {
          <g class="sp-badge" transform="translate(178 20)">
            @if (sound()) {
              <g class="sp-notes">
                <path class="sp-note" [attr.d]="note" />
                <path class="sp-note" [attr.d]="note" />
                <path class="sp-note" [attr.d]="note" />
              </g>
            }
            <circle class="sp-badge-disc" r="15" />
            <path class="sp-badge-note" [attr.d]="note" transform="translate(-1 0)" />
            @if (!sound()) {
              <path class="sp-badge-mute" d="M-9 -9L9 9" />
            }
          </g>
        }

        <!-- El destello titila adentro de su grupo: si la animación tocara el
             mismo elemento que el transform, Chrome lo corre de lugar. -->
        <g transform="translate(74 18)"><path class="sp-spark" [attr.d]="sparkle" /></g>
        <g transform="translate(196 76) scale(0.6)">
          <path class="sp-spark" [attr.d]="sparkle" />
        </g>
        <g transform="translate(62 84) scale(0.45)">
          <path class="sp-spark" [attr.d]="sparkle" />
        </g>
      </g>
    </svg>
    @if (caption()) {
      <span class="sp-caption">{{ caption() }}</span>
    }
  `,
  styleUrl: './story-play.component.scss',
})
export class StoryPlayComponent {
  /** Lo que dice la cinta: "¡Jugar!" o "Repetir". */
  readonly label = input.required<string>();
  /** Debajo, en chico: el nivel, o si va a sonar. */
  readonly caption = input<string>();
  /** De noche: halo, pulso y destellos más vivos. */
  readonly glow = input(false);
  /** La insignia del sonido: con nota (y corcheas que salen), tachada, o ninguna. */
  readonly sound = input<boolean | null>(null);

  protected readonly id = `sp${++seq}-`;
  /** Una corchea, centrada en el origen. */
  protected readonly note =
    'M-2.2 5V-9H0Q1.5-5 6.5-3.5Q7-0.5 5.5 1.5Q5-2 0-3.4V5ZM-4 8.2a4 3.2 0 1 1 0-6.4a4 3.2 0 1 1 0 6.4Z';
  protected readonly sparkle = 'M0 -10Q1.2 -1.2 10 0Q1.2 1.2 0 10Q-1.2 1.2 -10 0Q-1.2 -1.2 0 -10Z';

  protected url(name: string): string {
    return `url(#${this.id}${name})`;
  }
}
