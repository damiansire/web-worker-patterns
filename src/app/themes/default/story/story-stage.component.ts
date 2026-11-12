import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { ThemeService } from '../../../theming/theme.service';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { createScene, Scene, SceneCue, Who } from './scene/scene';
import { CHOICE_AT, MAIN_AT, WORKER_AT } from './scene/scene.art';
import { StoryProgress } from './story-progress.service';
import { StoryThreadsComponent } from './story-threads.component';
import { createLevelAudio, LevelAudio, SOUND_KEY } from './story.audio';
import {
  CHAPTERS,
  Level,
  LEVELS,
  levelState,
  nextLevel,
  PROLOGUE_ID,
  ScriptedScene,
} from './story.levels';
import { LevelContext, Line, PRIMES_EXAMPLE, SCRIPTS } from './story.scripts';
import { countStars, nextStar, StarId } from './story.stars';
import {
  blip,
  emptyLog,
  endTask,
  enqueue,
  prune,
  startTask,
  take,
  TaskKind,
  ThreadLog,
} from './story.threads.logic';

/**
 * Cuándo tocó "Siguiente" el nivel que se fue. El que entra, si nace enseguida,
 * abre con el iris: la pantalla vieja y la nueva no comparten nada más que esto.
 */
let leftForNextAt = -Infinity;
/** Cuánto dura cerrar el iris, en ms (igual que `lv-iris-close` en el SCSS). */
const IRIS_CLOSE_MS = 900;
/** Desde que entra el nivel hasta que el iris quedó abierto (`lv-iris-open` + su espera). */
const IRIS_OPEN_MS = 1900;

/** Qué atiende main con cada pelota del malabar. */
const JUGGLED: readonly TaskKind[] = ['click', 'scroll', 'frame'];

/** Dónde caen, en píxeles de la pantalla, las cosas de la escena que la pantalla señala. */
interface Anchors {
  width: number;
  choice: Record<'main' | 'door', { x: number; y: number }>;
  speaker: Record<Who, number>;
  /**
   * La cara de main, donde se cierra y se abre el iris: el radio que la enmarca
   * y el que llega justo a la esquina más lejana (con ese arranca a cerrarse,
   * así se mueve desde el primer cuadro).
   */
  face: { x: number; y: number; r: number; far: number };
}

/** El iris entre niveles: se cierra sobre main al irse y se abre sobre main al llegar. */
type Iris = 'closing' | 'opening';

/** La estrella de cinco puntas del cartel, en un viewBox de -12 a 12. */
const STAR_PATH =
  'M0 -10.5L3.1 -3.6L10.6 -2.9L4.9 2.1L6.6 9.5L0 5.6L-6.6 9.5L-4.9 2.1L-10.6 -2.9L-3.1 -3.6Z';

/** Una cuenta de toques a main que un guion dejó corriendo (ver `LevelContext.touches`). */
interface TouchCount {
  kind: 'poke' | 'lift';
  n: number;
}

