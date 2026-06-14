import { InjectionToken, Type } from '@angular/core';

/**
 * Contrato de botón (ARQUITECTURA §5). Cada theme registra su botón vía `BUTTON`.
 * Se consume dentro de las plantillas del propio theme; el token deja la puerta
 * abierta a un layout compartido que resuelva primitivos por DI.
 */
export abstract class ButtonContract {}

export const BUTTON = new InjectionToken<Type<unknown>>('BUTTON');
