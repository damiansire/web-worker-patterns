import {
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
import {
  findMaster,
  missingTerms,
  optionsOf,
  teacherOf,
} from '../../../core/domain/learning/masters';
import { findMission, MissionPath, REGIONS } from '../../../core/domain/learning/missions';
import { TermId, VOCABULARY } from '../../../core/domain/learning/vocabulary';
import { ExampleLayoutController } from '../../../core/presentation/example-layout.controller';
import { LearningContentService } from '../../../core/services/learning-content.service';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { BLOCKS_MAIN, LIVE, PREPARE, RUNNERS, Values } from '../missions/mission-runner';
import { RpgPulseComponent } from '../primitives/rpg-pulse.component';
import { RpgTextComponent } from '../primitives/rpg-text.component';
import { MAP_HEIGHT, MAP_WIDTH, paint, Person, TILE } from '../world/painter';
import {
  GUARD_ID,
  GUARD_LOOK,
  gridOf,
  HELPER_LOOK,
  nextRegion,
  PLAYER_LOOK,
  previousRegion,
  Region,
  regionOfExample,
  WORLD,
} from '../world/regions';
import {
  Actor,
  approach,
  cameraFocus,
  DELTA,
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

/**
 * `word`, `done`, `stamp` y `final` son los momentos de valor: se muestran con
 * ceremonia. `final` es el pico del juego: los cinco sellos festejan.
 */
type Kind = 'talk' | 'word' | 'done' | 'stamp' | 'final' | 'notice';

interface Line {
  who: string;
  text: string;
  kind?: Kind;
  values?: Values;
  /** Idioma con el que se lee esta línea (el de antes de aprender lo que enseña). */
  learned?: ReadonlySet<TermId>;
  /** La palabra que esta línea presenta. */
  term?: TermId;
}

interface Dialog extends Line {
  kind: Kind;
  choices: Choice[];
  /** Hay más líneas: se avanza con "Seguir". */
  more: boolean;
}

const STEP_MS = 130;
const BUMP_MS = 140;
const POP_MS = 420;
const THAW_MS = 1000;
const NOTICE_MS = 1400;
const DONE_MS = 1100;
const HIT_MS = 260;
const BANNER_MS = 1300;
const RUN_TIMEOUT_MS = 90_000;
/** Hasta qué distancia (en casillas) un toque en el mapa cuenta como "ese vecino". */
const TAP_REACH = 1.5;
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
/** Al aparecer junto a un vecino se prefiere no quedar tapándole el cartel. */
const SPOT_ORDER: Dir[] = ['down', 'left', 'right', 'up'];

const seconds = (ms: number) =>
  (ms / 1000).toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
  ' s';

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
  imports: [RpgPulseComponent, RpgTextComponent],
  providers: [ExampleLayoutController],
  templateUrl: './rpg-game.component.html',
  styleUrl: './rpg-game.component.scss',
  // En `document`: el juego se maneja con el teclado esté donde esté el foco. Un
  // botón que desaparece al apretarlo no puede dejar al jugador sin controles.
  host: { '(document:keydown)': 'onKeyDown($event)', '(document:keyup)': 'onKeyUp()' },
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
  /** Las teclas del juego, para tenerlas a la vista. Sin `press`, es la barra espaciadora. */
  protected readonly keyLegend: readonly { press?: string; does: string }[] = [
    { press: '← ↑ ↓ →', does: 'keyWalk' },
    { does: 'keyTalk' },
    { press: '1 2 3', does: 'keyPick' },
    { press: 'V', does: 'keyNeighbors' },
    { press: 'X', does: 'keyDex' },
    { press: 'Esc', does: 'keyClose' },
  ];
  protected readonly mapWidth = MAP_WIDTH;
  protected readonly mapHeight = MAP_HEIGHT;
  /** En pantallas táctiles la bienvenida no habla de teclas. */
  protected readonly touch =
    typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

  // ── mundo ──
  protected readonly region = signal<Region>(WORLD[0]);
  private readonly position = signal<Point>(WORLD[0].entry);
  private readonly facing = signal<Dir>('up');
  protected readonly regionName = computed(() => this.content()?.regions[this.region().id] ?? '');
  private readonly regionDone = computed(() => this.progress.isRegionDone(this.region().id));
  private readonly stamped = computed(() => this.progress.isStamped(this.region().id));
  private readonly grid = computed(() => gridOf(this.region(), this.stamped()));
  /** Región cuyo nombre está cruzando la pantalla (vacío si no hay cartel). */
  protected readonly banner = signal('');
  protected readonly bannerName = computed(() => this.content()?.regions[this.banner()] ?? '');
  /** Un sello por región, en el orden del recorrido. */
  protected readonly stamps = computed(() => {
    const earned = this.progress.stamps();
    return REGIONS.map((region) => earned.includes(region));
  });
  protected readonly stampCount = computed(() => this.progress.stamps().length);
  /** Con los cinco sellos, el reposo ya no explica cómo se juega: despide. */
  protected readonly journeyDone = computed(() => this.stampCount() === REGIONS.length);

  // ── estado del main ──
  protected readonly mode = signal<'free' | 'frozen' | 'busy'>('free');
  /** Cuánto duró el último freeze: se sostiene un segundo después de volver. */
  private readonly thawed = signal('');
  protected readonly modeLabel = computed(() =>
    this.thawed()
      ? fill(this.ui()['frozenFor'] ?? '', { seg: this.thawed() })
      : (this.ui()[this.mode()] ?? ''),
  );

  // ── conversación ──
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly midAction = signal<{ label: string; take: () => void } | null>(null);
  private readonly activeId = signal('');
  private readonly running = signal(false);
  protected readonly busy = this.running.asReadonly();
  protected readonly live = computed(() => {
    const read = LIVE[this.activeId()];
    return this.running() && read ? read(this.ctl) : '';
  });
  /** La escena que acompaña a una misión: molinetes (16) o relojes (14). */
  protected readonly scene = computed(() => {
    const demo = this.dialog() ? this.ctl.example()?.demo : undefined;
    return demo === 'compositor-jank' || demo === 'offscreen-canvas' ? demo : null;
  });

  // ── hojas: vecinos y Workerdex, a pedido ──
  protected readonly sheet = signal<'neighbors' | 'dex' | null>(null);
  protected readonly confirmingRestart = signal(false);
  /**
   * Palabras ya aprendidas que todavía no tuvieron su presentación: entran al
   * Workerdex (y a su contador) cuando se las muestra, no antes.
   */
  private readonly unannounced = signal<ReadonlySet<TermId>>(new Set());

  // ── examen ──
  /** Aciertos del examen en curso: el sello de la región se llena por tercios. */
  protected readonly examHits = signal(0);
  /** La opción recién acertada, mientras dura su destello. */
  protected readonly hit = signal('');
  protected readonly regionIndex = computed(() => REGIONS.indexOf(this.region().id));

  // ── progreso ──
  protected readonly done = this.progress.doneCount;
  protected readonly total = this.progress.total;
  protected readonly vocabularySize = VOCABULARY.length;
  protected readonly words = computed(() => {
    const vocab = this.content()?.vocab ?? {};
    const learned = this.progress.learned();
    const waiting = this.unannounced();
    return VOCABULARY.filter((term) => learned.has(term.id) && !waiting.has(term.id)).map(
      (term) => ({
        ...term,
        plain: vocab[term.id]?.plain ?? '',
        note: vocab[term.id]?.note ?? '',
      }),
    );
  });

  /** Los vecinos de la región, como lista: navegar sin depender del mapa. */
  protected readonly neighbors = computed(() => {
    const missions = this.content()?.missions ?? {};
    return this.grid().actors.map((actor) => ({
      actor,
      name: actor.id === GUARD_ID ? this.ui()['guard'] : (missions[actor.id]?.npc ?? ''),
      done: actor.id === GUARD_ID ? this.stamped() : this.progress.isMissionDone(actor.id),
    }));
  });

  // ── movimiento y animaciones (fuera de signals: cambian 60 veces por segundo) ──
  private drawAt: Point = WORLD[0].entry;
  private walk: Point[] = [];
  private from: Point = WORLD[0].entry;
  private stepStart = 0;
  private moving = false;
  /** En qué parte del paso está el jugador: alterna los pies al caminar. */
  private stride = 0;
  private held: Dir | null = null;
  private raf = 0;
  private talkOnArrival: Actor | null = null;
  private steps = 0;
  /** Un camino elegido que todavía espera lo que su misión mide de antemano. */
  private starting = false;
  private lines: Line[] = [];
  private afterLines: (() => void) | null = null;
  /** Rebote contra una pared: hacia dónde y desde cuándo. */
  private bump: { dir: Dir; start: number } | null = null;
  /** Salto del cartel de una misión recién cumplida. */
  private pop: { id: string; start: number } | null = null;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.raf);
      this.timers.forEach(clearTimeout);
    });

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
      this.thawed();
      this.running();
      this.activeId();
      this.position();
      this.facing();
      this.content();
      this.canvas();
      untracked(() => this.draw());
    });

    // El mapa aparece recién cuando cargó el contenido: ahí toma el foco.
    effect(() => {
      if (this.canvas()) untracked(() => this.focusMap());
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
  }

  // ── entrada ──

  protected onKeyDown(event: KeyboardEvent): void {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const onButton = target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement;

    if (event.key === 'Escape') {
      this.closeSheet();
      return;
    }
    // V y X alternan: la misma tecla que abre una hoja la cierra.
    if (event.key === 'v' || event.key === 'x') {
      this.openSheet(event.key === 'v' ? 'neighbors' : 'dex');
      return;
    }
    if (this.sheet()) return; // con una hoja abierta el mundo espera

    const dir = KEYS[event.key];
    if (dir) {
      event.preventDefault();
      this.held = dir;
      this.tryStep(dir);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      if (onButton) return; // el botón enfocado se activa solo
      event.preventDefault();
      this.talk();
      return;
    }
    const choice = this.dialog()?.choices[Number(event.key) - 1];
    if (choice) {
      event.preventDefault();
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
    // En casillas, con decimales: el centro de la casilla (3, 4) es (3.5, 4.5).
    const fx = ((event.clientX - box.left) / box.width) * (MAP_WIDTH / TILE);
    const fy = ((event.clientY - box.top) / box.height) * (MAP_HEIGHT / TILE);
    const tile = { x: Math.floor(fx), y: Math.floor(fy) };

    // Un dedo no acierta una casilla de 22 px: se toma al vecino más cercano.
    const near = this.grid()
      .actors.map((actor) => ({
        actor,
        distance: Math.hypot(actor.x + 0.5 - fx, actor.y + 0.5 - fy),
      }))
      .filter((candidate) => candidate.distance <= TAP_REACH)
      .sort((a, b) => a.distance - b.distance)[0];

    // A menos de una casilla del vecino, se quiso tocar al vecino y no al pasto.
    if (near && near.distance <= 1) {
      this.goTalk(near.actor);
      return;
    }
    const path = findPath(this.grid(), this.position(), tile);
    if (path.length > 0) {
      this.talkOnArrival = null;
      this.startWalk(path);
      return;
    }
    if (near) {
      this.goTalk(near.actor);
      return;
    }
    // La salida tapada por la maestra: se va a hablar con ella.
    const master = this.grid().actors.find((actor) => actor.id === GUARD_ID);
    if (tileAt(this.grid(), tile.x, tile.y) === '>' && master) {
      this.goTalk(master);
      return;
    }
    this.startBump(dirBetween(this.position(), tile));
  }

  /** Camina hasta alguien y le habla. */
  protected goTalk(actor: Actor): void {
    this.closeSheet();
    if (this.running()) return;
    // Elegir a otro vecino en medio de una charla la termina: se va a hablar con él.
    if (this.isLocked()) this.close();
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

  /** Espacio o el botón: toma la acción en curso, avanza o le habla a quien está adelante. */
  protected talk(): void {
    const action = this.midAction();
    if (action) {
      action.take();
      return;
    }
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
      this.play([{ who: this.ui()['guide'], text: this.ui()['nobody'], kind: 'notice' }]);
    }
  }

  /** Un botón que se apretó con el mouse devuelve el foco al mapa. */
  protected choose(choice: Choice): void {
    choice.run();
    this.focusMap();
  }

  protected advance(): void {
    this.talk();
    this.focusMap();
  }

  protected take(action: { take: () => void }): void {
    action.take();
    this.focusMap();
  }

  protected openSheet(which: 'neighbors' | 'dex'): void {
    this.confirmingRestart.set(false);
    this.sheet.update((open) => (open === which ? null : which));
    if (!this.sheet()) this.focusMap();
  }

  protected closeSheet(): void {
    if (!this.sheet()) return;
    this.sheet.set(null);
    this.confirmingRestart.set(false);
    this.focusMap();
  }

  private focusMap(): void {
    this.canvas()?.nativeElement.focus({ preventScroll: true });
  }

  private later(ms: number, run: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      run();
    }, ms);
    this.timers.add(timer);
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
    } else {
      this.startBump(dir);
    }
  }

  /** Chocar contra algo se nota: el jugador rebota dos píxeles. */
  private startBump(dir: Dir): void {
    if (this.moving || this.bump) return;
    this.facing.set(dir);
    this.bump = { dir, start: performance.now() };
    this.animateExtras();
  }

  private startWalk(path: Point[]): void {
    if (path.length === 0) return;
    // Caminar cierra una conversación que ya no espera nada.
    if (this.dialog() && !this.running()) this.close();
    this.walk = path;
    if (!this.moving) this.nextStep();
  }

  private nextStep(): void {
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
    this.stepStart = performance.now();
    this.moving = true;
    if (this.running()) this.steps += 1;
    this.raf = requestAnimationFrame(() => this.animate());
  }

  private animate(): void {
    // Reloj propio y no el del rAF: los dos tienen que medir desde el mismo origen.
    const t = Math.min(1, (performance.now() - this.stepStart) / STEP_MS);
    const to = this.position();
    this.stride = (this.stride + 1 / 12) % 1;
    this.drawAt = {
      x: this.from.x + (to.x - this.from.x) * t,
      y: this.from.y + (to.y - this.from.y) * t,
    };
    this.draw();
    if (t < 1) {
      this.raf = requestAnimationFrame(() => this.animate());
      return;
    }
    this.moving = false;
    if (this.crossExit()) return;
    if (this.walk.length > 0) {
      this.nextStep();
    } else if (this.held) {
      this.tryStep(this.held);
    } else {
      this.arrive();
    }
  }

  /** Rebotes y saltos de cartel: redibuja solo mientras duran. */
  private animateExtras(): void {
    if (this.moving) return; // el loop de caminar ya está dibujando
    const now = performance.now();
    if (this.bump && now - this.bump.start > BUMP_MS) this.bump = null;
    if (this.pop && now - this.pop.start > POP_MS) this.pop = null;
    this.draw();
    if (this.bump || this.pop) {
      this.raf = requestAnimationFrame(() => this.animateExtras());
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
    this.close();
    this.region.set(region);
    this.position.set(at);
    this.drawAt = at;
    this.facing.set(facing);
    this.announce(region);
  }

  /** El nombre de la región cruza la pantalla al entrar. */
  private announce(region: Region): void {
    this.banner.set(region.id);
    this.later(BANNER_MS, () => {
      if (this.banner() === region.id) this.banner.set('');
    });
  }

  private placeNear(exampleId: string): void {
    const region = regionOfExample(exampleId);
    const neighbor = region?.neighbors.find((candidate) => candidate.id === exampleId);
    if (!region || !neighbor) {
      const open = this.firstOpenRegion();
      this.enter(open, open.entry, 'up');
      return;
    }
    const grid = gridOf(region, this.progress.isStamped(region.id));
    const dir = SPOT_ORDER.find((candidate) => {
      const spot = step(neighbor, candidate);
      return isWalkable(grid, spot.x, spot.y);
    });
    const spot = dir ? step(neighbor, dir) : region.entry;
    this.enter(region, spot, dir ? dirBetween(spot, neighbor) : 'up');
  }

  /** Al volver al juego se aparece en la región donde quedó trabajo por hacer. */
  private firstOpenRegion(): Region {
    const pending = WORLD.find((region) => !this.progress.isStamped(region.id));
    return pending && this.progress.isRegionOpen(pending.id) ? pending : WORLD[0];
  }

  // ── conversación ──

  private talkTo(actor: Actor): void {
    if (this.running()) return;
    const content = this.content();
    if (!content) return;
    this.activeId.set(actor.id);
    if (actor.id === GUARD_ID) {
      this.talkToMaster();
      return;
    }
    const mission = findMission(actor.id);
    const written = content.missions[actor.id];
    if (!mission || !written) return;

    this.ctl.useExample(actor.id);
    // Lo que la misión necesita medir de antemano corre mientras el vecino saluda.
    void PREPARE[actor.id]?.({ ctl: this.ctl, until: (read) => this.until(read) });
    const opening = this.progress.isMissionDone(actor.id) ? written.done : written.hello;
    this.play([{ who: written.npc, text: opening }], () => this.ask(actor.id));
  }

  /**
   * La maestra de la región. Con misiones pendientes dice a quién falta ayudar; con
   * la región cumplida plantea sus tres situaciones; con el sello dado, deja pasar.
   */
  private talkToMaster(): void {
    const content = this.content()!;
    const { ui, masters } = content;
    const who = ui['guard'];
    const next = nextRegion(this.region());
    if (this.stamped()) {
      this.play([
        next
          ? { who, text: fill(ui['guardOpen'], { next: content.regions[next.id] }) }
          : { who: ui['journeyDone'], text: masters.final, kind: 'final' },
      ]);
      return;
    }
    if (!this.regionDone()) {
      const pending = this.region()
        .neighbors.filter((neighbor) => !this.progress.isMissionDone(neighbor.id))
        .map((neighbor) => content.missions[neighbor.id]?.npc)
        .slice(0, 2)
        .join(' y ');
      this.play([{ who, text: fill(ui['guardLocked'], { names: pending }) }]);
      return;
    }
    // Varias palabras se aprenden por el camino que duele: sin ellas no hay examen.
    const master = findMaster(this.region().id);
    const missing = master ? missingTerms(master, this.progress.learned()) : [];
    if (missing.length > 0) {
      // De una vez, todos los que enseñan lo que falta: sin idas y vueltas.
      const teachers = [...new Set(missing.map((term) => teacherOf(term) ?? ''))];
      const npc = teachers
        .map((exampleId) => content.missions[exampleId]?.npc ?? '')
        .filter((name) => name !== '')
        .slice(0, 2)
        .join(' y ');
      this.play([{ who, text: fill(masters.missing, { npc }) }]);
      return;
    }
    this.examHits.set(0);
    this.play([{ who, text: masters.ready }], () => this.challenge(0));
  }

  private challenge(index: number): void {
    const content = this.content()!;
    const region = this.region();
    const challenge = findMaster(region.id)?.challenges[index];
    if (!challenge) {
      this.pass();
      return;
    }
    const who = content.ui['guard'];
    const choices: Choice[] = optionsOf(challenge).map((term) => ({
      // La opción se lee en el idioma del alumno: API si la aprendió, llano si no.
      label: `{${content.vocab[term]?.plain ?? term}|${term}}`,
      done: false,
      run: () => {
        if (this.hit()) return; // el destello de un acierto está en curso
        if (term === challenge.answer) {
          // El acierto se ve: la opción destella y el sello se llena un tercio.
          this.hit.set(term);
          this.examHits.set(index + 1);
          this.later(HIT_MS, () => {
            this.hit.set('');
            this.challenge(index + 1);
          });
          return;
        }
        // Errar no echa a nadie: dice con quién repasar y vuelve a la misma situación.
        const teacher = content.missions[teacherOf(challenge.answer) ?? '']?.npc ?? '';
        this.play([{ who, text: fill(content.masters.wrong, { npc: teacher }) }], () =>
          this.challenge(index),
        );
      },
    }));
    const text = content.masters.challenges[region.id]?.[challenge.id] ?? '';
    this.show({ who, text }, choices);
  }

  private pass(): void {
    const content = this.content()!;
    const region = this.region();
    this.progress.stamp(region.id);
    this.examHits.set(0);
    const text = fill(content.masters.pass, { region: content.regions[region.id] });
    const lines: Line[] = [{ who: content.ui['stampEarned'], text, kind: 'stamp' }];
    if (!nextRegion(region)) {
      lines.push({ who: content.ui['journeyDone'], text: content.masters.final, kind: 'final' });
    }
    this.play(lines);
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
    this.show({ who: written.npc, text: written.ask }, choices);
  }

  private async runPath(
    exampleId: string,
    path: MissionPath,
    written: MissionContent,
  ): Promise<void> {
    const runner = RUNNERS[exampleId]?.[path.id];
    const lines: PathContent = written.paths[path.id];
    if (!runner || this.running() || this.starting) return;

    // Lo que la misión mide de antemano tiene que estar listo ANTES de anunciar nada:
    // decir "congelado" mientras la página todavía se mueve sería mentir.
    this.starting = true;
    try {
      await PREPARE[exampleId]?.({ ctl: this.ctl, until: (read) => this.until(read) });
    } finally {
      this.starting = false;
    }

    // El idioma de ANTES: lo que este camino enseña se lee en llano y recién
    // después se presenta como palabra nueva.
    const learned = this.progress.learned();
    const blocks = BLOCKS_MAIN.has(`${exampleId}/${path.id}`);
    this.steps = 0;
    this.thawed.set('');
    this.running.set(true);
    this.mode.set(blocks ? 'frozen' : 'busy');
    this.show({ who: written.npc, text: lines.during, learned }, []);

    try {
      // Primero se pinta lo que se acaba de decir; después corre el camino.
      await this.nextPaint();
      const started = performance.now();
      const result = await this.withTimeout(
        runner({
          ctl: this.ctl,
          until: (read) => this.until(read),
          steps: () => this.steps,
          act: () => this.offer(lines.act ?? ''),
        }),
      );
      this.finishRun(blocks ? performance.now() - started : 0);
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
      this.finishRun(0);
      this.play([{ who: written.npc, text: this.ui()['failed'] }], () => this.ask(exampleId));
    }
  }

  /**
   * Termina una corrida. Si congeló el main, el estado no vuelve a "libre" de
   * inmediato: se sostiene un segundo diciendo cuánto duró, para que se llegue a leer.
   */
  private finishRun(frozenMs: number): void {
    this.running.set(false);
    this.midAction.set(null);
    if (frozenMs <= 0) {
      this.mode.set('free');
      return;
    }
    this.thawed.set(seconds(frozenMs));
    this.later(THAW_MS, () => {
      this.thawed.set('');
      if (!this.running()) this.mode.set('free');
    });
  }

  private afterPath(exampleId: string, path: MissionPath, missed: boolean): void {
    if (missed) {
      this.ask(exampleId);
      return;
    }
    const content = this.content()!;
    const wasDone = this.progress.isMissionDone(exampleId);
    const fresh = this.progress.completePath(exampleId, path.id);
    const news: Line[] = [];

    if (!wasDone && this.progress.isMissionDone(exampleId)) {
      const who = content.missions[exampleId].npc;
      news.push({ who, text: content.ui['missionDone'], kind: 'done' });
      this.pop = { id: exampleId, start: performance.now() };
      this.animateExtras();
    }
    // Cada palabra nueva se presenta: cómo se llamaba y cómo se llama. Para qué
    // sirve queda en el Workerdex, así la salida de una misión no se hace larga.
    this.unannounced.set(new Set(fresh));
    for (const id of fresh) {
      const plain = content.vocab[id]?.plain ?? '';
      news.push({
        who: content.ui['newWord'],
        text: `${plain} → {${plain}|${id}}`,
        kind: 'word',
        term: id,
      });
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
    if (line.term) {
      // Recién ahora la palabra entra al Workerdex: el contador sube con su ceremonia.
      const term = line.term;
      this.unannounced.update((waiting) => new Set([...waiting].filter((id) => id !== term)));
    }
    const shown = this.dialog();
    if (line.kind === 'notice') {
      // Un aviso no pide nada: se va solo.
      this.later(NOTICE_MS, () => {
        if (this.dialog() === shown) this.close();
      });
    }
    if (line.kind === 'done') {
      // La misión cumplida tiene su momento, pero no pide un click: sigue sola.
      this.later(DONE_MS, () => {
        if (this.dialog() === shown) this.nextLine();
      });
    }
  }

  private show(line: Line, choices: Choice[], more = false): void {
    this.dialog.set({
      ...line,
      text: fill(line.text, line.values ?? {}),
      kind: line.kind ?? 'talk',
      choices,
      more,
    });
  }

  protected close(): void {
    this.unannounced.set(new Set());
    this.examHits.set(0);
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
    this.closeSheet();
    this.enter(WORLD[0], WORLD[0].entry, 'up');
  }

  // ── dibujo ──

  private draw(): void {
    const cv = this.canvas()?.nativeElement;
    if (!cv) return;
    const now = performance.now();
    if (!this.moving) this.drawAt = this.position();
    // La cámara sigue al jugador: el mapa puede ser más grande que su lugar en pantalla.
    const focus = cameraFocus(this.drawAt, {
      columns: MAP_WIDTH / TILE,
      rows: MAP_HEIGHT / TILE,
    });
    cv.style.setProperty('--cam-x', focus.x.toFixed(4));
    cv.style.setProperty('--cam-y', focus.y.toFixed(4));
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const region = this.region();
    const spot = this.position();
    const talkingTo = this.activeId();

    const people: Person[] = this.grid().actors.map((actor) => {
      const neighbor = region.neighbors.find((candidate) => candidate.id === actor.id);
      const lift =
        this.pop?.id === actor.id
          ? Math.round(Math.sin(((now - this.pop.start) / POP_MS) * Math.PI) * 8)
          : 0;
      return {
        x: actor.x,
        y: actor.y,
        look: neighbor?.look ?? GUARD_LOOK,
        badge: neighbor ? (this.progress.isMissionDone(neighbor.id) ? 'done' : 'todo') : undefined,
        badgeLift: lift,
        // El que conversa mira al jugador.
        facing: actor.id === talkingTo ? dirBetween(actor, spot) : undefined,
      };
    });

    // El ayudante existe en el mundo: mientras trabaja, está parado junto al vecino.
    if (this.running() && this.mode() === 'busy') {
      const helper = this.helperSpot(talkingTo);
      if (helper) people.push({ ...helper, look: HELPER_LOOK });
    }

    let player: Point = this.drawAt;
    if (this.bump) {
      const t = Math.min(1, (now - this.bump.start) / BUMP_MS);
      const push = (Math.sin(t * Math.PI) * 3) / TILE;
      player = {
        x: player.x + DELTA[this.bump.dir].x * push,
        y: player.y + DELTA[this.bump.dir].y * push,
      };
    }

    paint(ctx, {
      region,
      people,
      player: {
        ...player,
        look: PLAYER_LOOK,
        facing: this.facing(),
        stride: this.moving ? this.stride : undefined,
      },
      frozen: this.mode() === 'frozen' && !this.thawed(),
    });
  }

  /** Una casilla libre al lado del vecino, que no sea donde está parado el jugador. */
  private helperSpot(actorId: string): Point | null {
    const actor = this.grid().actors.find((candidate) => candidate.id === actorId);
    if (!actor) return null;
    const me = this.position();
    for (const dir of ['right', 'left', 'down', 'up'] as Dir[]) {
      const spot = step(actor, dir);
      if (isWalkable(this.grid(), spot.x, spot.y) && !(spot.x === me.x && spot.y === me.y)) {
        return spot;
      }
    }
    return null;
  }
}
