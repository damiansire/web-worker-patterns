import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';
import {
  emptyLog,
  NOW_AT,
  SPAN_MS,
  TaskKind,
  taskWidth,
  tapeOffset,
  tapeX,
  ThreadLog,
  waitMs,
} from './story.threads.logic';

/** Los dibujitos de cada tarea: los mismos de las pelotas del malabar. */
const GLYPHS: Partial<Record<TaskKind, { d: string; line?: boolean }>> = {
  click: { d: 'M-5 -8L-5 7L-1 3L2 9L5 7L2 1L7 1Z' },
  scroll: { d: 'M-4 -7H4M-6 -2H6M-6 3H6M-4 8H4', line: true },
  frame: { d: 'M-4 -7L7 0L-4 7Z' },
  message: { d: 'M-7 -5H7V5H-7ZM-7 -5L0 1L7 -5', line: true },
};
const pct = (fraction: number) => `${(fraction * 100).toFixed(3)}%`;
const secs = (ms: number) => (ms / 1000).toLocaleString('es', { maximumFractionDigits: 1 });

/**
 * "Hilos del navegador": lo que hace cada hilo, en una cinta de tiempo que
 * corre como el panel de rendimiento de las DevTools, pero con las pelotas
 * del malabar.
 *  - Main thread: cada pelota que main atrapa es algo que atendió (un clic, el
 *    scroll, una animación); un trabajo largo es una barra que lo ocupa entero.
 *  - Fila de tareas: lo que llegó mientras main estaba ocupado. Cada pelota
 *    queda en la hora en que llegó y una línea punteada la lleva hasta la hora
 *    en que main la tomó: eso esperó.
 *  - Worker: otro hilo, con su propio carril (o vacío, si el nivel no tiene).
 *
 * La cinta la mueve main con requestAnimationFrame: si main se congela, la
 * cinta se frena con él. La barra del trabajo largo, en cambio, crece con una
 * animación CSS de transform (la mueve el compositor) y sigue creciendo.
 *
 * La cinta se puede pausar (`pausedAt`): queda quieta en esa hora para mirar lo
 * que pasó. La pantalla la pausa sola al terminar cada intento, y el botón la
 * pausa o la vuelve al vivo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'story-threads',
  template: `
    <div class="th-head">
      <p class="th-kicker">✦ Hilos del navegador ✦</p>
      <button
        type="button"
        class="th-pause"
        [attr.aria-pressed]="pausedAt() !== null"
        (click)="togglePause()"
      >
        {{ pausedAt() === null ? '⏸ Pausar' : '▶ En vivo' }}
      </button>
    </div>
    <div class="th-lanes" aria-hidden="true">
      <span class="th-name" data-lane="main">Main thread</span>
      <div class="th-track" data-lane="main">
        <div class="th-tape">
          @for (t of mainTasks(); track t.id) {
            @if (t.kind === 'long') {
              <div
                class="th-long"
                [class.is-running]="t.end === null"
                [style.left]="t.left"
                [style.width]="t.width"
                [style.--th-span]="span + 'ms'"
              >
                <span class="th-long-fill"></span>
                <span class="th-long-label">{{ t.label }}</span>
              </div>
            } @else {
              <span class="th-ball" [attr.data-kind]="t.kind" [style.left]="t.left">
                @if (t.glyph; as g) {
                  <svg viewBox="-10 -10 20 20">
                    <path [attr.d]="g.d" [class.is-line]="g.line" />
                  </svg>
                } @else {
                  <i>{{ t.label }}</i>
                }
              </span>
            }
          }
        </div>
        <span class="th-now" [style.left]="nowLeft">
          <b>{{ pausedAt() === null ? 'ahora' : 'en pausa' }}</b>
        </span>
      </div>

      <span class="th-name th-name--queue">Fila de tareas</span>
      <div class="th-track th-track--queue">
        <div class="th-tape">
          @for (q of waiting(); track q.id) {
            @if (q.waitWidth) {
              <span class="th-wait" [style.left]="q.left" [style.width]="q.waitWidth">
                @if (q.oldest) {
                  <b>esperó {{ q.waited }} s</b>
                }
              </span>
            }
            <span class="th-ball th-ball--queued" [attr.data-kind]="q.kind" [style.left]="q.left">
              @if (q.glyph; as g) {
                <svg viewBox="-10 -10 20 20"><path [attr.d]="g.d" [class.is-line]="g.line" /></svg>
              } @else {
                <i>{{ '' }}</i>
              }
            </span>
          }
        </div>
        <span class="th-now" [style.left]="nowLeft"></span>
        @if (!waiting().length) {
          <span class="th-note">vacía: main atiende cada cosa apenas llega</span>
        }
      </div>

      <span class="th-name" data-lane="worker">Worker</span>
      <div class="th-track" data-lane="worker" [class.is-off]="!hasWorker()">
        @if (hasWorker()) {
          <div class="th-tape">
            @for (t of workerTasks(); track t.id) {
              @if (t.kind === 'long') {
                <div
                  class="th-long"
                  [class.is-running]="t.end === null"
                  [style.left]="t.left"
                  [style.width]="t.width"
                  [style.--th-span]="span + 'ms'"
                >
                  <span class="th-long-fill"></span>
                  <span class="th-long-label">{{ t.label }}</span>
                </div>
              } @else {
                <span class="th-ball" [attr.data-kind]="t.kind" [style.left]="t.left">
                  @if (t.glyph; as g) {
                    <svg viewBox="-10 -10 20 20">
                      <path [attr.d]="g.d" [class.is-line]="g.line" />
                    </svg>
                  } @else {
                    <i>{{ t.label }}</i>
                  }
                </span>
              }
            }
          </div>
          <span class="th-now" [style.left]="nowLeft"></span>
          @if (!workerTasks().length) {
            <span class="th-note">todavía no hay ningún worker</span>
          }
        } @else {
          <span class="th-note">en este nivel no hay ningún worker: todo lo hace main</span>
        }
      </div>
    </div>
  `,
  styleUrl: './story-threads.component.scss',
  host: {
    class: 'th',
    '[class.is-held]': 'pausedAt() !== null',
    role: 'group',
    '[attr.aria-label]': 'summary()',
  },
})
export class StoryThreadsComponent {
  readonly log = input<ThreadLog>(emptyLog());
  /** Si el nivel tiene worker: si no, su carril queda apagado y lo dice. */
  readonly hasWorker = input(false);
  /** La hora en que la cinta está quieta, o null si corre en vivo. */
  readonly pausedAt = model<number | null>(null);

  protected readonly span = SPAN_MS;
  protected readonly nowLeft = pct(NOW_AT);
  /** La hora en que se armó la cinta: todo se ubica respecto de ella. */
  private readonly origin = performance.now();

  private readonly place = (lane: 'main' | 'worker') =>
    computed(() =>
      this.log()
        .tasks.filter((t) => t.lane === lane)
        .map((t) => ({
          ...t,
          left: pct(tapeX(t.start, this.origin)),
          width: pct(taskWidth(t)),
          glyph: GLYPHS[t.kind] ?? null,
        })),
    );
  protected readonly mainTasks = this.place('main');
  protected readonly workerTasks = this.place('worker');

  protected readonly waiting = computed(() => {
    const queue = this.log().queue;
    const now = performance.now();
    const taken = queue.filter((q) => q.taken !== null);
    const oldest = taken.reduce<(typeof queue)[number] | null>(
      (a, q) => (!a || waitMs(q, now) > waitMs(a, now) ? q : a),
      null,
    );
    return queue.map((q) => ({
      ...q,
      left: pct(tapeX(q.arrived, this.origin)),
      glyph: GLYPHS[q.kind] ?? null,
      waitWidth: q.taken === null ? null : pct(waitMs(q, now) / SPAN_MS),
      waited: secs(waitMs(q, now)),
      oldest: q === oldest,
    }));
  });

  protected readonly summary = computed(() => {
    const busy = this.log().tasks.find((t) => t.lane === 'main' && t.end === null);
    const waited = this.waiting().find((q) => q.oldest);
    const parts = [
      busy ? `Main thread ocupado: ${busy.label}.` : 'Main thread atendiendo de a una cosa.',
      waited ? `En la fila, un clic esperó ${waited.waited} s.` : 'Fila de tareas vacía.',
      this.hasWorker() ? '' : 'Sin worker en este nivel.',
    ];
    return `Hilos del navegador. ${parts.join(' ')}`.trim();
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let frame = 0;
    // La cinta corre con main: un cuadro por vuelta de requestAnimationFrame.
    const roll = () => {
      const at = this.pausedAt() ?? performance.now();
      host.style.setProperty('--th-tape', String(tapeOffset(at, this.origin)));
      frame = requestAnimationFrame(roll);
    };
    afterNextRender(() => roll());
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(frame));
  }

  protected togglePause(): void {
    this.pausedAt.set(this.pausedAt() === null ? performance.now() : null);
  }
}
