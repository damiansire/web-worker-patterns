/**
 * Logica pura del contador sobre memoria compartida (Atomics), sin dependencia
 * de un Worker real ni del DOM. Extraida de web-worker-patterns (ejemplo 12).
 *
 * El "worker" (quien sea que corra este codigo: un Worker, un hilo de Node,
 * cualquier cosa que reciba el mismo SharedArrayBuffer) incrementa el entero en
 * el indice 0 con `Atomics.add`. Atomics garantiza que el incremento sea
 * read-modify-write atomico aun si varios hilos tocan la misma celda: nunca se
 * pierde una suma por una condicion de carrera.
 */

/**
 * Hace UN incremento atomico en la celda 0 y devuelve el nuevo valor.
 * `Atomics.add` retorna el valor PREVIO, asi que el nuevo es ese + 1.
 */
export function incrementShared(view: Int32Array): number {
  return Atomics.add(view, 0, 1) + 1;
}

/** Lee el valor actual de la celda 0 de forma coherente entre hilos. */
export function readShared(view: Int32Array): number {
  return Atomics.load(view, 0);
}

/**
 * True si este paso alcanzo (o supero) el target: el proceso deberia cerrarse.
 * Centraliza la condicion de corte para que productor y lector compartan la
 * misma regla.
 */
export function reachedTarget(value: number, target: number): boolean {
  return value >= target;
}
