/**
 * Lógica pura del contador sobre memoria compartida (ejemplo 12), extraída del
 * worker para poder testear Atomics directamente (sin un Worker real ni el DOM).
 *
 * El worker recibe un SharedArrayBuffer y, en cada paso, incrementa el entero en
 * el índice 0 con `Atomics.add`. Atomics garantiza que el incremento sea
 * read-modify-write atómico aun si varios hilos tocan la misma celda: nunca se
 * pierde una suma por una condición de carrera.
 *
 * La implementación real vive ahora en `@worker-patterns/core` (paquete
 * agnóstico de framework extraído en wwp-3/wwp-5, `packages/worker-patterns-core/`):
 * este archivo re-exporta para no tocar el worker ni el spec que ya importan de acá.
 */
export { incrementShared, readShared, reachedTarget } from '@worker-patterns/core';
