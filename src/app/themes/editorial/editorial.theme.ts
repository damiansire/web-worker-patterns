import { ThemePack } from '../../theming/theme.types';
import { EDITORIAL_PROVIDERS } from './editorial.providers';

/** Theme editorial (ARQUITECTURA §10.7): póster/arte, papel cálido, sin librería. */
export const EDITORIAL_THEME: ThemePack = {
  id: 'editorial',
  label: 'Editorial',
  providers: EDITORIAL_PROVIDERS,
  shell: () => import('./shell/editorial-shell.component').then((m) => m.EditorialShellComponent),
  home: () => import('./home/editorial-home.component').then((m) => m.EditorialHomeComponent),
  exampleLayout: () =>
    import('./example-layout/editorial-example-layout.component').then(
      (m) => m.EditorialExampleLayoutComponent,
    ),
};
