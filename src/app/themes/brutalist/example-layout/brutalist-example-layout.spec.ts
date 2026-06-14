import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BrutalistExampleLayoutComponent } from './brutalist-example-layout.component';
import { ThreadMonitorService } from '../../../core/services/thread-monitor.service';

/**
 * Prueba la vertical del ejemplo 01 en brutalist (sin levantar un Worker real,
 * que jsdom no soporta): con el ejemplo 01 cargado y carriles en el monitor, el
 * layout debe renderizar los controles, el ThreadVisualizer (resuelto por DI) y
 * el code-block con los snippets del registry.
 */
describe('BrutalistExampleLayoutComponent (example 01 vertical)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '01-setinterval-counter' })) },
        },
      ],
    });
  });

  it('renders controls, the thread visualizer and the code snippets', async () => {
    // Simulamos actividad del worker en el monitor (sin Worker real).
    const monitor = TestBed.inject(ThreadMonitorService);
    monitor.start(0);
    monitor.push('worker', 'worker');

    const fixture = TestBed.createComponent(BrutalistExampleLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    // Controles del worker.
    expect(el.querySelector('.b-controls')).toBeTruthy();
    // ThreadVisualizer brutalista montado por DI + ngComponentOutlet.
    expect(el.querySelector('brutalist-thread-visualizer')).toBeTruthy();
    expect(el.querySelector('.b-cell')).toBeTruthy();
    // Code-block con los snippets neutrales del registry.
    expect(el.querySelector('brutalist-code-block')).toBeTruthy();
    expect(el.textContent).toContain('createCounter');
    // Cards de cada sección.
    expect(el.textContent).toContain('Hilos');
    expect(el.textContent).toContain('Código');
  });
});
