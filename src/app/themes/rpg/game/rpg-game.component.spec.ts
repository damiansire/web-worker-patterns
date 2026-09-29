import { readFileSync } from 'node:fs';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { findMaster } from '../../../core/domain/learning/masters';
import { MISSIONS, REGIONS } from '../../../core/domain/learning/missions';
import { findTerm } from '../../../core/domain/learning/vocabulary';
import { LearningProgressService } from '../../../core/services/learning-progress.service';
import { RpgGameComponent } from './rpg-game.component';

/** El contenido real del juego: el spec conversa con los textos que se publican. */
const translation = JSON.parse(readFileSync('public/i18n/es.json', 'utf8')) as Translation;

class RealContentLoader implements TranslocoLoader {
  getTranslation() {
    return of(translation);
  }
}

/**
 * La conversación del juego, sin navegador: qué se dice, qué se ofrece y cómo
 * cambia el idioma. Lo que necesita un worker real o un canvas lo cubre
 * `scripts/test/e2e-rpg.mjs`.
 */
describe('RpgGameComponent', () => {
  let fixture: ComponentFixture<RpgGameComponent>;
  let host: HTMLElement;

  const text = (selector: string) =>
    host.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const buttons = (selector: string) =>
    [...host.querySelectorAll<HTMLButtonElement>(selector)].map((button) => {
      // El número de atajo es un adorno: no forma parte de lo que dice el botón.
      const copy = button.cloneNode(true) as HTMLElement;
      copy.querySelector('.g-key')?.remove();
      return { button, label: copy.textContent?.replace(/\s+/g, ' ').trim() ?? '' };
    });
  const press = async (selector: string, label: string) => {
    const found = buttons(selector).find((candidate) => candidate.label === label);
    expect(found, `no está el botón "${label}"`).toBeDefined();
    found!.button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  /** Habla con alguien de la lista de vecinos (camina hasta ahí y conversa). */
  const talkTo = async (name: string) => {
    await press('.g-bar button', 'Vecinos');
    await press('.g-neighbors button', name);
    // Caminar lleva tiempo real: se espera a que la conversación empiece.
    for (let i = 0; i < 200 && text('.g-who').toLowerCase() !== name.toLowerCase(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
    }
    expect(text('.g-who').toLowerCase()).toBe(name.toLowerCase());
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['es'], defaultLang: 'es' },
          loader: RealContentLoader,
        }),
      ],
    });
    fixture = TestBed.createComponent(RpgGameComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('arranca en Villa Main, sin nada aprendido y diciendo cómo se juega', async () => {
    expect(text('.g-region')).toBe('Villa Main');
    expect(text('.g-count')).toBe('0/16');
    expect(text('.g-who')).toBe('El viaje del hilo');
    expect(text('.g-line')).toBe('Flechas para caminar. Espacio para hablar.');
    // Los vecinos no ocupan pantalla: se abren a pedido.
    expect(host.querySelector('.g-neighbors')).toBeNull();

    await press('.g-bar button', 'Vecinos');

    expect(buttons('.g-neighbors button').map((b) => b.label)).toEqual([
      'Main',
      'Relojera',
      'Pintor',
      'Maestra',
    ]);
  });

  it('la cámara sigue al jugador', async () => {
    const map = host.querySelector<HTMLCanvasElement>('.g-map')!;
    const focus = () => [
      map.style.getPropertyValue('--cam-x'),
      map.style.getPropertyValue('--cam-y'),
    ];

    // Villa Main se entra por la casilla (8, 8) de un mapa de 16 por 10.
    expect(focus()).toEqual(['0.5313', '0.8500']);

    await talkTo('Relojera');

    expect(focus()).not.toEqual(['0.5313', '0.8500']);
  });

  it('un vecino saluda, plantea su problema y ofrece sus caminos', async () => {
    await talkTo('Relojera');
    expect(text('.g-line')).toBe('Mi reloj da dos tics por segundo.');

    await press('.g-choices button', 'Seguir');

    expect(text('.g-line')).toBe('¿Quién le da cuerda?');
    expect(buttons('.g-choices button').map((b) => b.label)).toEqual([
      'Que lo haga Main',
      'Llamar a un ayudante',
      'Chau',
    ]);
  });

  it('la opción elegida responde al instante', async () => {
    await talkTo('Main');
    await press('.g-choices button', 'Seguir');
    const option = buttons('.g-choices button')[0].button;

    option.click();
    fixture.detectChanges();

    expect(option.classList.contains('is-picked')).toBe(true);
  });

  it('elegir a otro vecino en medio de una charla va a hablar con él', async () => {
    await talkTo('Relojera');
    await press('.g-choices button', 'Seguir');
    expect(text('.g-line')).toBe('¿Quién le da cuerda?');

    await talkTo('Main');

    expect(text('.g-who')).toBe('Main');
    expect(host.querySelector('.g-sheet')).toBeNull();
  });

  it('con una palabra aprendida, el vecino y los botones cambian de idioma', async () => {
    TestBed.inject(LearningProgressService).completePath('01-setinterval-counter', 'worker');
    fixture.detectChanges();

    await talkTo('Relojera');
    expect(text('.g-line')).toBe('A mi reloj lo mueve un worker.');
    expect(host.querySelector('.g-line code')?.textContent).toBe('worker');

    await press('.g-choices button', 'Seguir');
    expect(buttons('.g-choices button').map((b) => b.label)).toContain('Llamar a un worker');
    await press('.g-choices button', 'Chau');
    await press('.g-bar button', 'Workerdex 2/20');
    expect(text('.g-dex')).toContain('new Worker()');
  });

  it('la maestra no toma examen con misiones pendientes', async () => {
    await talkTo('Maestra');

    expect(text('.g-line')).toBe('Falta ayudar a Main y Relojera.');
    expect(buttons('.g-choices button').map((b) => b.label)).toEqual(['Seguir']);
  });

  /** Villa Main cumplida. Con `painful`, también por los caminos que duelen. */
  const finishVillaMain = (painful: boolean) => {
    const progress = TestBed.inject(LearningProgressService);
    progress.completePath('01-setinterval-counter', 'worker');
    progress.completePath('02-main-thread', 'block');
    progress.completePath('16-compositor-vs-main', 'worker');
    if (painful) {
      progress.completePath('01-setinterval-counter', 'main');
      progress.completePath('16-compositor-vs-main', 'main');
    }
    fixture.detectChanges();
    return progress;
  };
  /** Un acierto destella un instante antes de pasar a la situación siguiente. */
  const afterHit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();
  };

  it('sin las palabras del examen, la maestra manda a aprenderlas', async () => {
    const progress = finishVillaMain(false);

    await talkTo('Maestra');

    // Nombra de una vez a todos los que enseñan lo que falta.
    expect(text('.g-line')).toBe('Te falta vocabulario. Hablá con Pintor y Relojera.');
    expect(progress.isStamped('understanding')).toBe(false);
  });

  it('con la región cumplida y sus palabras, tres aciertos dan el sello', async () => {
    const progress = finishVillaMain(true);

    await talkTo('Maestra');
    expect(text('.g-line')).toBe('Tres situaciones. Elegí la pieza.');
    await press('.g-choices button', 'Seguir');

    expect(text('.g-line')).toBe('Un cálculo largo traba la página.');
    await press('.g-choices button', 'new Worker()');
    expect(host.querySelector('.g-stamps i[data-hits="1"]')).not.toBeNull();
    await afterHit();
    expect(text('.g-line')).toBe('¿Qué atiende una tarea por vez?');
    await press('.g-choices button', 'event loop');
    await afterHit();
    await press('.g-choices button', 'compositor');
    await afterHit();

    expect(text('.g-line')).toBe('Sello de Villa Main. Bien ganado.');
    expect(progress.isStamped('understanding')).toBe(true);
    expect(progress.isRegionOpen('communication')).toBe(true);
    expect(host.querySelectorAll('.g-stamps .is-earned')).toHaveLength(1);
  });

  it('una respuesta equivocada no da el sello ni echa: vuelve a la misma situación', async () => {
    const progress = finishVillaMain(true);

    await talkTo('Maestra');
    await press('.g-choices button', 'Seguir');
    await press('.g-choices button', 'event loop');

    expect(text('.g-line')).toBe('No era esa. Repasá con Relojera.');
    expect(progress.isStamped('understanding')).toBe(false);

    await press('.g-choices button', 'Seguir');
    expect(text('.g-line')).toBe('Un cálculo largo traba la página.');
  });

  it('el quinto sello cierra el viaje con su propia ceremonia', async () => {
    const progress = TestBed.inject(LearningProgressService);
    for (const mission of MISSIONS) {
      for (const path of mission.paths) progress.completePath(mission.exampleId, path.id);
    }
    for (const region of REGIONS.slice(0, -1)) progress.stamp(region);
    // Volver al juego: se aparece en la región que queda por sellar.
    fixture.destroy();
    fixture = TestBed.createComponent(RpgGameComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text('.g-region')).toBe('La Frontera');

    await talkTo('Maestra');
    await press('.g-choices button', 'Seguir');
    for (const challenge of findMaster('advanced')!.challenges) {
      await press('.g-choices button', findTerm(challenge.answer)!.api);
      await afterHit();
    }
    expect(text('.g-line')).toBe('Sello de La Frontera. Bien ganado.');
    expect(host.querySelector('.g-stamps.is-party')).toBeNull();

    await press('.g-choices button', 'Seguir');
    expect(text('.g-who')).toBe('Viaje completo');
    expect(text('.g-line')).toBe('Cinco sellos. Recorriste los 16 patrones.');
    expect(host.querySelector('.g-dialog')?.getAttribute('data-kind')).toBe('final');
    expect(host.querySelector('.g-stamps.is-party')).not.toBeNull();

    // Y el reposo ya no explica cómo se juega: despide.
    await press('.g-choices button', 'Seguir');
    expect(text('.g-line')).toBe('Viaje completo. El pueblo es tuyo.');
    expect(host.querySelector('.g-stamps.is-party')).toBeNull();
  });

  it('una palabra entra al Workerdex cuando se la presenta, no antes', async () => {
    const game = fixture.componentInstance as unknown as {
      afterPath: (exampleId: string, path: { id: string }, missed: boolean) => void;
    };
    const tally = () => text('.g-tally');

    game.afterPath('02-main-thread', { id: 'block' }, false);
    fixture.detectChanges();

    // Primero el momento de la misión: la palabra todavía no se contó.
    expect(text('.g-line')).toBe('Misión cumplida.');
    expect(tally()).toBe('0/20');

    await press('.g-choices button', 'Seguir');
    expect(text('.g-line')).toBe('la fila de tareas → event loop');
    expect(tally()).toBe('1/20');
  });

  it('con el teclado en un botón de la lista, Espacio no repite la charla', async () => {
    await talkTo('Relojera');
    const first = text('.g-line');

    // El foco volvió al mapa: Espacio avanza la conversación, no re-dispara el botón.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(first).toBe('Mi reloj da dos tics por segundo.');
    expect(text('.g-line')).toBe('¿Quién le da cuerda?');
  });

  it('las teclas 1, 2 y 3 eligen una opción aunque el foco no esté en el mapa', async () => {
    await talkTo('Relojera');
    await press('.g-choices button', 'Seguir');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
    fixture.detectChanges();

    // La tercera opción es "Chau": cierra la conversación.
    expect(text('.g-who')).toBe('El viaje del hilo');
  });

  it('empezar de nuevo pide confirmación y borra el progreso', async () => {
    const progress = TestBed.inject(LearningProgressService);
    progress.completePath('02-main-thread', 'block');
    fixture.detectChanges();
    expect(text('.g-count')).toBe('1/16');

    await press('.g-bar button', 'Workerdex 1/20');
    await press('.g-sheet button', 'Empezar de nuevo');
    expect(progress.doneCount()).toBe(1); // todavía no: falta confirmar
    await press('.g-sheet button', 'Sí, borrar');

    expect(text('.g-count')).toBe('0/16');
    expect(progress.learned().size).toBe(0);
  });
});
