/**
 * Snippets neutrales del ejemplo 07 (objetos transferibles).
 */
export const TRANSFER_SNIPPETS: Record<string, string> = {
  'transferir.ts': `// Transferir: el 2º argumento es la "transfer list". El buffer NO
// se copia (zero-copy) — cambia de dueño al worker.
const buf = new ArrayBuffer(64 * 1024 * 1024); // 64 MB
worker.postMessage({ buf, mode: 'transfer' }, [buf]);

// OJO: después del transfer, el buffer del main quedó DETACHED.
console.log(buf.byteLength); // 0  ← ya no es tuyo, no lo puedas usar`,

  'clonar.ts': `// Clonar (lo normal): sin transfer list, postMessage COPIA el buffer
// (structured clone). El main conserva el suyo intacto.
const buf = new ArrayBuffer(64 * 1024 * 1024);
worker.postMessage({ buf, mode: 'clone' });

console.log(buf.byteLength); // 67108864 ← seguís teniendo tu copia`,

  'transfer.worker.ts': `// El worker recibe el buffer y lo devuelve en el mismo modo.
addEventListener('message', ({ data }) => {
  const bytes = data.buf.byteLength;
  if (data.mode === 'transfer') {
    postMessage({ type: 'result', bytes }, [data.buf]); // de vuelta sin copiar
  } else {
    postMessage({ type: 'result', bytes });             // de vuelta clonando
  }
});`,
};
