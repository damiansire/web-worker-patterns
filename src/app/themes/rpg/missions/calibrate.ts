/**
 * Cuánto trabajo darle al Molinero. El cálculo es real (contar primos), así que
 * con un número fijo el freeze dura 0,7 s en una máquina rápida y más de 3 s en
 * una lenta: en la rápida casi no duele y la lección se pierde. Por eso primero
 * se mide la máquina con una sonda (en un worker, sin tocar a Main) y después se
 * elige hasta dónde contar para que la espera sea la misma para todos.
 */
export const PROBE_LIMIT = 1_000_000;

const TARGET_MS = 2200;
const FALLBACK_LIMIT = 3_000_000;
const MIN_LIMIT = 1_500_000;
const MAX_LIMIT = 12_000_000;
const STEP = 100_000;

/** Hasta dónde contar, según lo que tardó la sonda en contar hasta `PROBE_LIMIT`. */
export function heavyLimit(probeMs: number): number {
  if (!(probeMs > 0)) {
    return FALLBACK_LIMIT;
  }
  // Por división de prueba el costo crece como n^1.5: el límite, como tiempo^(2/3).
  const limit = PROBE_LIMIT * Math.pow(TARGET_MS / probeMs, 2 / 3);
  const clamped = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
  return Math.round(clamped / STEP) * STEP;
}
