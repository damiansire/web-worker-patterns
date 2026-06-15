/// <reference lib="webworker" />

/**
 * Worker de costo de structured clone (ejemplo 15): recibe un payload y lo
 * devuelve TAL CUAL, sin transformarlo.
 *
 * Lo que mide el main es el round-trip: el payload se clona al salir
 * (main → worker) y se clona de nuevo al volver (worker → main). Ese tiempo es
 * el costo REAL del structured clone, no un número inventado. Como el worker no
 * hace ningún trabajo, lo único que pesa es el clon: por eso aísla el concepto.
 *
 * Protocolo neutral:
 *   in:  { id: number, payload: unknown }
 *   out: { id: number, payload: unknown }
 */
addEventListener('message', ({ data }: MessageEvent) => {
  const id = data?.id as number;
  postMessage({ id, payload: data?.payload });
});
