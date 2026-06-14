/// <reference lib="webworker" />

/**
 * Worker de objetos transferibles (ejemplo 07): recibe un ArrayBuffer y lo
 * devuelve, en el mismo modo en que llegó:
 *   - 'transfer': lo devuelve con transfer list (zero-copy en los dos sentidos).
 *   - 'clone':    lo devuelve por structured clone (se copia en los dos sentidos).
 * Reporta cuántos bytes recibió para probar que el dato llegó completo.
 *
 * Protocolo neutral:
 *   in:  { buf: ArrayBuffer, mode: 'transfer' | 'clone' }
 *   out: { type: 'result', mode, bytes }   (con transfer list si mode === 'transfer')
 */
addEventListener('message', ({ data }: MessageEvent) => {
  const buf = data?.buf as ArrayBuffer | undefined;
  if (!buf) {
    return;
  }
  const bytes = buf.byteLength;
  if (data.mode === 'transfer') {
    // Devuelve el buffer transfiriéndolo de vuelta (zero-copy).
    postMessage({ type: 'result', mode: 'transfer', bytes }, [buf]);
  } else {
    postMessage({ type: 'result', mode: 'clone', bytes });
  }
});
