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
import { DefaultButton } from '../primitives/default-button.component';
import { DefaultCodeBlock } from '../primitives/default-code-block.component';
import { createScene, Scene } from './scene/scene';
import { StoryProgress } from './story-progress.service';
import { CHAPTERS, Level, LEVELS, levelState, nextLevel, PROLOGUE_ID } from './story.levels';
import { LevelContext, SCRIPTS } from './story.scripts';

/**
 * Pantalla de un nivel con escena: arriba dónde estás, en el medio la escena
 * viva, abajo la línea de diálogo y los caminos posibles. Al recorrer el camino
 * del patrón, el nivel queda superado: sale el cartel con la lección y el paso
 * al siguiente. Sin encapsulación: la escena crea su SVG por código y su CSS
 * cuelga de `.jh`; el de esta pantalla, de `.lv`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'default-story-stage',
  imports: [RouterLink, DefaultButton, DefaultCodeBlock],
  providers: [ExampleLayoutController],
  template: `
    <article class="lv" [attr.data-chapter]="level().chapter">
      <header class="lv-bar">
        <a class="lv-back" [routerLink]="['/t', themeId()]">← mapa</a>
        <div class="lv-heading">
          <p class="lv-where">{{ where() }}</p>
          <h1 class="lv-title">{{ level().title }}</h1>
        </div>
        <ol class="lv-dots" aria-label="Niveles de este capítulo">
          @for (d of dots(); track d.id) {
            <li
              [attr.data-state]="d.state"
              [class.is-here]="d.id === level().id"
              [attr.aria-label]="d.title + (d.state === 'done' ? ', superado' : '')"
            ></li>
          }
        </ol>
      </header>

      <div class="jh lv-scene">
        <div #stage class="jh-stage">
          <div #scene class="jh-scene" aria-hidden="true"></div>
          <div class="jh-vignette"></div>
        </div>
      </div>

      <section class="lv-panel" aria-label="Qué hacer">
        <p class="lv-line" aria-live="polite">{{ caption() }}</p>
        <p class="lv-task"><strong>Tu turno:</strong> {{ script().task }}</p>
        <div class="lv-paths">
          @for (p of script().paths; track p.id) {
            <default-button
              [variant]="p.primary ? 'solid' : 'ghost'"
              [disabled]="busy()"
              (pressed)="run(p.id)"
            >
              @if (pathDone(p.id)) {
                <span class="lv-check" aria-label="ya recorrido">✓</span>
              }
              {{ p.label }}
            </default-button>
          }
          @if (done() && !won()) {
            <a class="lv-next lv-next--quiet" [routerLink]="nextLink()">{{ nextLabel() }} →</a>
          }
        </div>
      </section>

      @if (won()) {
        <div class="lv-win" role="dialog" aria-labelledby="lv-win-title">
          <div class="lv-win-card">
            <p class="lv-win-kicker">¡Nivel superado!</p>
            <h2 id="lv-win-title">{{ level().title }}</h2>
            <p class="lv-win-lesson">{{ script().lesson }}</p>
            <div class="lv-win-actions">
              <a #nextBtn class="lv-next" [routerLink]="nextLink()">{{ nextLabel() }} →</a>
              <default-button (pressed)="won.set(false)">Jugar de nuevo</default-button>
              @if (snippets().length) {
                <default-button (pressed)="showCode.set(!showCode())">
                  {{ showCode() ? 'Ocultar el código' : 'Ver el código' }}
                </default-button>
              }
            </div>
            @if (showCode()) {
              <div class="lv-code">
                @for (s of snippets(); track s.label) {
                  <default-code-block [label]="s.label" [code]="s.code" />
                }
              </div>
            }
          </div>
        </div>
      }
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

  protected readonly script = computed(() => SCRIPTS[this.level().scene!]);
  protected readonly snippets = this.ctl.snippets;
  protected readonly caption = signal('');
  protected readonly busy = signal(false);
  protected readonly won = signal(false);
  protected readonly showCode = signal(false);

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
