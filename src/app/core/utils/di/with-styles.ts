import {
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  inject,
  InjectionToken,
  type Type,
} from '@angular/core';

const STYLES_MAP = new InjectionToken<Map<Type<unknown>, { destroy(): void }>>('Styles map', {
  factory: () => {
    const map = new Map<Type<unknown>, { destroy(): void }>();

    inject(DestroyRef).onDestroy(() => map.forEach((component) => component.destroy()));

    return map;
  },
});

/**
 * Inyecta los estilos de un componente "fantasma" de forma perezosa y deduplicada
 * (estilo Taiga UI `tuiWithStyles`): instancia el componente una sola vez por
 * injector y lo destruye en el teardown.
 *
 * Útil para **directivas** que necesitan CSS pero no tienen un componente que lo
 * cargue. Los componentes con `styles: [...]` propios NO lo necesitan: Angular
 * ya carga esos estilos de forma perezosa al instanciar el componente.
 *
 * @example protected readonly nothing = withStyles(ButtonStyles);
 */
export function withStyles(component: Type<unknown>): undefined {
  const map = inject(STYLES_MAP);
  const environmentInjector = inject(EnvironmentInjector);

  if (!map.has(component)) {
    map.set(component, createComponent(component, { environmentInjector }));
  }

  return;
}
