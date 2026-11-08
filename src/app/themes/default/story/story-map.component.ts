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
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { ThemeService } from '../../../theming/theme.service';
import { StoryProgress } from './story-progress.service';
import {
  CHAPTERS,
  currentLevel,
  Level,
  LEVELS,
  levelState,
  LevelState,
  serpentine,
} from './story.levels';

interface Spot {
  level: Level;
  x: number;
  y: number;
  state: LevelState;
  /** Cartel de capítulo, solo en el primer nivel de cada uno. */
  chapter: string | null;
  /** El nombre, partido en renglones que entran en la celda. */
  name: string[];
}

/** Dos trazados del camino: ancho en escritorio, angosto (más filas) en el celular. */
const LAYOUTS = {
  wide: { cols: 6, cell: { w: 180, h: 186 }, origin: { x: 110, y: 150 }, pad: 120, chars: 20 },
  narrow: { cols: 3, cell: { w: 150, h: 176 }, origin: { x: 80, y: 140 }, pad: 120, chars: 13 },
} as const;

const HOP_S = 0.17;

/** Parte un texto en renglones de hasta `max` caracteres, sin cortar palabras. */
function wrapWords(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && (last + ' ' + word).length <= max)
      lines[lines.length - 1] += ' ' + word;
    else lines.push(word);
  }
  return lines;
}

