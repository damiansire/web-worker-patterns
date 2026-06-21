import { type FactoryProvider, inject, type InjectionToken } from '@angular/core';

/**
 * Provider de opciones en cascada (estilo Taiga UI `tuiProvideOptions`): fusiona
 * las opciones del ancestro (`skipSelf`) con el override local, de modo que la
 * configuración fluye hacia abajo por el árbol de DI sin servicios mutables.
 */
export function provideOptions<T>(
  token: InjectionToken<T>,
  options: Partial<T> | (() => Partial<T>),
  fallback: T,
): FactoryProvider {
  return {
    provide: token,
    useFactory: (): T => ({
      ...(inject(token, { optional: true, skipSelf: true }) || fallback),
      ...(typeof options === 'function' ? options() : options),
    }),
  };
}
