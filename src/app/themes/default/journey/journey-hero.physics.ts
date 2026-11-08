/**
 * Física pura de la escena de portada (`journey-hero`). Sin DOM ni GSAP: se
 * testea sola. Los resortes dan el toque elástico (un toque suma velocidad, no
 * fija una pose); el pseudoazar con semilla hace que el detalle generado salga
 * igual en cada carga; `jugglePoint` es la trayectoria de una pelota del malabar.
 */

/** Un resorte amortiguado: posición, velocidad, objetivo, rigidez y amortiguación. */
export interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  d: number;
}

export const spring = (x = 0, k = 180, d = 16): Spring => ({ x, v: 0, t: x, k, d });

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Paso máximo: después de un congelamiento real el delta es enorme y explotaría. */
export const MAX_STEP = 0.034;

/** Avanza los resortes `dt` segundos (dos medios pasos semi-implícitos). */
export function stepSprings(springs: readonly Spring[], dt: number): void {
  const h = clamp(dt, 0, MAX_STEP) / 2;
  for (let n = 0; n < 2; n++) {
    for (const s of springs) {
      s.v += (-(s.x - s.t) * s.k - s.v * s.d) * h;
      s.x += s.v * h;
    }
  }
}

/** Pseudoazar con semilla en [0, 1): mismo `k`, mismo valor. */
export function seeded(k: number): number {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Posición de una pelota del malabar (cascada de dos manos) relativa al punto
 * medio entre las manos. `phase` en vueltas (1 = ciclo completo): la primera
 * mitad es el arco por arriba de la cabeza, de la mano derecha a la izquierda;
 * la segunda, el pase corto por abajo de vuelta a la derecha.
 */
export function jugglePoint(phase: number, span = 92, height = 190): { x: number; y: number } {
  const p = phase - Math.floor(phase);
  const angle = p * Math.PI * 2;
  const x = Math.cos(angle) * span;
  const y = p < 0.5 ? -Math.sin(angle) * height : -Math.sin(angle) * 16;
  return { x, y };
}
