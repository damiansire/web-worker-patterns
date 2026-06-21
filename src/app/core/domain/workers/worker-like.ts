/**
 * Contrato mínimo de un Worker, en dominio (no en cada servicio).
 *
 * Los servicios sólo usan un subconjunto del `Worker` del DOM, y antes cada uno
 * declaraba su propia `interface WorkerLike` — 14 copias que ya habían divergido
 * (unas con `onerror`, otras con `transfer?`). Este es el único origen: incluye
 * `onerror`/`onmessageerror` (todo demo debe poder reaccionar a un fallo) y el
 * segundo argumento `transfer?` de `postMessage` (transferables).
 *
 * `WorkerExample.workerFactory()` retorna este tipo, así los servicios consumen
 * el factory sin el doble cast `as unknown as WorkerLike`.
 */
export interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onmessageerror?: ((event: MessageEvent) => void) | null;
}
