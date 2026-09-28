import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { fill, MissionContent, PathContent } from '../../../core/domain/learning/content.model';
import { findMission, MissionPath } from '../../../core/domain/learning/missions';
import { morph, Segment } from '../../../core/domain/learning/morph';
import { findTerm, TermId, VOCABULARY } from '../../../core/domain/learning/vocabulary';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { LearningContentService } from '../../../core/services/learning-content.service';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { BLOCKS_MAIN, LIVE, RUNNERS, Values } from '../missions/mission-runner';
import { RpgPulseComponent } from '../primitives/rpg-pulse.component';
import { MAP_HEIGHT, MAP_WIDTH, paint, Person, TILE } from '../world/painter';
import {
  GUARD_ID,
  GUARD_LOOK,
  gridOf,
  nextRegion,
  PLAYER_LOOK,
  previousRegion,
  Region,
  regionOfExample,
  WORLD,
} from '../world/regions';
import {
  Actor,
  actorAt,
  approach,
  Dir,
  dirBetween,
  facingActor,
  findPath,
  isWalkable,
  Point,
  step,
  tileAt,
} from '../world/world.logic';

interface Choice {
  label: string;
  done: boolean;
  run: () => void;
}

interface Dialog {
  who: string;
  segments: Segment[];
  choices: Choice[];
  /** Hay más líneas: se avanza con "Seguir". */
  more: boolean;
}

interface Line {
  who: string;
  text: string;
  values?: Values;
  /** Idioma con el que se lee esta línea (el de antes de aprender lo que enseña). */
  learned?: ReadonlySet<TermId>;
}