/**
 * El mapa de la historia: la nueva portada. Un camino en serpentina con un nodo
 * por nivel; main está parado en el que toca jugar. Al elegir un nivel, main va
 * saltando de nodo en nodo hasta ahí y recién entonces se entra. Los niveles
 * bloqueados tiemblan; los que todavía no tienen escena están "en obra" y se
 * abren en su versión clásica.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-story-map',
  template: `
    <section class="sm">
      <header class="sm-head">
        <p class="sm-eyebrow">una historia en niveles</p>
        <h1>La historia de main</h1>
        <p class="sm-lede">
          Main es el hilo principal del navegador y hace todo solo. Cada nivel es un patrón de Web
          Workers: superalo y se abre el siguiente.
        </p>
      </header>

      <div class="sm-board">
        <svg
          #map
          class="sm-svg"
          [attr.viewBox]="'0 0 ' + view().w + ' ' + view().h"
          role="group"
          aria-label="Mapa de niveles"
        >
          <g class="sm-clouds" aria-hidden="true">
            @for (c of clouds(); track $index) {
              <path class="sm-cloud" [attr.d]="c.d" [style.animation-delay.s]="c.delay" />
            }
          </g>
          <path class="sm-road" [attr.d]="road()" aria-hidden="true" />
          <path class="sm-road-done" [attr.d]="roadDone()" aria-hidden="true" />

          @for (s of spots(); track s.level.id; let i = $index) {
            <g
              class="sm-node"
              [attr.data-state]="s.state"
              [attr.data-chapter]="s.level.chapter"
              [attr.transform]="'translate(' + s.x + ' ' + s.y + ')'"
              role="link"
              tabindex="0"
              [attr.aria-label]="ariaFor(s)"
              (click)="go(i)"
              (keydown.enter)="go(i)"
              (keydown.space)="$event.preventDefault(); go(i)"
            >
              @if (s.chapter) {
                <text class="sm-chapter" [attr.y]="68 + s.name.length * 18" text-anchor="middle">
                  {{ s.chapter }}
                </text>
              }
              @if (i === here()) {
                <circle class="sm-here" r="40" />
              }
              <circle class="sm-disc-shadow" r="34" cy="6" />
              <circle class="sm-disc" r="34" />
              @switch (s.state) {
                @case ('locked') {
                  <path
                    class="sm-lock"
                    d="M-10 -2V-9A10 10 0 0 1 10 -9V-2M-14 -2H14V16H-14Z"
                    aria-hidden="true"
                  />
                }
                @case ('wip') {
                  <path class="sm-cone" d="M-14 14L-4 -16H4L14 14Z" aria-hidden="true" />
                  <path class="sm-cone-band" d="M-9 0H9L10.5 5H-10.5Z" aria-hidden="true" />
                  <rect class="sm-cone-base" x="-18" y="13" width="36" height="5" rx="2" />
                }
                @default {
                  <text class="sm-num" y="10" text-anchor="middle">{{ s.level.n }}</text>
                }
              }
              @if (s.state === 'done') {
                <path class="sm-star" [attr.d]="star" transform="translate(26 -26)" />
              }
              <text class="sm-name" y="62" text-anchor="middle">
                @for (line of s.name; track $index) {
                  <tspan x="0" [attr.dy]="$index ? 18 : 0">{{ line }}</tspan>
                }
              </text>
            </g>
          }

          <g #hero class="sm-hero" aria-hidden="true">
            <g class="sm-hero-bob">
              <ellipse class="sm-hero-shadow" rx="22" ry="5" />
              <path class="sm-hero-body" [attr.d]="heroBody" />
              <path class="sm-hero-crown" d="M-15 -52L-17 -66L-8 -59L0 -70L8 -59L17 -66L15 -52Z" />
              <g class="sm-hero-eyes">
                <ellipse class="sm-hero-white" cx="-7" cy="-31" rx="4.6" ry="5.2" />
                <ellipse class="sm-hero-white" cx="9" cy="-32" rx="5.6" ry="6.2" />
                <circle class="sm-hero-pupil" cx="-5.6" cy="-30" r="2.6" />
                <circle class="sm-hero-pupil" cx="10.6" cy="-31" r="3.1" />
              </g>
              <path class="sm-hero-mouth" d="M-2 -20Q3 -15 8 -20" />
            </g>
            <text class="sm-hero-say" y="-84" text-anchor="middle">{{ heroSays() }}</text>
          </g>
        </svg>
      </div>

      <p class="sm-status" aria-live="polite">{{ status() }}</p>
    </section>
  `,
  styleUrl: './story-map.component.scss',
})
export class StoryMapComponent {
  private readonly router = inject(Router);
  private readonly progress = inject(StoryProgress);
  private readonly themeId = inject(ThemeService).activeId;
  private readonly heroRef = viewChild.required<ElementRef<SVGGElement>>('hero');

  protected readonly star =
    'M0 -11L3.2 -3.4L11 -3.4L4.6 1.5L6.9 9.8L0 4.9L-6.9 9.8L-4.6 1.5L-11 -3.4L-3.2 -3.4Z';
  protected readonly heroBody =
    'M-22 0C-30 -16 -29 -44 -12 -52C-4 -56 9 -56 17 -52C30 -44 29 -16 22 0C16 3 -16 3 -22 0Z';

  private readonly narrow = signal(false);
  private readonly layout = computed(() => (this.narrow() ? LAYOUTS.narrow : LAYOUTS.wide));

  protected readonly view = computed(() => {
    const l = this.layout();
    const rows = Math.ceil(LEVELS.length / l.cols);
    return {
      w: l.origin.x * 2 + (l.cols - 1) * l.cell.w,
      h: l.origin.y + (rows - 1) * l.cell.h + l.pad,
    };
  });

  protected readonly spots = computed<Spot[]>(() => {
    const l = this.layout();
    const isDone = (id: string) => this.progress.isDone(id);
    const at = serpentine(LEVELS.length, l.cols, l.cell, l.origin);
    return LEVELS.map((level, i) => {
      const ch = CHAPTERS.find((c) => c.key === level.chapter)!;
      const first = i === 0 || LEVELS[i - 1].chapter !== level.chapter;
      return {
        level,
        ...at[i],
        state: levelState(level, isDone),
        chapter: first ? (ch.n ? `Cap. ${ch.n} · ${ch.title}` : ch.title) : null,
        name: wrapWords(level.title, l.chars),
      };
    });
  });

  /** Índice del nodo donde está main (el nivel que toca jugar). */
  protected readonly here = computed(() => {
    const cur = currentLevel((id) => this.progress.isDone(id));
    return LEVELS.findIndex((l) => l.id === cur.id);
  });

  protected readonly road = computed(() => this.roadThrough(this.spots()));
  protected readonly roadDone = computed(() =>
    this.roadThrough(this.spots().slice(0, this.here() + 1)),
  );

  protected readonly clouds = computed(() => {
    const { w } = this.view();
    return [0.12, 0.48, 0.8].map((f, i) => {
      const x = w * f;
      const y = 50 + i * 18;
      return {
        d: `M${x - 40} ${y}C${x - 44} ${y - 18} ${x - 20} ${y - 26} ${x - 8} ${y - 16}C${x} ${y - 34} ${x + 30} ${y - 30} ${x + 30} ${y - 12}C${x + 48} ${y - 14} ${x + 50} ${y + 2} ${x + 36} ${y + 4}H${x - 34}C${x - 46} ${y + 4} ${x - 48} ${y - 2} ${x - 40} ${y}Z`,
        delay: -i * 9,
      };
    });
  });

  protected readonly heroSays = signal('');
  protected readonly status = signal('');

  private calm = false;
  private moving = false;
  /** Dónde está dibujado main ahora (índice de nodo). */
  private heroAt = -1;
  private bob?: gsap.core.Tween;
  private hop?: gsap.core.Timeline;
  private sayCall?: gsap.core.Tween;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mq = matchMedia('(max-width: 640px)');
      const onMq = () => {
        this.narrow.set(mq.matches);
        // Con otro trazado cambian las posiciones: main va derecho a su nodo.
        queueMicrotask(() => this.placeHero(this.heroAt < 0 ? this.here() : this.heroAt));
      };
      mq.addEventListener('change', onMq);
      onMq();
      this.placeHero(this.here());
      const hero = this.heroRef().nativeElement.querySelector('.sm-hero-bob');
      if (!this.calm && hero) {
        this.bob = gsap.to(hero, {
          y: -6,
          duration: 0.55,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }
      this.say(this.here() === 0 ? '¡vamos!' : '¡acá sigo!');
      destroyRef.onDestroy(() => {
        mq.removeEventListener('change', onMq);
        for (const t of [this.bob, this.hop, this.sayCall]) t?.kill();
        gsap.killTweensOf(this.heroRef().nativeElement);
      });
    });
  }

  protected ariaFor(s: Spot): string {
    const what = { locked: 'bloqueado', open: 'para jugar', done: 'superado', wip: 'en obra' };
    return `Nivel ${s.level.n}: ${s.level.title}, ${what[s.state]}`;
  }

  protected go(i: number): void {
    if (this.moving) return;
    const spot = this.spots()[i];
    if (spot.state === 'locked') {
      const prev = LEVELS.slice(0, i)
        .reverse()
        .find((l) => l.scene);
      this.status.set(`Todavía no: primero superá «${prev?.title ?? 'el nivel anterior'}».`);
      this.say('¡todavía no!');
      this.shake(i);
      return;
    }
    this.status.set(
      spot.state === 'wip'
        ? `«${spot.level.title}» todavía está en obra: se abre la versión clásica.`
        : `Vamos a «${spot.level.title}».`,
    );
    this.moving = true;
    this.walkTo(i).then(() => {
      this.moving = false;
      void this.router.navigate(['/t', this.themeId(), 'example', spot.level.id]);
    });
  }

  /** Main salta de nodo en nodo por el camino hasta el elegido. */
  private walkTo(target: number): Promise<void> {
    const from = this.heroAt;
    if (this.calm || from === target || from < 0) {
      this.placeHero(target);
      return Promise.resolve();
    }
    const spots = this.spots();
    const dir = target > from ? 1 : -1;
    const hops = Math.abs(target - from);
    const d = hops > 6 ? HOP_S * 0.55 : HOP_S;
    const hero = this.heroRef().nativeElement;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      for (let k = 1; k <= hops; k++) {
        const s = spots[from + dir * k];
        const p = spots[from + dir * (k - 1)];
        const topY = Math.min(s.y, p.y) - 34 - 46;
        tl.to(hero, { x: (s.x + p.x) / 2, y: topY, duration: d, ease: 'power1.out' }).to(hero, {
          x: s.x,
          y: s.y - 34,
          duration: d,
          ease: 'power1.in',
          onComplete: () => {
            this.heroAt = from + dir * k;
          },
        });
      }
      tl.to(hero, { scaleY: 0.85, scaleX: 1.1, duration: 0.07, svgOrigin: '0 0' }).to(hero, {
        scaleY: 1,
        scaleX: 1,
        duration: 0.18,
        ease: 'back.out(3)',
      });
      this.hop = tl;
    });
  }

  private placeHero(i: number): void {
    const s = this.spots()[i];
    if (!s) return;
    this.heroAt = i;
    gsap.set(this.heroRef().nativeElement, { x: s.x, y: s.y - 34 });
  }

  private say(text: string): void {
    this.heroSays.set(text);
    this.sayCall?.kill();
    this.sayCall = gsap.delayedCall(2.2, () => this.heroSays.set(''));
  }

  private shake(i: number): void {
    const node = this.heroRef().nativeElement.ownerSVGElement?.querySelectorAll('.sm-node')[i];
    if (!node || this.calm) return;
    const inner = node.querySelector('.sm-disc');
    gsap.fromTo(
      inner,
      { x: -6 },
      { x: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.25)', overwrite: 'auto' },
    );
  }

  /** Camino suave entre nodos: recto en la fila, una curva en U al cambiar de fila. */
  private roadThrough(spots: Spot[]): string {
    if (!spots.length) return '';
    let d = `M${spots[0].x} ${spots[0].y}`;
    for (let i = 1; i < spots.length; i++) {
      const a = spots[i - 1];
      const b = spots[i];
      if (a.y === b.y) {
        d += `L${b.x} ${b.y}`;
      } else {
        const side = a.x > this.view().w / 2 ? 1 : -1;
        const out = 74 * side;
        d += `C${a.x + out} ${a.y} ${b.x + out} ${b.y} ${b.x} ${b.y}`;
      }
    }
    return d;
  }
}
