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

    // El shell se carga async (import dinámico → signal → CD). En zoneless hay
    // que forzar CD explícitamente entre cada await para no depender del timing
    // del scheduler: el flaky que rompía en CI (pasaba local) venía de asumir
    // que un solo whenStable() drena toda la cadena. Guiamos cada paso:
    //   1) CD inicial corre el effect que dispara pack.shell()
    //   2) whenStable espera esa Promise (registrada vía PendingTasks)
    //   3) CD final renderiza el shell resuelto en el DOM
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fake-shell')).toBeTruthy();
    expect(document.documentElement.dataset['theme']).toBe('default');
  });
});
