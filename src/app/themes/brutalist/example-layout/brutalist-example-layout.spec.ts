import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BrutalistExampleLayoutComponent } from './brutalist-example-layout.component';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';
import { ExampleContentService } from '../../../core/services/example-content.service';

/**
 * Vertical del ejemplo 01 en brutalist con el contraste worker-vs-main (backlog #2):
 * dos columnas, el ThreadVisualizer resuelto por DI, y el code-block con snippets.
 * El main-blocking se dispara sin Worker real (jsdom no lo soporta).
 */
describe('BrutalistExampleLayoutComponent (worker vs main contrast)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '01-setinterval-counter' })) },
        },
        // Stub: el contenido i18n no es parte de esta prueba (evita cablear Transloco).
        { provide: ExampleContentService, useValue: { contentFor: () => signal(null) } },
      ],
    });
  });

  it('renders both columns, the main-blocked visualizer and the code snippets', async () => {
    // Corremos la versión que bloquea el main (sincrónica, sin Worker).
    const runner = TestBed.inject(ExampleRunnerService);
    runner.runMainBlockingDemo({ intervalMs: 1, ticks: 1 });

    const fixture = TestBed.createComponent(BrutalistExampleLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';

    // Las dos columnas del contraste.
    expect(text).toContain('En un Worker');
    expect(text).toContain('En el Main thread');
    // La corrida bloqueada pintó el carril main en 'blocked'.
    expect(el.querySelector('brutalist-thread-visualizer')).toBeTruthy();
    expect(el.querySelector('.b-cell[data-state="blocked"]')).toBeTruthy();
    // Code-block con los snippets neutrales del registry.
    expect(el.querySelector('brutalist-code-block')).toBeTruthy();
    expect(text).toContain('createCounter');
    expect(text).toContain('Código');
  });
});
