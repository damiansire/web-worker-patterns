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
  // The service seeds its active theme from localStorage (`readStoredTheme() ??
  // 'default'`). Tests share jsdom's localStorage, so a theme persisted by one
  // test must not leak into the next — clear it before each. Guarded because one
  // test swaps localStorage for a mock. Los ids `alpha`/`beta` son fakes: el
  // motor es data-driven (ids arbitrarios via el registry), no un enum fijo.
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* a test replaced localStorage; nothing to clear */
    }
  });

  it('switches the active theme and sets data-theme on <html>', () => {
    const svc = makeService([pack('alpha'), pack('beta')]);
    svc.setTheme('beta');
    expect(svc.activeId()).toBe('beta');
    expect(svc.active().id).toBe('beta');
    expect(document.documentElement.dataset['theme']).toBe('beta');
  });

  it('ignores unknown theme ids', () => {
    const svc = makeService([pack('default')]);
    svc.setTheme('does-not-exist');
    expect(svc.activeId()).toBe('default');
  });

  it('persists the active theme to localStorage', () => {
    const store = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
      },
    });
    try {
      const svc = makeService([pack('alpha'), pack('beta')]);
      svc.setTheme('beta');
      expect(store.get('wwp-theme')).toBe('beta');
    } finally {
      // Restore jsdom's real localStorage so later tests (and beforeEach) keep working.
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
    }
  });

  it('injects the active theme stylesheets and purges the previous ones', () => {
    const svc = makeService([
      pack('gamma'),
      pack('beta', ['/themes/beta.css']),
      pack('alpha', ['/themes/alpha.css']),
    ]);

    svc.setTheme('beta');
    expect(document.head.querySelector('link[data-theme-css="beta"]')).toBeTruthy();

    svc.setTheme('alpha');
    expect(document.head.querySelector('link[data-theme-css="alpha"]')).toBeTruthy();
    // El CSS del theme anterior se purga al salir.
    expect(document.head.querySelector('link[data-theme-css="beta"]')).toBeNull();
  });
});
