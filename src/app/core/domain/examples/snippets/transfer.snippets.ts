/**
 * Snippets neutrales del ejemplo 07 (objetos transferibles).
 */
export const TRANSFER_SNIPPETS: Record<string, string> = {
  'transferir.ts': `// Transferir: el 2º argumento es la "transfer list". El buffer NO
// se copia (zero-copy): cambia de dueño al worker, y vuelve igual.
const buf = new ArrayBuffer(64 * 1024 * 1024); // 64 MB
worker.onmessage = (e) => {
  if (e.data.type === 'result') console.log(e.data.buffer.byteLength); // 67108864: volvió
};
worker.postMessage({ buf, mode: 'transfer' }, [buf]);

// OJO: después del transfer, el buffer del main quedó DETACHED.
console.log(buf.byteLength); // 0  ← ya no es tuyo: sus métodos tiran TypeError

// Un TypedArray no se transfiere: se transfiere su buffer.
const view = new Uint8Array(1024);
worker.postMessage({ buf: view.buffer, mode: 'transfer' }, [view.buffer]);
console.log(view.length); // 0: la vista quedó sin buffer`,

  'clonar.ts': `// Clonar (lo normal): sin transfer list, postMessage COPIA el buffer
// (structured clone). El main conserva el suyo intacto.
const buf = new ArrayBuffer(64 * 1024 * 1024);
worker.onmessage = (e) => {
  if (e.data.type === 'result') console.log(e.data.buffer.byteLength); // otra copia
};
worker.postMessage({ buf, mode: 'clone' });

console.log(buf.byteLength); // 67108864 ← seguís teniendo tu copia`,

  'transfer.worker.ts': `// El worker recibe el buffer y lo DEVUELVE en el mismo modo.
addEventListener('message', ({ data }) => {
  const { buf, mode } = data;
  if (mode === 'transfer') {
    postMessage({ type: 'result', mode, buffer: buf }, [buf]); // vuelve sin copiar
  } else {
    postMessage({ type: 'result', mode, buffer: buf }); // vuelve clonado (otra copia)
  }
});`,
};
