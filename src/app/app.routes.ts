import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ThemeService } from './theming/theme.service';
import { themeGuard, rootThemeRedirect } from './theming/theme.guard';

/**
 * Rutas theme-aware (ARQUITECTURA §9). La raíz redirige al theme activo
 * (persistido o el default de muestra). Bajo `/t/:theme/...` se monta el
 * home/example-layout del theme activo vía el ThemeService.
 */
export const routes: Routes = [
  // La raíz entra en la estructura theme-aware (theme persistido o de muestra).
  { path: '', pathMatch: 'full', canActivate: [rootThemeRedirect], children: [] },
  {
    path: 't/:theme',
    canActivate: [themeGuard],
    children: [
      { path: '', loadComponent: () => inject(ThemeService).active().home() },
      { path: 'example/:id', loadComponent: () => inject(ThemeService).active().exampleLayout() },
    ],
  },
];
