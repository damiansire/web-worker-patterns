/**
 * Lógica pura del contador sobre memoria compartida (ejemplo 12), extraída del
 * worker para poder testear Atomics directamente (sin un Worker real ni el DOM).
 *
 * El worker recibe un SharedArrayBuffer y, en cada paso, incrementa el entero en
 * el índice 0 con `Atomics.add`. Atomics garantiza que el incremento sea
 * read-modify-write atómico aun si varios hilos tocan la misma celda: nunca se
 * pierde una suma por una condición de carrera.
 */

/**
 * Hace UN incremento atómico en la celda 0 y devuelve el nuevo valor.
 * `Atomics.add` retorna el valor PREVIO, así que el nuevo es ese + 1.
 */
export function incrementShared(view: Int32Array): number {
  return Atomics.add(view, 0, 1) + 1;
}

/** Lee el valor actual de la celda 0 de forma coherente entre hilos. */
export function readShared(view: Int32Array): number {
  return Atomics.load(view, 0);
}

/**
 * True si este paso alcanzó (o superó) el target: el worker debería cerrarse.
 * Centraliza la condición de corte para que worker y test compartan la misma regla.
 */
export function reachedTarget(value: number, target: number): boolean {
  return value >= target;
}
