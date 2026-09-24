import { ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { provideThemeRegistry } from '../../../theming/theme.registry';
import { DefaultExampleLayoutComponent } from './default-example-layout.component';

class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({} as Translation);
  }
}

class RecordingErrorHandler extends ErrorHandler {
  readonly seen: unknown[] = [];
  override handleError(error: unknown): void {
    this.seen.push(error);
  }
}

/**
 * La demo de cada ejemplo va envuelta en `@boundary` (Angular 22.2). Si algo
 * tira al dibujarla, se muestra el `@error` y el resto del layout sigue vivo;
 * `$reset` vuelve a intentar la demo. El error igual llega al ErrorHandler.
 */
describe('DefaultExampleLayout: @boundary alrededor de la demo', () => {
  let handler: RecordingErrorHandler;

  beforeEach(() => {
    handler = new RecordingErrorHandler();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideThemeRegistry(),
        provideTransloco({
          config: { availableLangs: ['es'], defaultLang: 'es' },
          loader: EmptyLoader,
        }),
        { provide: ErrorHandler, useValue: handler },
      ],
    });
  });

  it('contiene el error de la demo, conserva el resto y se recupera con reintentar', async () => {
    const fixture = TestBed.createComponent(DefaultExampleLayoutComponent);
    fixture.componentRef.setInput('exampleId', '01-setinterval-counter');

    // Rompemos una signal que SOLO lee la demo thread-block.
    let broken = true;
    const layout = fixture.componentInstance as unknown as { phase: () => string };
    const realPhase = layout.phase;
    layout.phase = () => {
      if (broken) throw new Error('demo rota a propósito');
      return realPhase();
    };

    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const crash = el.querySelector('.e-crash');
    expect(crash).not.toBeNull();
    // El error original es lo PRIMERO que recibe el ErrorHandler (en 22.2 le
    // sigue un NG0600 por los viewChild; no lo fijamos para que el test no se
    // rompa cuando Angular lo arregle).
    expect((handler.seen[0] as Error).message).toBe('demo rota a propósito');
    // Lo de afuera del boundary sigue en pie.
    expect(el.querySelector('h1')).not.toBeNull();
    expect(el.querySelector('.e-cmp')).toBeNull();

    // Arreglado el fallo, «Reintentar» vuelve a montar la demo.
    broken = false;
    crash!.querySelector('button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.querySelector('.e-crash')).toBeNull();
    expect(el.querySelector('.e-cmp')).not.toBeNull();
    // Quien usa teclado no queda en <body>: el foco va a la demo remontada.
    expect(document.activeElement).toBe(el.querySelector('.e-demo'));
    // La demo que vuelve de un reintento entra animada.
    expect(el.querySelector('.e-demo')!.classList).toContain('e-demo--back');
  });

  it('sin errores, la demo se dibuja normal y no aparece el fallback', async () => {
    const fixture = TestBed.createComponent(DefaultExampleLayoutComponent);
    fixture.componentRef.setInput('exampleId', '01-setinterval-counter');
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.e-cmp')).not.toBeNull();
    expect(el.querySelector('.e-crash')).toBeNull();
    expect(handler.seen).toEqual([]);
    // En la carga inicial la demo no se anima.
    expect(el.querySelector('.e-demo')!.classList).not.toContain('e-demo--back');
  });
});
