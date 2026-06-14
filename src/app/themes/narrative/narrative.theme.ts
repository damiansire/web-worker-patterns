import { ThemePack } from '../../theming/theme.types';
import { NARRATIVE_PROVIDERS } from './narrative.providers';

/** Theme narrative (ARQUITECTURA §10.7): revista/scrollytelling, serif, sin librería. */
export const NARRATIVE_THEME: ThemePack = {
  id: 'narrative',
  label: 'Narrative',
  providers: NARRATIVE_PROVIDERS,
  shell: () => import('./shell/narrative-shell.component').then((m) => m.NarrativeShellComponent),
  home: () => import('./home/narrative-home.component').then((m) => m.NarrativeHomeComponent),
  exampleLayout: () =>
    import('./example-layout/narrative-example-layout.component').then(
      (m) => m.NarrativeExampleLayoutComponent,
    ),
};
