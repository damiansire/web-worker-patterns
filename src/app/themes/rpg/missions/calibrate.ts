/**
 * Cuánto trabajo darle al Molinero. El cálculo es real (contar primos), así que
 * con un número fijo el freeze dura 0,7 s en una máquina rápida y más de 3 s en
 * una lenta: en la rápida casi no duele y la lección se pierde. Por eso primero
 * se mide la máquina con una sonda (en un worker, sin tocar a Main) y después se
 * elige hasta dónde contar para que la espera sea la misma para todos.
 *
 * La sonda son dos cuentas, una hasta la mitad que la otra. Lo que tarda cada una
 * incluye arrancar el worker, que no es trabajo: restándolas, el arranque se
 * cancela y queda solo lo que costó contar.
 */
export const PROBE_LIMIT = 1_000_000;
export const PROBE_HALF = PROBE_LIMIT / 2;

const TARGET_MS = 2200;
const FALLBACK_LIMIT = 3_000_000;
const MIN_LIMIT = 1_500_000;
const MAX_LIMIT = 12_000_000;
const STEP = 100_000;
/** Por división de prueba, contar hasta n cuesta como n^1.5. */
const GROWTH = 1.5;

/**
 * Lo que cuesta contar hasta `PROBE_LIMIT`, sin el arranque del worker. `halfMs` y
 * `fullMs` son lo que tardaron, de punta a punta, la cuenta corta y la larga.
 */
export function probeCost(halfMs: number, fullMs: number): number {
  if (!(fullMs > 0)) {
    return 0;
  }
  if (!(halfMs > 0) || halfMs >= fullMs) {
    return fullMs; // sin una resta que sirva, lo medido de punta a punta
  }
  return (fullMs - halfMs) / (1 - Math.pow(PROBE_HALF / PROBE_LIMIT, GROWTH));
}

/** Hasta dónde contar, según lo que costó contar hasta `PROBE_LIMIT`. */
export function heavyLimit(probeMs: number): number {
  if (!(probeMs > 0)) {
    return FALLBACK_LIMIT;
  }
  const limit = PROBE_LIMIT * Math.pow(TARGET_MS / probeMs, 1 / GROWTH);
  const clamped = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
  return Math.round(clamped / STEP) * STEP;
}
