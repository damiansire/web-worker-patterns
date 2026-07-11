import { Type } from '@angular/core';

/**
 * Motor de theming (ARQUITECTURA §4).
 *
 * Los themes son data-driven: el registry (`theme.registry.ts`) es la fuente de
 * verdad de qué themes existen, y el `id` es simplemente su clave. Hoy hay un
 * único theme (`default`); sumar más es agregar su `ThemePack` al registry, sin
 * tocar tipos ni el motor.
 */
export type ThemeId = string;

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
}
