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
 *
 * La definición real vive ahora en `@worker-patterns/core` (paquete agnóstico
 * de framework extraído en wwp-3/wwp-5, `packages/worker-patterns-core/`):
 * este archivo re-exporta para no tocar los ~14 sitios que ya importan de acá.
 */
export type { WorkerLike } from '@worker-patterns/core';