/**
 * Pantalla de un nivel con escena, a pantalla completa como el mapa y como un
 * juego: la sala llena la ventana y todo vive en el mundo.
 *  - Arriba: el título del nivel, la vuelta al mapa y las paradas del capítulo.
 *  - Colgado en el centro: el problema del nivel, en grande (al ganar, el mismo
 *    cartel dice "¡Nivel superado!"), con las tres estrellas del nivel y una
 *    línea que dice qué hacer ahora: elegir, el reto, o la estrella que falta.
 *  - Debajo del cartel: "Hilos del navegador", lo que hace cada hilo en una
 *    cinta de tiempo (main, su fila de tareas, el worker y, si el nivel lo
 *    usa, el compositor).
 *  - En la escena: las opciones, como etiquetas sobre quien haría el trabajo
 *    (main, o la puerta por donde entra el worker); al ganar, en el mismo lugar,
 *    la etiqueta para seguir. No hay botones en el diálogo.
 *  - Abajo, sobre el piso: el diálogo, con quién habla y la colita hacia él.
 *  - A la derecha, a medida que se juega: el código, paso a paso, cada pedazo
 *    con lo que hace; la cámara se corre para dejarle lugar.
 * La escena se encuadra sola (`Scene.frame`) para que nada de esto la tape.
 * Sin encapsulación: la escena crea su SVG por código y su CSS cuelga de `.jh`;
 * el de esta pantalla, de `.lv`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'default-story-stage',
  imports: [RouterLink, DefaultCodeBlock, StoryThreadsComponent],
  providers: [ExampleLayoutController],
  template: `
    <article
      #room
      class="lv"
      [attr.data-chapter]="level().chapter"
      [class.is-won]="won()"
      [class.has-sheet]="steps().length > 0"
      [style.--lv-tail-x]="tailX() + 'px'"
    >
      <div class="jh lv-scene">
        <div #stage class="jh-stage">
          <div #scene class="jh-scene" aria-hidden="true"></div>
          <div class="jh-vignette"></div>
        </div>
      </div>

      <!-- Arriba, en un bloque: en angosto el cartel cuelga debajo del encabezado. -->
      <div class="lv-head">
        <header #top class="lv-top">
          <a class="lv-back" [routerLink]="['/t', themeId()]">
            <span class="lv-back-arrow" aria-hidden="true"></span>
            Mapa
          </a>
          <!-- El nombre del nivel ya está en el mapa y en el cartel: en pantalla
               solo ocupaba lugar. Queda para lectores de pantalla. -->
          <h1 class="lv-sr">{{ where() }}: {{ level().title }}</h1>
          <div class="lv-top-end">
            @if (script().sound) {
              <button
                type="button"
                class="lv-sound"
                [attr.aria-pressed]="soundOn()"
                [attr.aria-label]="
                  soundOn() ? 'Silenciar música y sonidos' : 'Activar música y sonidos'
                "
                [title]="soundOn() ? 'Silenciar' : 'Activar sonido'"
                (click)="toggleSound()"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path class="lv-sound-cone" d="M4 9h4l5-4v14l-5-4H4z" />
                  @if (soundOn()) {
                    <path
                      class="lv-sound-wave"
                      d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"
                    />
                  } @else {
                    <path class="lv-sound-wave" d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
                  }
                </svg>
              </button>
            }
            @if (won()) {
              <button type="button" class="lv-chip" (click)="setWon(false)">
                ↺ Jugar otra vez
              </button>
            }
            @if (dots().length > 1) {
              <ol class="lv-stops" aria-label="Paradas de este capítulo">
                @for (d of dots(); track d.id; let i = $index) {
                  <li>
                    @if (d.state === 'locked') {
                      <span
                        class="lv-stop"
                        data-state="locked"
                        [attr.aria-label]="d.title + ', bloqueado'"
                      >
                        {{ i + 1 }}
                      </span>
                    } @else {
                      <a
                        class="lv-stop"
                        [routerLink]="['/t', themeId(), 'example', d.id]"
                        [attr.data-state]="d.state"
                        [class.is-here]="d.id === level().id"
                        [attr.aria-current]="d.id === level().id ? 'step' : null"
                        [attr.aria-label]="d.title + (d.state === 'done' ? ', superado' : '')"
                        [title]="d.title"
                      >
                        {{ d.state === 'done' ? '✓' : i + 1 }}
                      </a>
                    }
                  </li>
                }
              </ol>
            }
          </div>
        </header>

        <div #hang class="lv-hang">
          <section class="lv-sign" [class.is-solved]="won()" aria-labelledby="lv-sign-ask">
            <p class="lv-sign-kicker">
              {{ won() ? '✦ Problema resuelto ✦' : '✦ El problema ✦' }}
            </p>
            <p class="lv-sign-what">{{ script().problem.what }}</p>
            <h2 id="lv-sign-ask" class="lv-sign-ask">
              {{ won() ? '¡Nivel superado!' : script().problem.ask }}
            </h2>
            <div class="lv-goal">
              <ul class="lv-stars" role="img" [attr.aria-label]="starCount() + ' de 3 estrellas'">
                @for (s of stars(); track s.id) {
                  <li
                    class="lv-star"
                    [class.is-earned]="s.earned"
                    [class.is-new]="freshStars().has(s.id)"
                    [style.--lv-star-i]="$index"
                    [title]="s.text"
                  >
                    <svg viewBox="-12 -12 24 24" aria-hidden="true">
                      <path [attr.d]="starPath" />
                    </svg>
                  </li>
                }
              </ul>
              <!-- Qué hacer ahora, en una línea: se rearma (y entra animada) al cambiar. -->
              @for (text of goalLine(); track text) {
                <p class="lv-goal-text" aria-live="polite">{{ text }}</p>
              }
            </div>
          </section>
          <story-threads
            class="lv-threads"
            [log]="threadLog()"
            [hasWorker]="hasWorker()"
            [compositor]="script().compositor ?? null"
            [(pausedAt)]="tapePausedAt"
          />
        </div>
      </div>

      @for (c of choices(); track c.id) {
        <button
          type="button"
          class="lv-choice"
          [class.lv-choice--gold]="c.primary"
          [class.is-away]="busy() || won()"
          [attr.data-at]="c.at"
          [attr.aria-label]="c.label + (c.done ? ', ya probado' : '')"
          [disabled]="busy() || won()"
          [style.left.px]="c.x"
          [style.top.px]="c.y"
          [style.--lv-x]="c.x + 'px'"
          (click)="run(c.id)"
        >
          <span class="lv-choice-bob">
            ✦ {{ c.label }} ✦
            @if (c.done) {
              <span class="lv-choice-check" aria-hidden="true">✓</span>
            }
          </span>
        </button>
      }

      @if (won() && nextAt(); as at) {
        <a
          #nextBtn
          class="lv-choice lv-choice--gold lv-next"
          [attr.data-at]="at.at"
          [style.left.px]="at.x"
          [style.top.px]="at.y"
          [style.--lv-x]="at.x + 'px'"
          [attr.href]="nextHref()"
          (click)="leave($event)"
        >
          <span class="lv-choice-bob">
            <span class="lv-pill-tri" aria-hidden="true"></span>
            <span class="lv-next-text">
              <b>{{ next() ? 'Siguiente' : 'Listo' }}</b>
              {{ next()?.title ?? 'Volver al mapa' }}
            </span>
          </span>
        </a>
      }

      @if (steps().length) {
        <section #sheet class="lv-sheet" aria-labelledby="lv-sheet-title">
          <p class="lv-sheet-kicker">✦ Así se escribe ✦</p>
          <h2 id="lv-sheet-title" class="lv-sheet-title">El código, paso a paso</h2>
          <ol class="lv-steps">
            @for (s of steps(); track s.id) {
              <li class="lv-step" [class.is-new]="s.id === latestStep()" [attr.data-step]="s.id">
                <p class="lv-step-note">
                  <b class="lv-step-n">{{ $index + 1 }}</b>
                  <span>{{ s.note }}</span>
                </p>
                <default-code-block [label]="s.file" [code]="s.code" />
              </li>
            }
          </ol>
          @if (!won()) {
            <p class="lv-steps-more">Seguí jugando: el código se arma con lo que va pasando.</p>
          }
        </section>
      }

      @if (iris(); as mode) {
        <!-- Entre niveles: el iris de los dibujos animados, centrado en main. -->
        <div
          class="lv-iris"
          [attr.data-mode]="mode"
          [style.--lv-iris-x]="irisAt().x + 'px'"
          [style.--lv-iris-y]="irisAt().y + 'px'"
          [style.--lv-iris-r]="irisAt().r + 'px'"
          [style.--lv-iris-far]="irisAt().far + 'px'"
          aria-hidden="true"
        >
          <div class="lv-iris-hole"></div>
          @if (mode === 'opening') {
            <div class="lv-iris-card">
              <p class="lv-iris-where">{{ where() }}</p>
              <p class="lv-iris-title">{{ level().title }}</p>
            </div>
          }
        </div>
      }

      <section
        #talk
        class="lv-talk"
        [attr.data-who]="caption().who"
        [attr.aria-label]="'Habla ' + caption().who"
        (transitionend)="onTalkMoved($event)"
      >
        <p class="lv-sr" aria-live="polite">{{ caption().text }}</p>
        <span class="lv-who" aria-hidden="true">{{ caption().who }}</span>
        @for (text of shownLine(); track text) {
          <p class="lv-line" aria-hidden="true">{{ text }}</p>
        }
      </section>
    </article>
  `,
  styleUrls: ['./scene/scene.scss', './story-stage.component.scss', './story-stage.iris.scss'],
})
export class StoryStageComponent {
  readonly level = input.required<Level>();

  private readonly ctl = inject(ExampleLayoutController);
  private readonly progress = inject(StoryProgress);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  protected readonly themeId = inject(ThemeService).activeId;
  private readonly sceneHost = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly stageEl = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly nextBtn = viewChild<ElementRef<HTMLElement>>('nextBtn');
  private readonly roomEl = viewChild.required<ElementRef<HTMLElement>>('room');
  private readonly topEl = viewChild.required<ElementRef<HTMLElement>>('top');
  private readonly hangEl = viewChild.required<ElementRef<HTMLElement>>('hang');
  private readonly talkEl = viewChild.required<ElementRef<HTMLElement>>('talk');
  private readonly sheetEl = viewChild<ElementRef<HTMLElement>>('sheet');

  protected readonly script = computed(() => SCRIPTS[this.level().scene as ScriptedScene]);
  protected readonly caption = signal<Line>({ who: 'main', text: '' });
  /** Lo que hizo cada hilo (panel "Hilos del navegador"). */
  protected readonly threadLog = signal<ThreadLog>(emptyLog());
  /** Cuándo quedó quieta la cinta de los hilos (null: en vivo). */
  protected readonly tapePausedAt = signal<number | null>(null);
  /** Lo último que contó el guion a los hilos: hasta ahí se rebobina al terminar. */
  private lastThreadEvent = 0;
  /** Lo que tapa la hoja del código a la derecha (px), según el último encuadre. */
  private sceneRight = 0;
  /** El nivel tiene worker si alguna opción se elige en su puerta. */
  protected readonly hasWorker = computed(() => this.script().paths.some((p) => p.at === 'door'));
  /** Los pasos del código que ya aparecieron, en el orden del guion; el último, resaltado. */
  private readonly revealed = signal<ReadonlySet<string>>(new Set());
  protected readonly latestStep = signal<string | null>(null);
  protected readonly steps = computed(() => {
    const shown = this.revealed();
    return this.script().code.filter((s) => shown.has(s.id));
  });
  protected readonly busy = signal(false);
  protected readonly won = signal(false);
  /** Música y efectos: preferencia de la persona, recordada entre visitas. */
  protected readonly soundOn = signal(readStored(SOUND_KEY) !== 'off');
  /** La línea del diálogo, en un arreglo para rearmar el párrafo (y su entrada) en cada cambio. */
  protected readonly shownLine = computed(() => [this.caption().text]);

  protected readonly starPath = STAR_PATH;
  /** Las tres estrellas del nivel, ganadas o no. */
  protected readonly stars = computed(() => this.progress.starsOf(this.level()) ?? []);
  protected readonly starCount = computed(() => countStars(this.stars()));
  /** Las que se ganaron en el último intento: entran con un salto. */
  protected readonly freshStars = signal<ReadonlySet<StarId>>(new Set());
  /** Si en esta visita ya se eligió algún camino (antes de eso, el cartel invita a elegir). */
  private readonly tried = signal(false);
  /**
   * Qué hacer ahora, en una línea debajo de las estrellas: primero elegir;
   * después, el reto del nivel; al ganar, la estrella que falta. En un arreglo
   * para rearmar el párrafo (y su entrada) cuando cambia.
   */
  protected readonly goalLine = computed(() => {
    const stars = this.stars();
    const missing = nextStar(stars);
    if (this.won()) return [missing ? `Te falta: ${missing.text}` : '¡Las tres estrellas!'];
    if (!this.tried()) return ['👆 Elegí una opción en la escena'];
    const challenge = stars.find((s) => s.id === 'challenge');
    return challenge && !challenge.earned ? [`Reto: ${challenge.text}`] : [];
  });

  private readonly anchors = signal<Anchors | null>(null);
  /** Las opciones del nivel, puestas sobre main o sobre la puerta. */
  protected readonly choices = computed(() => {
    const a = this.anchors();
    if (!a) return [];
    return this.script().paths.map((p) => {
      const at = a.choice[p.at];
      // La de la puerta queda cerca del borde en pantallas angostas: no se sale.
      // En celular la escena es chica y las dos etiquetas quedarían a la misma
      // altura: la de la puerta sube por encima de la de main.
      const door = p.at === 'door';
      const x = door ? Math.min(Math.max(at.x, 150), a.width - 150) : at.x;
      const y = door && a.width < 640 ? at.y - 56 : at.y;
      return { ...p, x, y, done: this.progress.isPathDone(this.level().id, p.id) };
    });
  });
  /**
   * Al ganar, la etiqueta para seguir va donde estaba la opción de main. En
   * celular a la izquierda de main no entra: va arriba de la puerta.
   */
  protected readonly nextAt = computed(() => {
    const a = this.anchors();
    if (!a) return null;
    if (a.width >= 640) return { ...a.choice.main, at: 'main' };
    const door = a.choice.door;
    return { x: Math.min(Math.max(door.x, 125), a.width - 125), y: door.y - 56, at: 'door' };
  });
  /** Calma: sin iris, se pasa de un nivel a otro directo. */
  private readonly calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Si este nivel llegó desde el "Siguiente" del anterior, entra abriendo el iris. */
  protected readonly iris = signal<Iris | null>(
    !this.calm && performance.now() - leftForNextAt < 2000 ? 'opening' : null,
  );
  /** Antes de medir la escena, el iris se centra donde suele estar main. */
  protected readonly irisAt = computed(
    () =>
      this.anchors()?.face ?? {
        x: innerWidth * 0.45,
        y: innerHeight * 0.62,
        r: 150,
        far: Math.hypot(innerWidth, innerHeight),
      },
  );
  /** Hacia dónde apunta la colita del diálogo: quien habla. */
  protected readonly tailX = computed(() => this.anchors()?.speaker[this.caption().who] ?? 0);

  protected readonly where = computed(() => {
    const lv = this.level();
    const ch = CHAPTERS.find((c) => c.key === lv.chapter)!;
    if (!ch.n) return ch.title;
    const mates = LEVELS.filter((l) => l.chapter === lv.chapter);
    return `Capítulo ${ch.n} · ${ch.title} · Nivel ${mates.indexOf(lv) + 1} de ${mates.length}`;
  });
  protected readonly dots = computed(() => {
    const isDone = (id: string) => this.progress.isDone(id);
    return LEVELS.filter((l) => l.chapter === this.level().chapter).map((l) => ({
      id: l.id,
      title: l.title,
      state: levelState(l, isDone),
    }));
  });
  protected readonly next = computed(() => nextLevel(this.level().id));
  protected readonly nextLink = computed(() => {
    const nx = this.next();
    return nx ? ['/t', this.themeId(), 'example', nx.id] : ['/t', this.themeId()];
  });
  protected readonly nextHref = computed(() =>
    this.router.serializeUrl(this.router.createUrlTree(this.nextLink())),
  );

  private scene?: Scene;
  private ctx?: LevelContext;
  private audio: LevelAudio | null = null;
  private dead = false;
  private readonly owned = new Set<{ terminate(): void }>();
  /** Las cuentas de toques que el guion dejó corriendo en este intento. */
  private readonly touchCounts = new Set<TouchCount>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const lv = this.level();
      // El prólogo no es un ejemplo del catálogo: su código es el de los primos.
      this.ctl.useExample(lv.id === PROLOGUE_ID ? PRIMES_EXAMPLE : lv.id);
      const scene = createScene(this.sceneHost().nativeElement, this.calm);
      this.scene = scene;
      scene.onView(() => this.measureAnchors());
      this.caption.set(this.script().intro);
      this.frameScene();
      const resize = new ResizeObserver(() => this.frameScene());
      resize.observe(this.roomEl().nativeElement);
      destroyRef.onDestroy(() => resize.disconnect());
      const ctx: LevelContext = {
        scene,
        ctl: this.ctl,
        stage: this.stageEl().nativeElement,
        narrate: (text, who = 'main') => {
          if (!this.dead) this.caption.set({ who, text });
        },
        own: (worker) => {
          this.owned.add(worker);
          return worker;
        },
        music: (mood) => this.audio?.mood(mood),
        threads: {
          work: (lane, label) => {
            let id = 0;
            this.tapePausedAt.set(null);
            this.updateThreads((log, now) => {
              const started = startTask(log, lane, 'long', label, now);
              id = started.id;
              return started.log;
            });
            return () => this.updateThreads((log, now) => endTask(log, id, now));
          },
          blip: (lane, kind, label = '') =>
            this.updateThreads((log, now) => blip(log, lane, kind, label, now)),
          enqueue: (kind, arrived) => {
            let id = 0;
            this.updateThreads((log) => {
              const queued = enqueue(log, kind, arrived);
              id = queued.id;
              return queued.log;
            });
            return id;
          },
          take: (id, label, at) => {
            this.updateThreads((log, now) => take(log, id, label, at ?? now), false);
            // Si pasó antes (la escena lo repite despacio), cuenta la hora real.
            this.lastThreadEvent = Math.max(this.lastThreadEvent, at ?? performance.now());
          },
        },
        code: (stepId) => this.showStep(stepId),
        touches: (kind = 'poke') => {
          const count: TouchCount = { kind, n: 0 };
          this.touchCounts.add(count);
          return () => count.n;
        },
      };
      // Con la cinta en pausa no se anota el malabar: quedaría en el futuro.
      scene.onJuggle((ball) => {
        if (this.tapePausedAt() !== null) return;
        this.updateThreads((log, now) => blip(log, 'main', JUGGLED[ball], '', now), false);
      });
      if (this.script().sound) this.audio = createLevelAudio(!this.soundOn());
      scene.onCue((cue) => {
        this.audio?.cue(cue);
        this.countTouch(cue);
      });
      this.ctx = ctx;
      const teardown = this.script().setup?.(ctx);
      destroyRef.onDestroy(() => teardown?.());
      if (this.iris() === 'opening') {
        const opened = setTimeout(() => this.iris.set(null), IRIS_OPEN_MS);
        destroyRef.onDestroy(() => clearTimeout(opened));
      }
    });
    destroyRef.onDestroy(() => {
      this.dead = true;
      for (const w of this.owned) w.terminate();
      this.scene?.destroy();
      this.audio?.destroy();
    });
  }

  private measureAnchors(): void {
    const scene = this.scene;
    if (!scene || this.dead) return;
    const head = (x: number) => scene.toScreen(x, MAIN_AT.y).x;
    // La cara de main (el cuerpo sube ~250 desde los pies) y un radio que la enmarca.
    const face = scene.toScreen(MAIN_AT.x + 10, MAIN_AT.y - 125);
    const rim = scene.toScreen(MAIN_AT.x + 10, MAIN_AT.y - 125 - 175);
    const room = this.roomEl().nativeElement;
    const far = Math.hypot(
      Math.max(face.x, room.clientWidth - face.x),
      Math.max(face.y, room.clientHeight - face.y),
    );
    this.anchors.set({
      face: { ...face, r: Math.max(90, face.y - rim.y), far: Math.ceil(far) + 40 },
      // El ancho que se ve de la escena: sin lo que tapa la hoja del código.
      width: this.roomEl().nativeElement.clientWidth - this.sceneRight,
      choice: {
        main: scene.toScreen(CHOICE_AT.main.x, CHOICE_AT.main.y),
        door: scene.toScreen(CHOICE_AT.door.x, CHOICE_AT.door.y),
      },
      speaker: { main: head(MAIN_AT.x), worker: head(WORKER_AT.x) },
    });
  }

  /**
   * Le dice a la escena qué le tapan el título y el cartel del problema
   * (arriba), el diálogo (abajo) y, al final del nivel, la hoja del código (a
   * la derecha en pantallas anchas, abajo en las angostas). Se mide al entrar,
   * al cambiar el tamaño de la ventana y al ganar o volver a jugar; no cuando
   * cambia el texto, para que la sala no salte con cada línea. Al ganar, la
   * cámara viaja (`pan`).
   */
  private frameScene(pan = false): void {
    // Medidas de maquetación (offset*), no de pantalla: el cartel y la hoja
    // entran animados y su rectángulo en ese momento todavía está corrido.
    // Todo cuelga de `.lv` (el bloque de arriba está pegado a su borde superior).
    const room = this.roomEl().nativeElement;
    const w = room.clientWidth;
    const h = room.clientHeight;
    const bottomOf = (el: HTMLElement) => el.offsetTop + el.offsetHeight;
    // El cartel y los hilos cuelgan juntos de un bloque pegado arriba.
    const top = Math.max(
      bottomOf(this.topEl().nativeElement),
      bottomOf(this.hangEl().nativeElement),
    );
    const sheet = this.sheetEl()?.nativeElement;
    let right = 0;
    let floor = this.talkEl().nativeElement.offsetTop;
    if (sheet && sheet.offsetLeft > w * 0.35) right = w - sheet.offsetLeft + 16;
    else if (sheet) floor = Math.min(floor, sheet.offsetTop);
    this.sceneRight = right;
    this.scene?.frame({ top: top + 8, bottom: Math.min(h - floor + 4, h * 0.6), right }, pan);
  }

  /**
   * Suma un toque a main a las cuentas que el guion dejó corriendo. Sin
   * movimiento la escena no deja arrastrar a main: ahí un toque vale por
   * levantarlo, para que ningún reto quede imposible.
   */
  private countTouch(cue: SceneCue): void {
    const poke = cue.kind === 'poke' && cue.who === 'main';
    if (!poke && cue.kind !== 'lift') return;
    for (const count of this.touchCounts) {
      if (cue.kind === count.kind || (poke && this.calm)) count.n++;
    }
  }

  private updateThreads(
    change: (log: ThreadLog, now: number) => ThreadLog,
    fromScript = true,
  ): void {
    if (this.dead) return;
    const now = performance.now();
    if (fromScript) this.lastThreadEvent = now;
    // Con la cinta en pausa se poda respecto de la hora en que quedó quieta:
    // si no, lo que se está mirando se borraba a los pocos segundos.
    this.threadLog.update((log) => prune(change(log, now), this.tapePausedAt() ?? now));
  }

  /**
   * Muestra un paso del código (si ya estaba, lo vuelve a resaltar). La primera
   * vez se abre la hoja y la cámara se corre; después, la hoja baja hasta él.
   */
  private showStep(stepId: string): void {
    if (this.dead || !this.script().code.some((s) => s.id === stepId)) return;
    const opening = this.revealed().size === 0;
    this.revealed.update((shown) => new Set(shown).add(stepId));
    this.latestStep.set(stepId);
    afterNextRender(
      () => {
        if (this.dead) return;
        if (opening) this.frameScene(true);
        // Solo se mueve la hoja por dentro (en ancho tiene su propio scroll). En
        // angosto la hoja asoma debajo de la escena y la pantalla no se mueve:
        // scrollIntoView movería todo y se perdería la escena.
        const sheet = this.sheetEl()?.nativeElement;
        const step = sheet?.querySelector<HTMLElement>(`[data-step="${stepId}"]`);
        if (sheet && step && sheet.scrollHeight > sheet.clientHeight) {
          sheet.scrollTo({ top: step.offsetTop - 12, behavior: 'smooth' });
        }
      },
      { injector: this.injector },
    );
  }

  /**
   * El diálogo cambia de ancho con una transición (al abrirse o cerrarse la
   * hoja, o al cambiar el tamaño de la ventana) y, con él, de alto: el encuadre
   * medido al empezar queda viejo. Al terminar, la cámara se acomoda.
   */
  protected onTalkMoved(event: TransitionEvent): void {
    if (event.target === event.currentTarget && event.propertyName === 'width') {
      this.frameScene(true);
    }
  }

  protected toggleSound(): void {
    const on = !this.soundOn();
    this.soundOn.set(on);
    writeStored(SOUND_KEY, on ? 'on' : 'off');
    this.audio?.setMuted(!on);
  }

  /** Gana (o vuelve a jugar): cambian el cartel y la hoja, main dice la lección y la cámara se acomoda. */
  protected setWon(won: boolean): void {
    this.won.set(won);
    // Al volver a jugar, las estrellas ya ganadas quedan quietas.
    if (!won) this.freshStars.set(new Set());
    if (won) {
      // Lo que faltaba del código aparece entero, en orden; main dice la lección.
      this.revealed.set(new Set(this.script().code.map((s) => s.id)));
      this.latestStep.set(null);
      this.caption.set({ who: 'main', text: this.script().lesson });
    }
    if (won) this.audio?.cue({ kind: 'win' });
    this.audio?.mood(won ? 'won' : 'main');
    afterNextRender(
      () => {
        if (this.dead) return;
        this.frameScene(true);
        if (won) {
          this.nextBtn()?.nativeElement.focus();
          // El código completo se lee desde arriba.
          this.sheetEl()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      { injector: this.injector },
    );
  }

  /**
   * "Siguiente": el iris se cierra sobre main y recién en lo oscuro cambia el
   * nivel; el que entra lo abre (ver `iris`). Con clic modificado (pestaña
   * nueva) o sin movimiento, el enlace hace lo de siempre.
   */
  protected leave(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (this.iris() === 'closing') return;
    const link = this.nextLink();
    if (this.calm || !this.next()) {
      void this.router.navigate(link);
      return;
    }
    this.iris.set('closing');
    setTimeout(() => {
      if (this.dead) return;
      leftForNextAt = performance.now();
      void this.router.navigate(link);
    }, IRIS_CLOSE_MS);
  }

  protected async run(pathId: string): Promise<void> {
    const ctx = this.ctx;
    if (this.busy() || !ctx) return;
    const id = this.level().id;
    const path = this.script().paths.find((p) => p.id === pathId);
    const wasDone = this.progress.isDone(id);
    const starsBefore = this.earnedStars();
    this.tried.set(true);
    this.busy.set(true);
    this.tapePausedAt.set(null);
    this.audio?.cue({ kind: 'choose' });
    if (this.won()) this.setWon(false);
    const result = await this.script().run(pathId, ctx);
    this.touchCounts.clear();
    // La cinta se rebobina y queda quieta en lo que pasó, para leerlo.
    if (this.lastThreadEvent) {
      this.tapePausedAt.set(Math.min(performance.now(), this.lastThreadEvent + 1200));
    }
    this.audio?.mood('main');
    for (const w of this.owned) w.terminate();
    this.owned.clear();
    if (this.dead) return;
    this.caption.set(result.caption);
    if (result.completed) this.progress.completePath(id, pathId);
    if (result.challenge) this.progress.completeChallenge(id);
    const fresh = new Set([...this.earnedStars()].filter((star) => !starsBefore.has(star)));
    this.busy.set(false);
    // El cartel de "superado" vuelve con el camino del patrón o con una estrella
    // nueva (la del otro camino se gana después de haber superado el nivel).
    if (this.progress.isDone(id) && (path?.primary || fresh.size)) {
      if (!wasDone || fresh.size) ctx.scene.celebrate();
      // Un respiro para ver el festejo antes del cartel.
      setTimeout(() => {
        if (this.dead) return;
        this.freshStars.set(fresh);
        this.setWon(true);
      }, 900);
    }
  }

  private earnedStars(): ReadonlySet<StarId> {
    return new Set(
      this.stars()
        .filter((s) => s.earned)
        .map((s) => s.id),
    );
  }
}
