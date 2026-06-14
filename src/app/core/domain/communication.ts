/**
 * Modelo neutral del intercambio de mensajes main <-> worker (ejemplo 03).
 * No conoce themes: cada theme dibuja este flujo a su manera.
 */
export type MsgDirection = 'out' | 'in';

export interface ExchangeMessage {
  /** Id que correlaciona el envío con su respuesta (para medir el round-trip). */
  id: number;
  direction: MsgDirection;
  text: string;
  /** Metadato de la respuesta (ej. "4 chars"); se dibuja apagado, no es contenido. */
  meta?: string;
  atMs: number;
  /** Solo en mensajes entrantes: ida + vuelta en ms. */
  roundTripMs?: number;
}
