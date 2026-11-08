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
  // La portada es el mapa de la historia; cada ejemplo, un nivel (los que no
  // tienen escena todavía se abren en su versión clásica).
  home: () => import('./story/story-map.component').then((m) => m.StoryMapComponent),
  exampleLayout: () => import('./story/story-level.component').then((m) => m.StoryLevelComponent),
};
