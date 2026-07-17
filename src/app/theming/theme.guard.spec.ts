import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { rootThemeRedirect, themeGuard } from './theme.guard';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';

/** ThemePack mínimo: el guard sólo mira la clave del registry, no sus lazy loaders. */
function pack(id: string): ThemePack {
  return {
    id,
    label: id,
    shell: async () => class {},
    home: async () => class {},
    exampleLayout: async () => class {},
  };
}

function fakeRoute(themeParam: string | null): ActivatedRouteSnapshot {
  return {
    paramMap: { get: (key: string) => (key === 'theme' ? themeParam : null) },
  } as unknown as ActivatedRouteSnapshot;
}

const STATE = {} as RouterStateSnapshot;

describe('themeGuard / rootThemeRedirect', () => {
  let registry: Map<ThemeId, ThemePack>;
  let createUrlTreeCalls: unknown[][];

  beforeEach(() => {
    // El entorno de test corre sin DOM (no hay localStorage/document); ThemeService
    // ya lo contempla con `typeof`. Para simular "theme persistido" usamos setTheme(),
    // no localStorage.
    // Registry SIN 'default' a propósito: así se ve que el fallback es el primer
    // id del registry ('aurora'), no un 'default' hardcodeado.
    registry = new Map([
      ['aurora', pack('aurora')],
      ['midnight', pack('midnight')],
    ]);
    createUrlTreeCalls = [];
    const routerStub: Pick<Router, 'createUrlTree'> = {
      createUrlTree: ((commands: unknown[]) => {
        createUrlTreeCalls.push(commands);
        return { commands } as unknown as UrlTree;
      }) as Router['createUrlTree'],
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: THEME_REGISTRY, useValue: registry },
        { provide: Router, useValue: routerStub },
        ThemeService,
      ],
    });
  });

  function run<T>(fn: () => T): T {
    return TestBed.runInInjectionContext(fn);
  }

  it('theme válido en la ruta: lo activa y deja pasar (true), sin redirigir', () => {
    const result = run(() => themeGuard(fakeRoute('midnight'), STATE));
    expect(result).toBe(true);
    expect(TestBed.inject(ThemeService).activeId()).toBe('midnight');
    expect(createUrlTreeCalls).toHaveLength(0);
  });

  it('theme inválido en la ruta: redirige al theme activo (createUrlTree)', () => {
    const result = run(() => themeGuard(fakeRoute('no-existe'), STATE)) as unknown as {
      commands: unknown[];
    };
    expect(createUrlTreeCalls).toHaveLength(1);
    expect(result.commands[0]).toBe('/t');
  });

  it('theme null en la ruta: también redirige (no deja pasar)', () => {
    const result = run(() => themeGuard(fakeRoute(null), STATE));
    expect(result).not.toBe(true);
    expect(createUrlTreeCalls).toHaveLength(1);
  });

  it('root con theme activo válido: redirige a ese theme', () => {
    // Simula "persistido válido" activándolo (setTheme no depende de localStorage).
    TestBed.inject(ThemeService).setTheme('midnight');
    const result = run(() => rootThemeRedirect(fakeRoute(null), STATE)) as unknown as {
      commands: unknown[];
    };
    expect(result.commands).toEqual(['/t', 'midnight']);
  });

  it('root sin stored en el registry: cae al PRIMER theme del registry, no a un default clavado', () => {
    // activeId inicial = 'default', que NO está en el registry {aurora, midnight}.
    const result = run(() => rootThemeRedirect(fakeRoute(null), STATE)) as unknown as {
      commands: unknown[];
    };
    expect(result.commands).toEqual(['/t', 'aurora']);
  });
});
