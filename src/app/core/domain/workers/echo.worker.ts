/// <reference lib="webworker" />
import { buildReply } from './echo.worker.logic';

/**
 * Worker de eco (ejemplo 03): recibe un mensaje del main y responde en la otra
 * dirección. Demuestra la comunicación bidireccional (postMessage en ambos
 * lados). El pequeño delay hace visible el ida y vuelta (round-trip).
 *
 * Protocolo neutral:
 *   in:  { id: number, text: string }
 *   out: { id: number, text: string, length: number }
 */
addEventListener('message', ({ data }: MessageEvent) => {
  const id = data?.id as number;
  const text = String(data?.text ?? '');
  setTimeout(() => {
    postMessage({ id, ...buildReply(text) });
  }, 350);
});
