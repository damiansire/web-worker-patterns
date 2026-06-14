import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { App } from './app';
import { THEME_REGISTRY } from './theming/theme.tokens';
import { ThemeId, ThemePack } from './theming/theme.types';

@Component({ standalone: true, template: '<p class="fake-shell">shell</p>' })
class FakeShell {}

class TestLoader implements TranslocoLoader {
  getTranslation() {
    return of({} as Translation);
  }
}

const fakePack: ThemePack = {
  id: 'skeleton',
  label: 'Skeleton',
  shell: () => Promise.resolve(FakeShell),
  home: () => Promise.resolve(FakeShell),
  exampleLayout: () => Promise.resolve(FakeShell),
};

describe('App (theme host)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: THEME_REGISTRY,
          useValue: new Map<ThemeId, ThemePack>([['skeleton', fakePack]]),
        },
        provideTransloco({
          config: { availableLangs: ['en', 'es', 'pt'], defaultLang: 'en' },
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
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fake-shell')).toBeTruthy();
    expect(document.documentElement.dataset['theme']).toBe('skeleton');
  });
});
