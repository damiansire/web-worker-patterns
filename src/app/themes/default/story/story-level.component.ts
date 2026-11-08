import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DefaultExampleLayoutComponent } from '../example-layout/default-example-layout.component';
import { StoryStageComponent } from './story-stage.component';
import { findLevel, Level } from './story.levels';

/**
 * Ruta `example/:id` del theme: un nivel con escena se juega en su pantalla;
 * uno "en obra" (todavía sin escena) o un id desconocido abren el ejemplo en su
 * versión clásica. La ruta se reusa al pasar de un nivel a otro, así que el
 * `@for` con `track` por id rearma la pantalla entera en cada cambio.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-story-level',
  imports: [StoryStageComponent, DefaultExampleLayoutComponent],
  template: `
    @for (lv of playable(); track lv.id) {
      <default-story-stage [level]="lv" />
    } @empty {
      <default-example-layout />
    }
  `,
})
export class StoryLevelComponent {
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );
  protected readonly playable = computed<Level[]>(() => {
    const lv = findLevel(this.id());
    return lv?.scene ? [lv] : [];
  });
}
