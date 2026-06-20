import { ThemePack } from '../../theming/theme.types';

/**
 * Theme full-brutalist: la variante oscura del brutalismo (alto contraste sobre fondo
 * negro). Sin librería UI, tokens en `styles/_tokens.scss` (cargados global) y skin propio
 * — shell, home, example-layout, primitivos y su ThreadVisualizer.
 */
export const FULL_BRUTALIST_THEME: ThemePack = {
  id: 'full-brutalist',
  label: 'Full Brutalist',
  shell: () => import('./shell/fb-shell.component').then((m) => m.FullBrutalistShellComponent),
  home: () => import('./home/fb-home.component').then((m) => m.FullBrutalistHomeComponent),
  exampleLayout: () =>
    import('./example-layout/fb-example-layout.component').then(
      (m) => m.FullBrutalistExampleLayoutComponent,
    ),
};
