import { Provider, Type } from '@angular/core';

/**
 * Motor de theming (ARQUITECTURA §4).
 *
 * `skeleton` es un theme gris transitorio que envuelve la app actual y valida
 * el motor punta a punta antes de implementar los 4 themes reales.
 */
export type ThemeId = 'skeleton' | 'brutalist' | 'dev-tool' | 'narrative' | 'editorial';

export interface ThemePack {
  id: ThemeId;
  label: string;

  // Componentes lazy (standalone). El host monta `shell`; las rutas
  // theme-aware montan `home` / `exampleLayout` del theme activo.
  shell: () => Promise<Type<unknown>>;
  home: () => Promise<Type<unknown>>;
  exampleLayout: () => Promise<Type<unknown>>;

  // CSS de librería UI a inyectar SOLO cuando este theme está activo.
  stylesheets?: string[];

  // Providers propios del theme (config de su librería UI).
  providers?: Provider[];
}
