import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';

function pack(id: ThemeId, stylesheets?: string[]): ThemePack {
  const noop = () => Promise.resolve(class {});
  return { id, label: id, shell: noop, home: noop, exampleLayout: noop, stylesheets };
}

function makeService(packs: ThemePack[]): ThemeService {
  const registry = new Map<ThemeId, ThemePack>(packs.map((p) => [p.id, p]));
  TestBed.configureTestingModule({
    providers: [{ provide: THEME_REGISTRY, useValue: registry }],
  });
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  it('switches the active theme and sets data-theme on <html>', () => {
    const svc = makeService([pack('skeleton'), pack('brutalist')]);
    svc.setTheme('brutalist');
    expect(svc.activeId()).toBe('brutalist');
    expect(svc.active().id).toBe('brutalist');
    expect(document.documentElement.dataset['theme']).toBe('brutalist');
  });

  it('ignores unknown theme ids', () => {
    const svc = makeService([pack('skeleton')]);
    svc.setTheme('does-not-exist' as ThemeId);
    expect(svc.activeId()).toBe('skeleton');
  });

  it('persists the active theme to localStorage', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    });
    try {
      const svc = makeService([pack('skeleton'), pack('brutalist')]);
      svc.setTheme('brutalist');
      expect(store.get('wwp-theme')).toBe('brutalist');
    } finally {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it('injects the active theme stylesheets and purges the previous ones', () => {
    const svc = makeService([
      pack('skeleton'),
      pack('brutalist', ['/themes/brutalist.css']),
      pack('editorial', ['/themes/editorial.css']),
    ]);

    svc.setTheme('brutalist');
    expect(document.head.querySelector('link[data-theme-css="brutalist"]')).toBeTruthy();

    svc.setTheme('editorial');
    expect(document.head.querySelector('link[data-theme-css="editorial"]')).toBeTruthy();
    // El CSS del theme anterior se purga al salir.
    expect(document.head.querySelector('link[data-theme-css="brutalist"]')).toBeNull();
  });
});
