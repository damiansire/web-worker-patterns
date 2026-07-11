import { Provider } from '@angular/core';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';
import { DEFAULT_THEME } from '../themes/default/default.theme';

/**
 * Themes registrados. Hoy hay uno solo (`default`), neutro. El motor es
 * genérico: sumar un theme es agregar su `ThemePack` acá (cada uno es liviano,
 * solo metadata + loaders lazy, así importarlo no arrastra el chunk del theme).
 */
export const THEME_PACKS: ThemePack[] = [DEFAULT_THEME];

export function buildThemeRegistry(packs: ThemePack[] = THEME_PACKS): Map<ThemeId, ThemePack> {
  return new Map(packs.map((pack) => [pack.id, pack] as const));
}

export function provideThemeRegistry(): Provider {
  return { provide: THEME_REGISTRY, useFactory: () => buildThemeRegistry() };
}
