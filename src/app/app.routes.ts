import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { EXAMPLES_REGISTRY } from './examples/examples.registry';
import { ThemeService } from './theming/theme.service';
import { themeGuard, rootThemeRedirect } from './theming/theme.guard';

/**
 * Rutas. Conviven dos estructuras durante la migración:
 *  - Las rutas mono-theme existentes (`/`, `/examples/:id`) siguen sirviendo la
 *    UI rica actual sin cambios.
 *  - Las rutas theme-aware (`/t/:theme/...`) montan el home/example-layout del
 *    theme activo vía el ThemeService (ARQUITECTURA §9). Validan el motor con el
 *    theme skeleton; los themes reales (fases 5-7) reusan exactamente esta forma.
 */
export const routes: Routes = [
  // La raíz entra en la estructura theme-aware (theme persistido o de muestra).
  { path: '', pathMatch: 'full', canActivate: [rootThemeRedirect], children: [] },
  // Rutas legacy mono-theme (deep-link directo a la UI rica existente).
  ...EXAMPLES_REGISTRY.map((manifest) => ({
    path: manifest.route.slice(1),
    loadComponent: manifest.loadComponent,
  })),
  {
    path: 't/:theme',
    canActivate: [themeGuard],
    children: [
      { path: '', loadComponent: () => inject(ThemeService).active().home() },
      { path: 'example/:id', loadComponent: () => inject(ThemeService).active().exampleLayout() },
    ],
  },
];
