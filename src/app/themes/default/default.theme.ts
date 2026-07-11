import { ThemePack } from '../../theming/theme.types';

/**
 * Theme `default`: piel neutra, sin opinión visual, dibujada solo con los tokens
 * semánticos del contrato (`theming/styles/_tokens-contract.scss`). Es la base
 * sobre la que se diseñará la identidad visual; no arrastra estética previa.
 */
export const DEFAULT_THEME: ThemePack = {
  id: 'default',
  label: 'Default',
  shell: () => import('./shell/default-shell.component').then((m) => m.DefaultShellComponent),
  home: () => import('./home/default-home.component').then((m) => m.DefaultHomeComponent),
  exampleLayout: () =>
    import('./example-layout/default-example-layout.component').then(
      (m) => m.DefaultExampleLayoutComponent,
    ),
};
