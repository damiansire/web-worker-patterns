import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { WorkerExample } from '../../../core/domain/examples/example.model';
import { ExampleContentService } from '../../../core/services/example-content.service';
import { DefaultExampleLayoutComponent } from '../example-layout/default-example-layout.component';

interface Chapter {
  key: string;
  n: number;
  title: string;
  blurb: string;
  examples: WorkerExample[];
}

/** Los 5 capítulos del viaje (los grupos que ya existían), en orden pedagógico. */
const CHAPTER_META: { key: string; title: string; blurb: string }[] = [
  { key: 'understanding', title: 'Entender', blurb: 'Un solo hilo hace todo, y se puede trabar.' },
  { key: 'communication', title: 'Comunicar', blurb: 'Hablarle a un worker y que te responda.' },
  { key: 'optimization', title: 'Optimizar', blurb: 'Sacar el trabajo pesado del hilo principal.' },
  { key: 'management', title: 'Gestionar', blurb: 'Crear, cortar y cuidar a los workers.' },
  { key: 'advanced', title: 'Avanzar', blurb: 'Memoria compartida, flujo y los límites reales.' },
];

/**
 * El viaje (ARQUITECTURA / dirección visual explorable). Un solo scroll continuo:
 * los 16 patrones son paradas encadenadas, agrupadas en 5 capítulos con cortes
 * marcados. Solo la parada en pantalla monta su demo interactiva (los demo-
 * services son `root`/compartidos, así que una activa por vez evita colisiones);
 * las demás muestran su encabezado. Al terminar una, el scroll te lleva a la que
 * sigue. Reemplaza al home-índice como raíz del theme.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-journey',
  imports: [DefaultExampleLayoutComponent],
  template: `
    <div class="j-rail"><i class="j-rail-fill" [style.width.%]="progress()"></i></div>

    <div class="j-intro">
      <p class="j-eyebrow">un viaje por la concurrencia en el navegador</p>
      <h1>16 patrones de Web Workers, de a uno, jugando.</h1>
      <p class="j-lede">
        Empezás arriba, interactuás con cada patrón y el scroll te lleva al siguiente. Cinco
        capítulos, un mismo hilo de fondo. Bajá.
      </p>
      <p class="j-cue">↓</p>
    </div>

    @for (chapter of chapters; track chapter.key) {
      <div class="j-chapter" [attr.data-ch]="chapter.key">
        <span class="j-ch-n">Capítulo {{ chapter.n }} / {{ chapters.length }}</span>
        <h2 class="j-ch-title">{{ chapter.title }}</h2>
        <p class="j-ch-blurb">{{ chapter.blurb }}</p>
      </div>

      @for (ex of chapter.examples; track ex.id) {
        <section
          #station
          class="j-station"
          [class.is-active]="activeId() === ex.id"
          [attr.data-id]="ex.id"
        >
          <p class="j-kicker">
            nº {{ ex.order.toString().padStart(2, '0') }} · {{ chapter.title }}
          </p>
          @if (activeId() === ex.id) {
            <default-example-layout [exampleId]="ex.id" [journeyMode]="true" />
          } @else {
            <h3 class="j-peek-title">{{ titleOf(ex.id) }}</h3>
            <p class="j-peek">seguí bajando para activar este patrón ↓</p>
          }
        </section>
      }
    }

    <div class="j-end">
      <p class="j-eyebrow">llegaste al final del viaje</p>
      <h2>Ese es el recorrido completo.</h2>
      <p class="j-lede">Los 16 patrones, un solo hilo de fondo. Volvé a subir cuando quieras.</p>
    </div>
  `,
  styleUrl: './default-journey.component.scss',
})
export class DefaultJourneyComponent {
  private readonly contentSvc = inject(ExampleContentService);
  private readonly stations = viewChildren<ElementRef<HTMLElement>>('station');

  protected readonly activeId = signal<string>('');
  protected readonly progress = signal<number>(0);

  protected readonly chapters: Chapter[] = CHAPTER_META.map((meta, i) => ({
    ...meta,
    n: i + 1,
    examples: EXAMPLES.filter((e) => e.category === meta.key).sort((a, b) => a.order - b.order),
  })).filter((c) => c.examples.length > 0);

  /** Títulos (i18n) precomputados para el "peek" de cada parada inactiva. */
  private readonly titles = new Map(
    EXAMPLES.map((e) => [e.id, this.contentSvc.contentFor(signal(e.id))] as const),
  );
  protected titleOf(id: string): string {
    return this.titles.get(id)?.()?.title ?? id;
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const els = this.stations().map((s) => s.nativeElement);
      if (!els.length) return;

      // La parada cuyo centro está más cerca del centro del viewport es la activa.
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              const id = (e.target as HTMLElement).dataset['id'];
              if (id) this.activeId.set(id);
            }
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
      );
      els.forEach((el) => io.observe(el));
      if (!this.activeId()) this.activeId.set(els[0].dataset['id'] ?? '');

      const onScroll = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        this.progress.set(max > 0 ? (h.scrollTop / max) * 100 : 0);
      };
      addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        io.disconnect();
        removeEventListener('scroll', onScroll);
      });
    });
  }
}
