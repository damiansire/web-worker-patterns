import { InjectionToken, Type } from '@angular/core';

/**
 * Contrato de card (ARQUITECTURA §5). Contenedor de sección que cada theme dibuja
 * a su manera. Se registra vía `CARD`.
 */
export abstract class CardContract {}

export const CARD = new InjectionToken<Type<unknown>>('CARD');
