/**
 * Snippets neutrales del ejemplo 12 (SharedArrayBuffer + Atomics).
 */
export const SHARED_MEMORY_SNIPPETS: Record<string, string> = {
  'en-el-main.ts': `// Una sola memoria, compartida con el worker (NO se copia).
const sab = new SharedArrayBuffer(4);   // 4 bytes = un Int32
const view = new Int32Array(sab);
worker.postMessage({ command: 'start', sab }); // se comparte, no se clona

// El main LEE esa misma memoria por su cuenta — sin recibir mensajes:
setInterval(() => render(Atomics.load(view, 0)), 30);`,

  'en-el-worker.ts': `// El worker escribe en la MISMA memoria. No le manda nada al main.
addEventListener('message', ({ data }) => {
  const view = new Int32Array(data.sab);
  setInterval(() => Atomics.add(view, 0, 1), 60); // incrementa el entero compartido
});
// El main ve subir el valor sin un solo postMessage de por medio.`,

  'coop-coep.txt': `# SharedArrayBuffer sólo existe si la página está cross-origin isolated.
# Hace falta servir con estas dos cabeceras:
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
# Sin ellas, typeof SharedArrayBuffer === 'undefined'.`,
};
