import { ThemePack } from '../../theming/theme.types';

/**
 * Theme brutalist (ARQUITECTURA §10.5): el más simple (sin librería UI), valida
 * el pipeline punta a punta — shell, home, example-layout, primitivos y su
 * ThreadVisualizer. Sus tokens viven en `styles/_tokens.scss` (cargados global)
 * y su skin no necesita CSS lazy de librería.
 */
export const BRUTALIST_THEME: ThemePack = {
  id: 'brutalist',
  label: 'Brutalist',
  shell: () => import('./shell/brutalist-shell.component').then((m) => m.BrutalistShellComponent),
  home: () => import('./home/brutalist-home.component').then((m) => m.BrutalistHomeComponent),
  exampleLayout: () =>
    import('./example-layout/brutalist-example-layout.component').then(
      (m) => m.BrutalistExampleLayoutComponent,
    ),
};
