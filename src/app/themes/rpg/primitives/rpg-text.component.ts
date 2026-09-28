import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { morph } from '../../../core/domain/learning/morph';
import { TermId } from '../../../core/domain/learning/vocabulary';
import { LearningProgressService } from '../../../core/services/learning-progress.service';

/**
 * Un texto del juego, en el idioma que le corresponde al alumno hoy. Todo lo que
 * se lee en pantalla pasa por acá (diálogos, botones, carteles): así una palabra
 * aprendida cambia en todos lados a la vez, no solo donde se la presentó.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'rpg-text',
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.kind === 'term') {
        <code class="t">{{ segment.value }}</code>
      } @else {
        <span>{{ segment.value }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline;
    }
    .t {
      font-family: var(--font-mono);
      font-size: 0.8em;
      padding: 2px 6px;
      border-radius: 5px;
      background: var(--rpg-term);
      color: var(--rpg-term-ink);
      white-space: nowrap;
    }
  `,
})
export class RpgTextComponent {
  readonly text = input.required<string>();
  /** Idioma con el que leer este texto. Por defecto, el que el alumno tiene hoy. */
  readonly learned = input<ReadonlySet<TermId> | null>(null);

  private readonly progress = inject(LearningProgressService);

  protected readonly segments = computed(() =>
    morph(this.text(), this.learned() ?? this.progress.learned()),
  );
}
