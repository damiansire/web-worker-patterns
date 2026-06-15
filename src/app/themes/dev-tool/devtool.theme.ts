import { ThemePack } from '../../theming/theme.types';

/**
 * Theme dev-tool (ARQUITECTURA §10.6): primer theme con librería UI (@angular/cdk).
 * El command palette (⌘K) usa CDK Overlay; su CSS global se carga LAZY vía
 * `stylesheets` solo cuando el theme está activo y el ThemeService lo purga al
 * salir — la prueba real de aislamiento de CSS (§7b).
 */
export const DEVTOOL_THEME: ThemePack = {
  id: 'dev-tool',
  label: 'Dev Tool',
  stylesheets: ['/themes/dev-tool/overlay.css'],
  shell: () => import('./shell/devtool-shell.component').then((m) => m.DevToolShellComponent),
  home: () => import('./home/devtool-home.component').then((m) => m.DevToolHomeComponent),
  exampleLayout: () =>
    import('./example-layout/devtool-example-layout.component').then(
      (m) => m.DevToolExampleLayoutComponent,
    ),
};
