/**
 * Dominio del costo de clonación (ejemplo 15), neutral y sin Angular.
 *
 * Vive en `core/domain/` para que tanto el controller neutral (`core/`) como el
 * primitivo visual (`ui-primitives/clone-cost-chart.component`) lean el MISMO
 * origen sin que `core/` tenga que importar de `ui-primitives/`. Antes el punto
 * `CloneCostPoint` y `formatBytes` vivían dentro del `@Component` del chart, así
 * que el controller (en `core/`) importaba un valor de runtime desde una capa de
 * presentación, invirtiendo la regla de oro (core ⇏ ui-primitives). Enforzado por
 * la regla `core-no-ui-primitives` de `.dependency-cruiser.cjs`.
 */

/** Un punto medido de la curva de clonación. */
export interface CloneCostPoint {
  /** Eje X: bytes serializados del payload. */
  x: number;
  /** Eje Y: round-trip medido en ms. */
  y: number;
}

/** Formatea bytes a B/KB/MB. Compartido por el chart y los layouts (pie de medición). */
export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (n >= 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${Math.round(n)} B`;
}
