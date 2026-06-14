/// <reference lib="webworker" />
import { riskyTask } from './risky.worker.logic';

/**
 * Worker de "tarea riesgosa" (ejemplo 05): recibe un payload y lo procesa con
 * una función que puede lanzar (JSON.parse de un payload roto → SyntaxError).
 *
 * A propósito NO envuelve `riskyTask` en try/catch: deja que el error se
 * propague sin atrapar. Un error no atrapado dentro de un worker NO rompe la
 * página: dispara el evento `error` en el objeto Worker del main (su `onerror`),
 * y el worker sigue vivo para procesar más mensajes. Esa es la lección.
 *
 * Protocolo neutral:
 *   in:  { id: number, payload: string }
 *   out: { id: number, type: 'result', keys: number }   // sólo en el caso OK
 *   err: el throw no atrapado llega al main como ErrorEvent (worker.onerror)
 */
addEventListener('message', ({ data }: MessageEvent) => {
  const keys = riskyTask(String(data?.payload ?? '')); // si lanza, va al onerror del main
  postMessage({ id: data?.id, type: 'result', keys });
});
