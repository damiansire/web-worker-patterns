import { InjectionToken, Type } from '@angular/core';

/**
 * Contrato de bloque de código (ARQUITECTURA §5). Cada theme registra su
 * code-block vía `CODE_BLOCK`.
 */
export abstract class CodeBlockContract {}

export const CODE_BLOCK = new InjectionToken<Type<unknown>>('CODE_BLOCK');