const STEP_MS = 130;
const RUN_TIMEOUT_MS = 90_000;
const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/**
 * El juego: un mundo que se camina, vecinos que dan misiones y un texto que va
 * cambiando de idioma a medida que se aprende. Es el `home` y el `exampleLayout`
 * del theme `rpg`: con un id de ejemplo en la ruta, el jugador aparece al lado del
 * vecino de ese patrón.
 *
 * Toda la regla vive en `core/domain/learning` y en los servicios de cada demo.
 * Esto es presentación: dibuja, escucha el teclado y conversa.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rpg-game',
  imports: [RpgPulseComponent],
  providers: [ExampleLayoutController],
  templateUrl: './rpg-game.component.html',
  styleUrl: './rpg-game.component.scss',
  host: { '(keydown)': 'onKeyDown($event)', '(keyup)': 'onKeyUp()' },
})
export class RpgGameComponent {
  private readonly ctl = inject(ExampleLayoutController);
  private readonly progress = inject(LearningProgressService);
  private readonly injector = inject(Injector);
  private readonly routeId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('map');
  private readonly jsBox = viewChild<ElementRef<HTMLElement>>('jsBox');
  private readonly ocWorker = viewChild<ElementRef<HTMLCanvasElement>>('ocWorker');
  private readonly ocMain = viewChild<ElementRef<HTMLCanvasElement>>('ocMain');

  protected readonly content = inject(LearningContentService).content;
  protected readonly ui = computed(() => this.content()?.ui ?? {});
  protected readonly mapWidth = MAP_WIDTH;
  protected readonly mapHeight = MAP_HEIGHT;

  // ── mundo ──
  protected readonly region = signal<Region>(WORLD[0]);
  private readonly position = signal<Point>(WORLD[0].entry);
  private readonly facing = signal<Dir>('up');
  protected readonly regionName = computed(() => this.content()?.regions[this.region().id] ?? '');
  private readonly regionDone = computed(() => this.progress.isRegionDone(this.region().id));
  private readonly grid = computed(() => gridOf(this.region(), this.regionDone()));

  // ── estado del main ──
  protected readonly mode = signal<'free' | 'frozen' | 'busy'>('free');
  protected readonly modeLabel = computed(() => this.ui()[this.mode()] ?? '');

  // ── conversación ──
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly midAction = signal<{ label: string; take: () => void } | null>(null);
  private readonly activeId = signal('');
  private readonly running = signal(false);
  protected readonly live = computed(() => {
    const read = LIVE[this.activeId()];
    return this.running() && read ? read(this.ctl) : '';
  });
  /** La escena que acompaña a una misión: molinetes (16) o relojes (14). */
  protected readonly scene = computed(() => {
    const demo = this.dialog() ? this.ctl.example()?.demo : undefined;
    return demo === 'compositor-jank' || demo === 'offscreen-canvas' ? demo : null;
  });

  // ── progreso ──
  protected readonly done = this.progress.doneCount;
  protected readonly total = this.progress.total;
  protected readonly vocabularySize = VOCABULARY.length;
  protected readonly words = computed(() => {
    const vocab = this.content()?.vocab ?? {};
    const learned = this.progress.learned();
    return VOCABULARY.filter((term) => learned.has(term.id)).map((term) => ({
      ...term,
      plain: vocab[term.id]?.plain ?? '',
      note: vocab[term.id]?.note ?? '',
    }));
  });
  protected readonly confirmingRestart = signal(false);

  /** Los vecinos de la región, como lista: navegar sin depender del mapa. */
  protected readonly neighbors = computed(() => {
    const missions = this.content()?.missions ?? {};
    return this.grid().actors.map((actor) => ({
      actor,
      name: actor.id === GUARD_ID ? this.ui()['guard'] : (missions[actor.id]?.npc ?? ''),
      done: actor.id !== GUARD_ID && this.progress.isMissionDone(actor.id),
    }));
  });

  // ── movimiento (fuera de signals: cambia 60 veces por segundo) ──
  private drawAt: Point = WORLD[0].entry;
  private walk: Point[] = [];
  private from: Point = WORLD[0].entry;
  private stepStart = 0;
  private moving = false;
  private held: Dir | null = null;
  private raf = 0;
  private talkOnArrival: Actor | null = null;
  private steps = 0;
  private lines: Line[] = [];
  private afterLines: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.raf));

    // Con un ejemplo en la ruta, el jugador aparece al lado de ese vecino.
    effect(() => {
      const id = this.routeId();
      untracked(() => this.placeNear(id));
    });

    // Todo lo que cambia el dibujo sin ser movimiento: región, avance, congelado.
    effect(() => {
      this.grid();
      this.done(); // los cartelitos de cada vecino cambian al cumplir su misión
      this.mode();
      this.position();
      this.facing();
      this.content();
      this.canvas();
      untracked(() => this.draw());
    });

    // Los relojes gemelos (misión 14) giran desde que se abre la conversación. Ceder
    // un canvas a un worker es de una sola vez: por eso se arranca al crearlos.
    effect(() => {
      const canvases = this.sceneCanvases();
      if (canvases) {
        untracked(() => this.ctl.startOffscreen(canvases.worker, canvases.main));
      }
    });

    // La caja que gira por JS (misión 16) la mueve el servicio del ejemplo.
    effect(() => this.ctl.setCompositorJsBox(this.jsBox()?.nativeElement));

    afterNextRender(() => this.canvas()?.nativeElement.focus({ preventScroll: true }));
  }

  // ── entrada ──

  protected onKeyDown(event: KeyboardEvent): void {
    const onButton = event.target instanceof HTMLButtonElement;
    const dir = KEYS[event.key];
    if (dir) {
      event.preventDefault();
      this.held = dir;
      this.tryStep(dir);
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && !onButton) {
      event.preventDefault();
      this.talk();
      return;
    }
    const choice = this.dialog()?.choices[Number(event.key) - 1];
    if (choice && !onButton) {
      choice.run();
    }
  }

  protected onKeyUp(): void {
    this.held = null;
  }

  protected onMapClick(event: MouseEvent): void {
    const cv = this.canvas()?.nativeElement;
    if (!cv || this.isLocked()) return;
    const box = cv.getBoundingClientRect();
    const x = Math.floor(((event.clientX - box.left) / box.width) * (MAP_WIDTH / TILE));
    const y = Math.floor(((event.clientY - box.top) / box.height) * (MAP_HEIGHT / TILE));
    const actor = actorAt(this.grid(), x, y);
    if (actor) {
      this.goTalk(actor);
    } else if (isWalkable(this.grid(), x, y)) {
      this.talkOnArrival = null;
      this.startWalk(findPath(this.grid(), this.position(), { x, y }));
    }
  }

  /** Camina hasta alguien y le habla. */
  protected goTalk(actor: Actor): void {
    if (this.isLocked()) return;
    const plan = approach(this.grid(), this.position(), actor);
    if (!plan) return;
    if (plan.path.length === 0) {
      this.facing.set(plan.facing);
      this.talkTo(actor);
      return;
    }
    this.talkOnArrival = actor;
    this.startWalk(plan.path);
  }

  /** Espacio o el botón: avanza la conversación o le habla a quien está adelante. */
  protected talk(): void {
    const dialog = this.dialog();
    if (dialog) {
      if (dialog.more) this.nextLine();
      else if (dialog.choices.length === 0 && !this.running()) this.close();
      return;
    }
    const actor = facingActor(this.grid(), this.position(), this.facing());
    if (actor) {
      this.talkTo(actor);
    } else {
      this.play([{ who: this.ui()['guide'], text: this.ui()['nobody'] }]);
    }
  }

  // ── movimiento ──

  /** Mientras se elige qué hacer no se camina. Mientras un ayudante trabaja, sí. */
  private isLocked(): boolean {
    const dialog = this.dialog();
    return !!dialog && !this.running() && (dialog.more || dialog.choices.length > 0);
  }

  /** Deja que el navegador pinte lo que acaba de cambiar antes de seguir. */
  private nextPaint(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }

  private tryStep(dir: Dir): void {
    if (this.moving || this.isLocked()) return;
    this.facing.set(dir);
    const next = step(this.position(), dir);
    if (isWalkable(this.grid(), next.x, next.y)) {
      this.talkOnArrival = null;
      this.startWalk([next]);
    }
  }

  private startWalk(path: Point[]): void {
    if (path.length === 0) return;
    // Caminar cierra una conversación que ya no espera nada.
    if (this.dialog() && !this.running()) this.dialog.set(null);
    this.walk = path;
    if (!this.moving) this.nextStep(performance.now());
  }

  private nextStep(now: number): void {
    const target = this.walk.shift();
    if (!target || !isWalkable(this.grid(), target.x, target.y)) {
      this.walk = [];
      this.moving = false;
      this.arrive();
      return;
    }
    this.from = this.position();
    this.facing.set(dirBetween(this.from, target));
    this.position.set(target);
    this.stepStart = now;
    this.moving = true;
    if (this.running()) this.steps += 1;
    this.raf = requestAnimationFrame((time) => this.animate(time));
  }

  private animate(now: number): void {
    const t = Math.min(1, (now - this.stepStart) / STEP_MS);
    const to = this.position();
    this.drawAt = {
      x: this.from.x + (to.x - this.from.x) * t,
      y: this.from.y + (to.y - this.from.y) * t,
    };
    this.draw();
    if (t < 1) {
      this.raf = requestAnimationFrame((time) => this.animate(time));
      return;
    }
    this.moving = false;
    if (this.crossExit()) return;
    if (this.walk.length > 0) {
      this.nextStep(now);
    } else if (this.held) {
      this.tryStep(this.held);
    } else {
      this.arrive();
    }
  }

  private arrive(): void {
    const actor = this.talkOnArrival;
    this.talkOnArrival = null;
    if (!actor) return;
    const spot = this.position();
    if (Math.abs(spot.x - actor.x) + Math.abs(spot.y - actor.y) === 1) {
      this.facing.set(dirBetween(spot, actor));
      this.talkTo(actor);
    }
  }

  /** Pisar una salida cambia de región. */
  private crossExit(): boolean {
    const { x, y } = this.position();
    const tile = tileAt(this.grid(), x, y);
    const target =
      tile === '>'
        ? nextRegion(this.region())
        : tile === '<'
          ? previousRegion(this.region())
          : null;
    if (!target) return false;
    this.enter(target, tile === '>' ? target.entry : target.back, tile === '>' ? 'right' : 'left');
    return true;
  }

  private enter(region: Region, at: Point, facing: Dir): void {
    this.walk = [];
    this.talkOnArrival = null;
    this.dialog.set(null);
    this.region.set(region);
    this.position.set(at);
    this.drawAt = at;
    this.facing.set(facing);
  }

  private placeNear(exampleId: string): void {
    const region = regionOfExample(exampleId);
    const neighbor = region?.neighbors.find((candidate) => candidate.id === exampleId);
    if (!region || !neighbor) {
      this.enter(this.firstOpenRegion(), this.firstOpenRegion().entry, 'up');
      return;
    }
    const grid = gridOf(region, this.progress.isRegionDone(region.id));
    const plan = approach(grid, region.entry, neighbor);
    const spot = plan?.path.at(-1) ?? region.entry;
    this.enter(region, spot, plan?.facing ?? 'up');
  }

  /** Al volver al juego se aparece en la región donde quedó trabajo por hacer. */
  private firstOpenRegion(): Region {
    const pending = WORLD.find((region) => !this.progress.isRegionDone(region.id));
    return pending && this.progress.isRegionOpen(pending.id) ? pending : WORLD[0];
  }

  // ── conversación ──

  private talkTo(actor: Actor): void {
    if (this.running()) return;
    const content = this.content();
    if (!content) return;
    if (actor.id === GUARD_ID) {
      this.talkToGuard();
      return;
    }
    const mission = findMission(actor.id);
    const written = content.missions[actor.id];
    if (!mission || !written) return;

    this.activeId.set(actor.id);
    this.ctl.useExample(actor.id);
    const opening = this.progress.isMissionDone(actor.id) ? written.done : written.hello;
    this.play([{ who: written.npc, text: opening }], () => this.ask(actor.id));
  }

  private talkToGuard(): void {
    const content = this.content()!;
    const ui = content.ui;
    const next = nextRegion(this.region());
    if (this.regionDone() && next) {
      const text = fill(ui['guardOpen'], { next: content.regions[next.id] });
      this.play([{ who: ui['guard'], text }]);
      return;
    }
    const pending = this.region()
      .neighbors.filter((neighbor) => !this.progress.isMissionDone(neighbor.id))
      .map((neighbor) => content.missions[neighbor.id]?.npc)
      .slice(0, 2)
      .join(' y ');
    this.play([{ who: ui['guard'], text: fill(ui['guardLocked'], { names: pending }) }]);
  }

  private ask(exampleId: string): void {
    const mission = findMission(exampleId);
    const written = this.content()?.missions[exampleId];
    if (!mission || !written) return;
    const choices: Choice[] = mission.paths.map((path) => ({
      label: written.paths[path.id].label,
      done: this.progress.isPathDone(exampleId, path.id),
      run: () => void this.runPath(exampleId, path, written),
    }));
    choices.push({ label: this.ui()['bye'], done: false, run: () => this.close() });
    this.show({ who: written.npc, text: written.ask }, choices, false);
  }

  private async runPath(
    exampleId: string,
    path: MissionPath,
    written: MissionContent,
  ): Promise<void> {
    const runner = RUNNERS[exampleId]?.[path.id];
    const lines: PathContent = written.paths[path.id];
    if (!runner || this.running()) return;

    // El idioma de ANTES: lo que este camino enseña se lee en llano y recién
    // después se presenta como palabra nueva.
    const learned = this.progress.learned();
    this.steps = 0;
    this.running.set(true);
    this.mode.set(BLOCKS_MAIN.has(`${exampleId}/${path.id}`) ? 'frozen' : 'busy');
    this.show({ who: written.npc, text: lines.during, learned }, [], false);

    try {
      // Primero se pinta lo que se acaba de decir; después corre el camino.
      await this.nextPaint();
      const result = await this.withTimeout(
        runner({
          ctl: this.ctl,
          until: (read) => this.until(read),
          steps: () => this.steps,
          act: () => this.offer(lines.act ?? ''),
        }),
      );
      this.finishRun();
      const spoken = result.outcome === 'missed' ? (lines.missed ?? []) : lines.after;
      const extra = result.outcome === 'simulated' && lines.simulated ? [lines.simulated] : [];
      this.play(
        [...spoken, ...extra].map((text) => ({
          who: written.npc,
          text,
          values: result.values,
          learned,
        })),
        () => this.afterPath(exampleId, path, result.outcome === 'missed'),
      );
    } catch {
      this.finishRun();
      this.play([{ who: written.npc, text: this.ui()['failed'] }], () => this.ask(exampleId));
    }
  }

  private finishRun(): void {
    this.running.set(false);
    this.midAction.set(null);
    this.mode.set('free');
  }

  private afterPath(exampleId: string, path: MissionPath, missed: boolean): void {
    if (missed) {
      this.ask(exampleId);
      return;
    }
    const content = this.content()!;
    const wasComplete = this.done() === this.total;
    const fresh = this.progress.completePath(exampleId, path.id);
    const news: Line[] = fresh.map((id) => ({
      who: content.ui['newWord'],
      text: `${content.vocab[id]?.plain ?? ''} → {${content.vocab[id]?.plain ?? ''}|${id}}`,
    }));
    if (!wasComplete && this.done() === this.total) {
      news.push({ who: content.ui['guide'], text: content.ui['end'] });
    }
    this.play(news, () => this.ask(exampleId));
  }

  /** Muestra las líneas de a una; al terminar corre `then`. */
  private play(lines: Line[], then?: () => void): void {
    this.lines = [...lines];
    this.afterLines = then ?? null;
    this.nextLine();
  }

  protected nextLine(): void {
    const line = this.lines.shift();
    if (!line) {
      const then = this.afterLines;
      this.afterLines = null;
      if (then) then();
      else this.close();
      return;
    }
    this.show(line, [], this.lines.length > 0 || this.afterLines !== null);
  }

  private show(line: Line, choices: Choice[], more: boolean): void {
    const text = fill(line.text, line.values ?? {});
    this.dialog.set({
      who: line.who,
      segments: morph(text, line.learned ?? this.progress.learned()),
      choices,
      more,
    });
  }

  protected close(): void {
    this.lines = [];
    this.afterLines = null;
    this.dialog.set(null);
    this.activeId.set('');
    this.ctl.useExample('');
  }

  // ── lo que una misión necesita del juego ──

  private offer(label: string): Promise<void> {
    return new Promise((resolve) => this.midAction.set({ label, take: resolve }));
  }

  private sceneCanvases(): { worker: HTMLCanvasElement; main: HTMLCanvasElement } | null {
    const worker = this.ocWorker()?.nativeElement;
    const main = this.ocMain()?.nativeElement;
    return worker && main ? { worker, main } : null;
  }

  private until<T>(read: () => T | null | undefined | false | 0): Promise<T> {
    return new Promise((resolve) => {
      const watcher = effect(
        () => {
          const value = read();
          if (value) {
            resolve(value);
            untracked(() => queueMicrotask(() => watcher.destroy()));
          }
        },
        { injector: this.injector },
      );
    });
  }

  private withTimeout<T>(work: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), RUN_TIMEOUT_MS);
      work.then(resolve, reject).finally(() => clearTimeout(timer));
    });
  }

  // ── progreso ──

  protected restart(): void {
    this.progress.reset();
    this.confirmingRestart.set(false);
    this.close();
    this.enter(WORLD[0], WORLD[0].entry, 'up');
  }

  protected apiOf(id: TermId): string {
    return findTerm(id)?.api ?? '';
  }

  // ── dibujo ──

  private draw(): void {
    const ctx = this.canvas()?.nativeElement.getContext('2d');
    if (!ctx) return;
    if (!this.moving) this.drawAt = this.position();
    const region = this.region();
    const people: Person[] = this.grid().actors.map((actor) => {
      const neighbor = region.neighbors.find((candidate) => candidate.id === actor.id);
      return {
        x: actor.x,
        y: actor.y,
        look: neighbor?.look ?? GUARD_LOOK,
        badge: neighbor ? (this.progress.isMissionDone(neighbor.id) ? 'done' : 'todo') : undefined,
      };
    });
    paint(ctx, {
      region,
      people,
      player: { ...this.drawAt, look: PLAYER_LOOK, facing: this.facing() },
      frozen: this.mode() === 'frozen',
    });
  }
}
