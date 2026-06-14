import { InjectionToken } from '@angular/core';
import { ThemeId, ThemePack } from './theme.types';

/** Registro de los ThemePack disponibles, indexados por id. */
export const THEME_REGISTRY = new InjectionToken<Map<ThemeId, ThemePack>>('THEME_REGISTRY');
