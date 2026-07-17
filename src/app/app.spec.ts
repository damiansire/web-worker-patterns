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
    const compiled = fixture.nativeElement as HTMLElement;

    // El shell se carga async (effect → pack.shell() Promise → signal → CD).
    // `autoDetectChanges` deja que Angular corra la CD automáticamente cuando la
    // signal `shell` cambia, y `whenStable()` espera las PendingTasks que App
    // registra al cargar el shell (App agrega un `await` extra justo para que la
    // CD del render se aplique ANTES de reportar estabilidad). Así el montaje es
    // determinista, sin depender del orden manual detectChanges/whenStable que
    // hacía flaky al test bajo carga de CI (pasaba local, fallaba a veces en CI).
    fixture.autoDetectChanges(true);
    for (let i = 0; i < 20 && !compiled.querySelector('.fake-shell'); i++) {
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
    }

    expect(compiled.querySelector('.fake-shell')).toBeTruthy();
    expect(document.documentElement.dataset['theme']).toBe('default');
  });
});
