import { ThemePack } from '../../theming/theme.types';

/**
 * Theme brutalist (ARQUITECTURA §10.5): el más simple (sin librería UI), valida
 * el pipeline punta a punta — shell, home, example-layout, primitivos y su
 * ThreadVisualizer. Sus tokens viven en `styles/_tokens.scss` (cargados global)
 * y su skin no necesita CSS lazy de librería.
 */
export const FULL_BRUTALIST_THEME: ThemePack = {
  id: 'full-brutalist',
  label: 'Full Brutalist',
  shell: () =>
    import('./shell/fb-shell.component').then((m) => m.FullBrutalistShellComponent),
  home: () => import('./home/fb-home.component').then((m) => m.FullBrutalistHomeComponent),
  exampleLayout: () =>
    import('./example-layout/fb-example-layout.component').then(
      (m) => m.FullBrutalistExampleLayoutComponent,
    ),
};
