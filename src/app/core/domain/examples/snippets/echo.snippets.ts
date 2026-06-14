/**
 * Snippets neutrales del ejemplo 03 (comunicación básica). Muestran las dos
 * direcciones del postMessage y el structured clone.
 */
export const ECHO_SNIPPETS: Record<string, string> = {
  'echo.worker.ts': `// Corre en un hilo separado. Recibe un mensaje y RESPONDE.
addEventListener('message', ({ data }) => {
  const { id, text } = data;
  // procesa y manda de vuelta — postMessage en la otra dirección
  postMessage({ id, text: text.toUpperCase(), length: text.length });
});`,

  'enviar-recibir.ts': `// Main thread: las DOS direcciones.
const worker = new Worker(new URL('./echo.worker', import.meta.url), { type: 'module' });

worker.onmessage = (e) => {            // ← respuesta del worker
  console.log('main recibió:', e.data);
};

worker.postMessage({ id: 1, text: 'hola' }); // → mensaje al worker`,

  'structured-clone.ts': `// postMessage CLONA los datos (structured clone): el worker recibe una
// COPIA, no la referencia. Para mensajes chicos alcanza; para datos grandes
// conviene usar transferables (ver ejemplo 07).
worker.postMessage({ user: { name: 'Ada' }, items: [1, 2, 3] });`,
};
