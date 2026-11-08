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
import { ThemeService } from '../../../theming/theme.service';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { createScene, Scene, Who } from './scene/scene';
import { CHOICE_AT, MAIN_AT, WORKER_AT } from './scene/scene.art';
import { StoryProgress } from './story-progress.service';
import { CHAPTERS, Level, LEVELS, levelState, nextLevel, PROLOGUE_ID } from './story.levels';
import { LevelContext, Line, PRIMES_EXAMPLE, SCRIPTS } from './story.scripts';

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
 *  - En la escena: las opciones, como etiquetas sobre quien haría el trabajo
 *    (main, o la puerta por donde entra el worker). No hay botones en el diálogo.
 *  - Abajo, sobre el piso: el diálogo, con quién habla y la colita hacia él.
 *  - Al final de cada nivel: la hoja con el código, siempre abierta; la cámara
 *    se corre para dejarle lugar y main y el worker siguen a la vista.
 * La escena se encuadra sola (`Scene.frame`) para que nada de esto la tape.
 * Sin encapsulación: la escena crea su SVG por código y su CSS cuelga de `.jh`;
 * el de esta pantalla, de `.lv`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'default-story-stage',
  imports: [RouterLink, DefaultCodeBlock],
  providers: [ExampleLayoutController],
  template: `
    <article
      #room
      class="lv"
      [attr.data-chapter]="level().chapter"
      [class.is-won]="won()"
      [class.has-sheet]="won() && snippets().length > 0"
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

        <section #sign class="lv-sign" [class.is-solved]="won()" aria-labelledby="lv-sign-ask">
          <p class="lv-sign-kicker">{{ won() ? '✦ Problema resuelto ✦' : '✦ El problema ✦' }}</p>
          <p class="lv-sign-what">{{ script().problem.what }}</p>
          <h2 id="lv-sign-ask" class="lv-sign-ask">
            {{ won() ? '¡Nivel superado!' : script().problem.ask }}
          </h2>
        </section>
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

      @if (won() && snippets().length) {
        <section #sheet class="lv-sheet" aria-labelledby="lv-sheet-title">
          <p class="lv-sheet-kicker">✦ Así se escribe ✦</p>
          <h2 id="lv-sheet-title" class="lv-sheet-title">El código de este nivel</h2>
          <div class="lv-code">
            @for (s of snippets(); track s.label) {
              <default-code-block [label]="s.label" [code]="s.code" />
            }
          </div>
        </section>
      }

      <section
        #talk
        class="lv-talk"
        [attr.data-who]="won() ? 'lesson' : caption().who"
        [attr.aria-label]="won() ? 'Lo que aprendiste' : 'Habla ' + caption().who"
        (transitionend)="onTalkMoved($event)"
      >
        <p class="lv-sr" aria-live="polite">{{ shownLine()[0] }}</p>
        <span class="lv-who" aria-hidden="true">{{
          won() ? '✦ lo que aprendiste ✦' : caption().who
        }}</span>
        @for (text of shownLine(); track text) {
          <p class="lv-line" aria-hidden="true">{{ text }}</p>
        }
        @if (won()) {
          <a #nextBtn class="lv-pill lv-pill--gold" [routerLink]="nextLink()">
            <span class="lv-pill-tri" aria-hidden="true"></span>
            {{ nextLabel() }}
          </a>
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
  private readonly signEl = viewChild.required<ElementRef<HTMLElement>>('sign');
  private readonly talkEl = viewChild.required<ElementRef<HTMLElement>>('talk');
  private readonly sheetEl = viewChild<ElementRef<HTMLElement>>('sheet');

  protected readonly script = computed(() => SCRIPTS[this.level().scene!]);
  protected readonly snippets = this.ctl.snippets;
  protected readonly caption = signal<Line>({ who: 'main', text: '' });
  protected readonly busy = signal(false);
  protected readonly won = signal(false);
  /** La línea del diálogo, en un arreglo para rearmar el párrafo (y su entrada) en cada cambio. */
  protected readonly shownLine = computed(() => [
    this.won() ? this.script().lesson : this.caption().text,
  ]);

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
  private readonly next = computed(() => nextLevel(this.level().id));
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
      };
      this.ctx = ctx;
      const teardown = this.script().setup?.(ctx);
      destroyRef.onDestroy(() => teardown?.());
    });
    destroyRef.onDestroy(() => {
      this.dead = true;
      for (const w of this.owned) w.terminate();
      this.scene?.destroy();
    });
  }

  private measureAnchors(): void {
    const scene = this.scene;
    if (!scene || this.dead) return;
    const head = (x: number) => scene.toScreen(x, MAIN_AT.y).x;
    this.anchors.set({
      width: this.roomEl().nativeElement.clientWidth,
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
    const top = Math.max(
      bottomOf(this.topEl().nativeElement),
      bottomOf(this.signEl().nativeElement),
    );
    const sheet = this.sheetEl()?.nativeElement;
    let right = 0;
    let floor = this.talkEl().nativeElement.offsetTop;
    if (sheet && sheet.offsetLeft > w * 0.35) right = w - sheet.offsetLeft + 16;
    else if (sheet) floor = Math.min(floor, sheet.offsetTop);
    this.scene?.frame({ top: top + 8, bottom: Math.min(h - floor + 24, h * 0.6), right }, pan);
  }

  /** Gana (o vuelve a jugar): cambian el cartel, el diálogo y la hoja, y la cámara se acomoda. */
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

  protected setWon(won: boolean): void {
    this.won.set(won);
    afterNextRender(
      () => {
        if (this.dead) return;
        this.frameScene(true);
        if (won) this.nextBtn()?.nativeElement.focus();
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
    if (this.won()) this.setWon(false);
    const result = await this.script().run(pathId, ctx);
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
