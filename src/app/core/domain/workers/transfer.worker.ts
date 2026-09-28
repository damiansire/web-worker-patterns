/// <reference lib="webworker" />

/**
 * Worker de objetos transferibles (ejemplo 07): recibe un ArrayBuffer y lo
 * DEVUELVE, en el mismo modo en que llegó:
 *   - 'transfer': lo devuelve con transfer list (zero-copy en los dos sentidos).
 *   - 'clone':    lo devuelve por structured clone (se copia en los dos sentidos).
 * Así el round-trip que mide el main compara lo mismo en ambos modos: ida y
 * vuelta del buffer completo.
 *
 * Protocolo neutral:
 *   out: { type: 'ready' }                       (una vez, al arrancar)
 *   in:  { buf: ArrayBuffer, mode: 'transfer' | 'clone' }
 *   out: { type: 'result', mode, buffer }        (con transfer list si mode === 'transfer')
 */

// El main espera este aviso antes de cronometrar: si midiera desde la creación del
// worker, el número incluiría bajar, parsear y arrancar el script, no el envío.
postMessage({ type: 'ready' });

addEventListener('message', ({ data }: MessageEvent) => {
  const buf = data?.buf as ArrayBuffer | undefined;
  if (!buf) {
    return;
  }
  if (data.mode === 'transfer') {
    // Devuelve el buffer transfiriéndolo de vuelta (zero-copy).
    postMessage({ type: 'result', mode: 'transfer', buffer: buf }, [buf]);
  } else {
    // Sin transfer list: el buffer se vuelve a copiar entero en la vuelta.
    postMessage({ type: 'result', mode: 'clone', buffer: buf });
  }
});
