/**
 * Lógica pura del worker de eco (ejemplo 03), extraída para testearla sin
 * levantar un Web Worker real. El worker recibe un mensaje del main, lo
 * "procesa" (acá: a mayúsculas + largo) y responde — postMessage en la otra
 * dirección. La transformación deja claro que el worker TRABAJÓ con el dato,
 * no que lo rebotó; el concepto es la comunicación bidireccional.
 */
export interface EchoReply {
  text: string;
  length: number;
}

export function buildReply(text: string): EchoReply {
  return { text: text.toUpperCase(), length: text.length };
}
