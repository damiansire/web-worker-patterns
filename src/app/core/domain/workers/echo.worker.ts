/// <reference lib="webworker" />
import { buildReply } from './echo.worker.logic';

/**
 * Worker de eco (ejemplo 03): recibe un mensaje del main y responde en la otra
 * dirección. Demuestra la comunicación bidireccional (postMessage en ambos lados).
 *
 * Responde de inmediato, a propósito: el round-trip que mide la UI es el costo REAL
 * de cruzar el thread (sub-milisegundo). Antes había un setTimeout(350) artificial
 * que inflaba el número y enseñaba que "cruzar el hilo cuesta 350ms" — un mito.
 *
 * Protocolo neutral:
 *   in:  { id: number, text: string }
 *   out: { id: number, text: string, length: number }
 */
addEventListener('message', ({ data }: MessageEvent) => {
  const id = data?.id as number;
  const text = String(data?.text ?? '');
  postMessage({ id, ...buildReply(text) });
});
