import { ThemePack } from '../../theming/theme.types';

/**
 * Theme "skeleton": skin gris neutro que envuelve la app actual y valida el
 * motor de theming punta a punta (ARQUITECTURA §10.3-§10.4). Su shell reproduce
 * el layout existente; su home y example-layout son neutrales, dibujados solo
 * con tokens semánticos, para demostrar el puente dominio -> theme -> tokens.
 */
export const SKELETON_THEME: ThemePack = {
  id: 'skeleton',
  label: 'Skeleton',
  shell: () =>
    import('./shell/skeleton-shell.component').then((m) => m.SkeletonShellComponent),
  home: () =>
    import('./home/skeleton-home.component').then((m) => m.SkeletonHomeComponent),
  exampleLayout: () =>
    import('./example-layout/skeleton-example-layout.component').then(
      (m) => m.SkeletonExampleLayoutComponent,
    ),
};
