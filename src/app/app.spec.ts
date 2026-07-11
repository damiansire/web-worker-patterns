import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { App } from './app';
import { THEME_REGISTRY } from './theming/theme.tokens';
import { ThemeId, ThemePack } from './theming/theme.types';

@Component({ template: '<p class="fake-shell">shell</p>' })
class FakeShell {}

class TestLoader implements TranslocoLoader {
  getTranslation() {
    return of({} as Translation);
  }
}

const fakePack: ThemePack = {
  id: 'default',
  label: 'Default',
  shell: () => Promise.resolve(FakeShell),
  home: () => Promise.resolve(FakeShell),
  exampleLayout: () => Promise.resolve(FakeShell),
};

describe('App (theme host)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: THEME_REGISTRY,
          useValue: new Map<ThemeId, ThemePack>([['default', fakePack]]),
        },
        provideTransloco({
          config: { availableLangs: ['es'], defaultLang: 'es' },
          loader: TestLoader,
        }),
      ],
    });
  });

  it('creates the host', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mounts the active theme shell and sets data-theme', async () => {
    const fixture = TestBed.createComponent(App);

    // El shell se carga async (effect → pack.shell() Promise → signal → CD).
    // En zoneless el orden exacto entre el effect, las microtareas y la CD lo
    // decide el scheduler, y bajo carga (CI) ese orden varía: asumir que un
    // whenStable() drena toda la cadena hacía el test flaky (pasaba local,
    // fallaba a veces en CI). En vez de adivinar el timing, esperamos la
    // CONDICIÓN: repetimos CD + whenStable + flush de macrotarea hasta que el
    // shell montó (acotado, para no colgar si algo se rompe de verdad).
    const compiled = fixture.nativeElement as HTMLElement;
    for (let i = 0; i < 20 && !compiled.querySelector('.fake-shell'); i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
    }

    expect(compiled.querySelector('.fake-shell')).toBeTruthy();
    expect(document.documentElement.dataset['theme']).toBe('default');
  });
});
