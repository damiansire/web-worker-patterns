import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { ThemeService } from '../../../theming/theme.service';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { createScene, Scene } from './scene/scene';
import { StoryProgress } from './story-progress.service';
import { CHAPTERS, Level, LEVELS, levelState, nextLevel, PROLOGUE_ID } from './story.levels';
import { LevelContext, SCRIPTS } from './story.scripts';

/**
 * Pantalla de un nivel con escena, a pantalla completa como el mapa: la sala
 * llena la ventana; arriba, dentro del mundo, el título del nivel, la vuelta al
 * mapa y las paradas del capítulo; abajo, sobre el piso, el cuadro de diálogo
 * con lo que pasa y las opciones. La escena se encuadra sola (`Scene.frame`)
 * para que main, el reloj, el tablero y la puerta nunca queden tapados.
 * Al recorrer el camino del patrón, el nivel queda superado: cae el cartel y el
 * diálogo pasa a la lección y al siguiente paso, sin modal ni fondo oscurecido.
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
    <article #room class="lv" [attr.data-chapter]="level().chapter" [class.is-won]="won()">
      <div class="jh lv-scene">
        <div #stage class="jh-stage">
          <div #scene class="jh-scene" aria-hidden="true"></div>
          <div class="jh-vignette"></div>
        </div>
      </div>

      <header #top class="lv-top">
        <a class="lv-back" [routerLink]="['/t', themeId()]">
          <span class="lv-back-arrow" aria-hidden="true"></span>
          Mapa
        </a>
        <div class="lv-heading">
          <p class="lv-where" [attr.data-ink]="where()">{{ where() }}</p>
          <h1 class="lv-title" [attr.data-ink]="level().title">{{ level().title }}</h1>
        </div>
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
      </header>

      <!-- Con el código abierto, el diálogo crece hacia arriba: el cartel se va. -->
      @if (won() && !showCode()) {
        <p class="lv-ribbon" data-ink="¡Nivel superado!">¡Nivel superado!</p>
      }

      <section #talk class="lv-talk" [attr.aria-label]="won() ? 'Nivel superado' : 'Qué pasa'">
        <p class="lv-sr" aria-live="polite">{{ won() ? script().lesson : caption() }}</p>
        @for (line of shownLine(); track line) {
          <p class="lv-line" aria-hidden="true">{{ line }}</p>
        }
        @if (won()) {
          <div class="lv-paths">
            <a #nextBtn class="lv-pill lv-pill--gold" [routerLink]="nextLink()">
              <span class="lv-pill-tri" aria-hidden="true"></span>
              {{ nextLabel() }}
            </a>
            <button type="button" class="lv-pill" (click)="won.set(false)">Jugar de nuevo</button>
            @if (snippets().length) {
              <button type="button" class="lv-pill" (click)="showCode.set(!showCode())">
                {{ showCode() ? 'Ocultar el código' : 'Ver el código' }}
              </button>
            }
          </div>
          @if (showCode()) {
            <div class="lv-code">
              @for (s of snippets(); track s.label) {
                <default-code-block [label]="s.label" [code]="s.code" />
              }
            </div>
          }
        } @else {
          <p class="lv-task" [class.is-quiet]="busy()">
            <span class="lv-task-tag">✦ Tu turno ✦</span>
            {{ script().task }}
          </p>
          <div class="lv-paths" [class.is-quiet]="busy()">
            @for (p of script().paths; track p.id) {
              <button
                type="button"
                class="lv-pill"
                [class.lv-pill--gold]="p.primary"
                [disabled]="busy()"
                (click)="run(p.id)"
              >
                <span class="lv-pill-tri" aria-hidden="true"></span>
                {{ p.label }}
                @if (pathDone(p.id)) {
                  <span class="lv-pill-check" aria-label="ya recorrido">✓</span>
                }
              </button>
            }
            @if (done()) {
              <a class="lv-pill lv-pill--quiet" [routerLink]="nextLink()">{{ nextLabel() }} →</a>
            }
          </div>
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
  protected readonly themeId = inject(ThemeService).activeId;
  private readonly sceneHost = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly stageEl = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly nextBtn = viewChild<ElementRef<HTMLElement>>('nextBtn');
  private readonly roomEl = viewChild.required<ElementRef<HTMLElement>>('room');
  private readonly topEl = viewChild.required<ElementRef<HTMLElement>>('top');
  private readonly talkEl = viewChild.required<ElementRef<HTMLElement>>('talk');

  protected readonly script = computed(() => SCRIPTS[this.level().scene!]);
  protected readonly snippets = this.ctl.snippets;
  protected readonly caption = signal('');
  protected readonly busy = signal(false);
  protected readonly won = signal(false);
  protected readonly showCode = signal(false);
  /** La línea del diálogo, en un arreglo para rearmar el párrafo (y su entrada) en cada cambio. */
  protected readonly shownLine = computed(() => [
    this.won() ? this.script().lesson : this.caption(),
  ]);

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
      if (lv.id !== PROLOGUE_ID) this.ctl.useExample(lv.id);
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scene = createScene(this.sceneHost().nativeElement, calm);
      this.scene = scene;
      this.frameScene();
      const resize = new ResizeObserver(() => this.frameScene());
      resize.observe(this.roomEl().nativeElement);
      destroyRef.onDestroy(() => resize.disconnect());
      const ctx: LevelContext = {
        scene,
        ctl: this.ctl,
        stage: this.stageEl().nativeElement,
        narrate: (text) => {
          if (!this.dead) this.caption.set(text);
        },
        own: (worker) => {
          this.owned.add(worker);
          return worker;
        },
      };
      this.ctx = ctx;
      this.caption.set(this.script().intro);
      const teardown = this.script().setup?.(ctx);
      destroyRef.onDestroy(() => teardown?.());
    });
    destroyRef.onDestroy(() => {
      this.dead = true;
      for (const w of this.owned) w.terminate();
      this.scene?.destroy();
    });
  }

  /**
   * Le dice a la escena cuánto ocupan el título (arriba) y el diálogo (abajo).
   * Se mide al entrar y al cambiar el tamaño de la ventana, no cuando cambia el
   * texto: si no, la sala saltaría con cada línea.
   */
  private frameScene(): void {
    const room = this.roomEl().nativeElement.clientHeight;
    const top = this.topEl().nativeElement.getBoundingClientRect().height;
    const talk = this.talkEl().nativeElement.getBoundingClientRect().height;
    this.scene?.frame({ top: top + 12, bottom: Math.min(talk + 28, room * 0.42) });
  }

  protected pathDone(pathId: string): boolean {
    return this.progress.isPathDone(this.level().id, pathId);
  }

  protected async run(pathId: string): Promise<void> {
    const ctx = this.ctx;
    if (this.busy() || !ctx) return;
    const id = this.level().id;
    const path = this.script().paths.find((p) => p.id === pathId);
    const wasDone = this.progress.isDone(id);
    this.busy.set(true);
    this.won.set(false);
    this.showCode.set(false);
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
        if (this.dead) return;
        this.won.set(true);
        setTimeout(() => this.nextBtn()?.nativeElement.focus());
      }, 900);
    }
  }
}
