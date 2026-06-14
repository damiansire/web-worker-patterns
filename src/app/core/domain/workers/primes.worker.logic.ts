/**
 * Lógica pura del worker de cómputo pesado (ejemplo 04), extraída para testearla
 * y para poder reusarla EN EL MAIN (la demo corre exactamente la misma función
 * en los dos lados: en un worker la UI sigue fluida, en el main se congela).
 *
 * Cuenta los primos hasta `limit` por división de prueba — deliberadamente O(n√n)
 * para que el trabajo sea pesado y el congelamiento del main se sienta.
 */
export function countPrimesUpTo(limit: number): number {
  let count = 0;
  for (let n = 2; n <= limit; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      count += 1;
    }
  }
  return count;
}
