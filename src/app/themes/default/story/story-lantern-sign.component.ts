import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Ids propios por cartel, para que sus degradados no choquen con los de otro dibujo. */
let seq = 0;

/**
 * El play de la noche (`story-dawn`): una tabla de madera clavada en el
 * pasto con "¡Jugar!" tallado y un farolito colgado de la esquina que se
 * hamaca. Es un objeto del mundo, no un botón de formulario: al pasar el
 * mouse se inclina y el farol se hamaca más; al apretar se aplasta contra el
 * piso.
 *
 * Con `glow` el farol está prendido, alumbra la tabla y le vuelan dos
 * polillas: es la única luz fuerte del mapa de noche. Si va a sonar, una chapita con
 * una nota clavada en la otra esquina suelta corcheas (o está tachada si no
 * va a sonar). Solo dibuja: el botón, su posición y su etiqueta para el
 * lector de pantalla son de quien lo usa.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-lantern-sign',
  host: {
    class: 'sls',
    '[class.is-glow]': 'glow()',
    'aria-hidden': 'true',
  },
  template: `
    <svg class="sls-art" viewBox="-80 -66 160 124">
      <defs>
        <linearGradient [attr.id]="id + 'wood'" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#dba066" />
          <stop offset="1" stop-color="#a86a3a" />
        </linearGradient>
        <radialGradient [attr.id]="id + 'lamp'">
          <stop offset="0" stop-color="#ffe9a8" stop-opacity="0.95" />
          <stop offset="0.35" stop-color="#ffb85a" stop-opacity="0.4" />
          <stop offset="1" stop-color="#ffb85a" stop-opacity="0" />
        </radialGradient>
        <!-- La luz del farol sobre la tabla: viene de arriba a la derecha -->
        <radialGradient
          [attr.id]="id + 'lit'"
          gradientUnits="userSpaceOnUse"
          cx="66"
          cy="-20"
          r="130"
        >
          <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffe2a0" stop-opacity="0" />
        </radialGradient>
      </defs>

      <ellipse class="sls-contact" cy="51" rx="58" ry="5" />

      <g class="sls-sign">
        <!-- El foco del teclado: un borde liso alrededor de la tabla -->
        <rect class="sls-focus" x="-71" y="-41" width="142" height="74" rx="14" />
        <g class="sls-tilt">
          <path class="sls-post" d="M-38 12V51M38 12V51" />
          <path class="sls-board" [attr.d]="board" [attr.fill]="url('wood')" />
          @if (glow()) {
            <path [attr.d]="board" [attr.fill]="url('lit')" />
          }
          <path class="sls-grain" d="M-55 -10H-12M6 -10H54M-54 9H18M34 9H52" />
          <path class="sls-board-hi" d="M-55 -27H55" />
          <circle class="sls-nail" cx="-54" cy="16" r="2.5" />
          <circle class="sls-nail" cx="54" cy="16" r="2.5" />
          <circle class="sls-nail" cx="54" cy="-24" r="2.5" />
          <!-- Tallado: el surco claro abajo, la letra oscura encima -->
          <path class="sls-carve-hi" d="M-50 -13.5L-34 -3.5L-50 6.5Z" />
          <path class="sls-carve" d="M-50 -15L-34 -5L-50 5Z" />
          <text class="sls-label sls-carve-hi" x="9" y="5.5" text-anchor="middle">
            {{ label() }}
          </text>
          <text class="sls-label sls-carve" x="9" y="4" text-anchor="middle">{{ label() }}</text>

          @if (sound() !== null) {
            <g transform="translate(-56 -30)">
              @if (sound()) {
                <g class="sls-notes">
                  <path class="sls-note" [attr.d]="note" />
                  <path class="sls-note" [attr.d]="note" />
                  <path class="sls-note" [attr.d]="note" />
                </g>
              }
              <circle class="sls-badge" r="11" />
              <path class="sls-badge-note" [attr.d]="note" transform="scale(0.75)" />
              @if (!sound()) {
                <path class="sls-badge-mute" d="M-7 -7L7 7" />
              }
            </g>
          }

          <!-- El farol cuelga de un brazo clavado en la esquina -->
          <path class="sls-arm" d="M50 -32V-52H66V-48" />
          <g transform="translate(66 -48)">
            <g class="sls-lantern">
              @if (glow()) {
                <circle class="sls-lamp" cy="26" r="62" [attr.fill]="url('lamp')" />
              }
              <path class="sls-lantern-ink" d="M0 0V11" />
              <path class="sls-lantern-cap" d="M-10 11H10L7 16H-7Z" />
              <rect class="sls-lantern-glass" x="-8" y="16" width="16" height="21" rx="4" />
              <path class="sls-lantern-bar" d="M0 17V36" />
              <path class="sls-lantern-cap" d="M-10 37H10L7 42H-7Z" />
              @if (glow()) {
                <circle class="sls-moth" cx="-18" cy="10" r="2.2" />
                <circle class="sls-moth" cx="16" cy="4" r="1.8" />
              }
            </g>
          </g>
        </g>
      </g>
    </svg>
    @if (caption()) {
      <span class="sls-caption">{{ caption() }}</span>
    }
  `,
  styleUrl: './story-lantern-sign.component.scss',
})
export class StoryLanternSignComponent {
  /** Lo que dice la tabla: "¡Jugar!" o "Repetir". */
  readonly label = input.required<string>();
  /** Debajo, en chico: el nivel, o si va a sonar. */
  readonly caption = input<string>();
  /** De noche: el farol prendido alumbra la tabla. */
  readonly glow = input(false);
  /** La chapita del sonido: con nota (y corcheas que salen), tachada, o ninguna. */
  readonly sound = input<boolean | null>(null);

  protected readonly id = `sls${++seq}-`;
  /** La tabla, con las esquinas apenas redondeadas. */
  protected readonly board =
    'M-62 -26Q-62 -32 -56 -32H56Q62 -32 62 -26V18Q62 24 56 24H-56Q-62 24 -62 18Z';
  /** Una corchea, centrada en el origen. */
  protected readonly note =
    'M-2.2 5V-9H0Q1.5-5 6.5-3.5Q7-0.5 5.5 1.5Q5-2 0-3.4V5ZM-4 8.2a4 3.2 0 1 1 0-6.4a4 3.2 0 1 1 0 6.4Z';

  protected url(name: string): string {
    return `url(#${this.id}${name})`;
  }
}
