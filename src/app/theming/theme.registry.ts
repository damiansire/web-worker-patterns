import { Provider } from '@angular/core';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';
import { SKELETON_THEME } from '../themes/skeleton/skeleton.theme';

/**
 * Themes registrados. A medida que se implementan (fases 5-7) se agregan acá:
 * cada ThemePack es liviano (solo metadata + loaders lazy), así importarlo no
 * arrastra el chunk del theme.
 */
export const THEME_PACKS: ThemePack[] = [SKELETON_THEME];

export function buildThemeRegistry(packs: ThemePack[] = THEME_PACKS): Map<ThemeId, ThemePack> {
  return new Map(packs.map((pack) => [pack.id, pack] as const));
}

export function provideThemeRegistry(): Provider {
  return { provide: THEME_REGISTRY, useFactory: () => buildThemeRegistry() };
}
