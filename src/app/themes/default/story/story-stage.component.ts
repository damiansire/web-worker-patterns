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
import { RouterLink } from '@angular/router';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { readStored, writeStored } from '../../../core/utils/safe-storage';
import { ThemeService } from '../../../theming/theme.service';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { createScene, Scene, Who } from './scene/scene';
import { CHOICE_AT, MAIN_AT, WORKER_AT } from './scene/scene.art';
import { StoryProgress } from './story-progress.service';
import { StoryThreadsComponent } from './story-threads.component';
import { createLevelAudio, LevelAudio } from './story.audio';
import { CHAPTERS, Level, LEVELS, levelState, nextLevel, PROLOGUE_ID } from './story.levels';
import { LevelContext, Line, PRIMES_EXAMPLE, SCRIPTS } from './story.scripts';
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

/** Qué atiende main con cada pelota del malabar. */
const JUGGLED: readonly TaskKind[] = ['click', 'scroll', 'frame'];

const SOUND_KEY = 'wwp-story-sound';

/** Dónde caen, en píxeles de la pantalla, las cosas de la escena que la pantalla señala. */
interface Anchors {
  width: number;
  choice: Record<'main' | 'door', { x: number; y: number }>;
  speaker: Record<Who, number>;
}

/**
 * Pantalla de un nivel con escena, a pantalla completa como el mapa y como un
 * juego: la sala llena la ventana y todo vive en el mundo.
 *  - Arriba: el título del nivel, la vuelta al mapa y las paradas del capítulo.
 *  - Colgado en el centro: el problema del nivel, en grande (al ganar, el mismo
 *    cartel dice "¡Nivel superado!").
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
          <div class="lv-heading">
            <p class="lv-where" [attr.data-ink]="where()">{{ where() }}</p>
            <h1 class="lv-title" [attr.data-ink]="level().title">{{ level().title }}</h1>
          </div>
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
            } @else if (done()) {
              <a class="lv-chip lv-chip--gold" [routerLink]="nextLink()">{{ nextLabel() }} →</a>
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
          [disabled]="busy() || won()"
          [style.left.px]="c.x"
          [style.top.px]="c.y"
          [style.--lv-x]="c.x + 'px'"
          (click)="run(c.id)"
        >
          <span class="lv-choice-bob">
            ✦ {{ c.label }} ✦
            @if (c.done) {
              <span class="lv-choice-check" aria-label="ya probado">✓</span>
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
          [routerLink]="nextLink()"
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
  styleUrls: ['./scene/scene.scss', './story-stage.component.scss'],
})
export class StoryStageComponent {
  readonly level = input.required<Level>();

  private readonly ctl = inject(ExampleLayoutController);
  private readonly progress = inject(StoryProgress);
  private readonly injector = inject(Injector);
  protected readonly themeId = inject(ThemeService).activeId;
  private readonly sceneHost = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly stageEl = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly nextBtn = viewChild<ElementRef<HTMLElement>>('nextBtn');
  private readonly roomEl = viewChild.required<ElementRef<HTMLElement>>('room');
  private readonly topEl = viewChild.required<ElementRef<HTMLElement>>('top');
  private readonly hangEl = viewChild.required<ElementRef<HTMLElement>>('hang');
  private readonly talkEl = viewChild.required<ElementRef<HTMLElement>>('talk');
  private readonly sheetEl = viewChild<ElementRef<HTMLElement>>('sheet');

  protected readonly script = computed(() => SCRIPTS[this.level().scene!]);
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
  /** Hacia dónde apunta la colita del diálogo: quien habla. */
  protected readonly tailX = computed(() => this.anchors()?.speaker[this.caption().who] ?? 0);

  protected readonly done = computed(() => this.progress.isDone(this.level().id));
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
  protected readonly nextLabel = computed(() => {
    const nx = this.next();
    if (!nx) return 'Volver al mapa';
    return `Siguiente: ${nx.title}${nx.scene ? '' : ' (en obra)'}`;
  });

  private scene?: Scene;
  private ctx?: LevelContext;
  private audio: LevelAudio | null = null;
  private dead = false;
  private readonly owned = new Set<{ terminate(): void }>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const lv = this.level();
      // El prólogo no es un ejemplo del catálogo: su código es el de los primos.
      this.ctl.useExample(lv.id === PROLOGUE_ID ? PRIMES_EXAMPLE : lv.id);
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scene = createScene(this.sceneHost().nativeElement, calm);
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
      };
      // Con la cinta en pausa no se anota el malabar: quedaría en el futuro.
      scene.onJuggle((ball) => {
        if (this.tapePausedAt() !== null) return;
        this.updateThreads((log, now) => blip(log, 'main', JUGGLED[ball], '', now), false);
      });
      if (this.script().sound) {
        this.audio = createLevelAudio(!this.soundOn());
        scene.onCue((cue) => this.audio?.cue(cue));
      }
      this.ctx = ctx;
      const teardown = this.script().setup?.(ctx);
      destroyRef.onDestroy(() => teardown?.());
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
    this.anchors.set({
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
    this.scene?.frame({ top: top + 8, bottom: Math.min(h - floor + 24, h * 0.6), right }, pan);
  }

  private updateThreads(
    change: (log: ThreadLog, now: number) => ThreadLog,
    fromScript = true,
  ): void {
    if (this.dead) return;
    const now = performance.now();
    if (fromScript) this.lastThreadEvent = now;
    this.threadLog.update((log) => prune(change(log, now), now));
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

  protected async run(pathId: string): Promise<void> {
    const ctx = this.ctx;
    if (this.busy() || !ctx) return;
    const id = this.level().id;
    const path = this.script().paths.find((p) => p.id === pathId);
    const wasDone = this.progress.isDone(id);
    this.busy.set(true);
    this.tapePausedAt.set(null);
    this.audio?.cue({ kind: 'choose' });
    if (this.won()) this.setWon(false);
    const result = await this.script().run(pathId, ctx);
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
    this.busy.set(false);
    if (path?.primary && this.progress.isDone(id)) {
      if (!wasDone) ctx.scene.celebrate();
      // Un respiro para ver el festejo antes del cartel.
      setTimeout(() => {
        if (!this.dead) this.setWon(true);
      }, 900);
    }
  }
}
