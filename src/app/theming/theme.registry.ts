import { Provider } from '@angular/core';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';
import { DEFAULT_THEME } from '../themes/default/default.theme';

/**
 * Themes registrados. Hoy uno solo, `default`: la historia por niveles con main y
 * los workers. `midnight` y `rpg` se sacaron el 2026-11-08 (ver el estado actual en ARQUITECTURA-multi-theme.md).
 * El motor sigue siendo genérico: sumar un theme es agregar su `ThemePack` acá
 * (cada uno es liviano, solo metadata + loaders lazy).
 */
export const THEME_PACKS: ThemePack[] = [DEFAULT_THEME];

export function buildThemeRegistry(packs: ThemePack[] = THEME_PACKS): Map<ThemeId, ThemePack> {
  return new Map(packs.map((pack) => [pack.id, pack] as const));
}

export function provideThemeRegistry(): Provider {
  return { provide: THEME_REGISTRY, useFactory: () => buildThemeRegistry() };
}
