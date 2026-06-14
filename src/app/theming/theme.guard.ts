import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId } from './theme.types';

/**
 * Guard de rutas theme-aware (ARQUITECTURA §4.3 / §9). Lee el segmento `:theme`,
 * valida que exista en el registry y lo activa en el ThemeService. Si no es
 * válido, redirige al theme activo. La persistencia (URL + localStorage) y el
 * selector se completan en la fase 8.
 */
export const themeGuard: CanActivateFn = (route) => {
  const registry = inject(THEME_REGISTRY);
  const theme = inject(ThemeService);
  const router = inject(Router);

  const id = route.paramMap.get('theme') as ThemeId | null;
  if (id && registry.has(id)) {
    theme.setTheme(id);
    return true;
  }
  return router.createUrlTree(['/t', theme.activeId()]);
};
