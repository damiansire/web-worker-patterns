/**
 * Contrato minimo de un Worker, agnostico de entorno (DOM `Worker`, un mock de
 * test, o cualquier implementacion que hable el mismo protocolo).
 *
 * Fuente canonica: nacio en `web-worker-patterns` (core/domain/workers/worker-like.ts)
 * para no duplicar 14 copias divergentes del mismo contrato entre servicios Angular.
 * Esta version es la misma interfaz, sin ninguna dependencia de framework.
 */
export interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onmessageerror?: ((event: MessageEvent) => void) | null;
}
