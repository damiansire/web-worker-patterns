/**
 * Snippets neutrales del ejemplo 05 (manejo de errores en el worker).
 */
export const RISKY_SNIPPETS: Record<string, string> = {
  'risky.worker.ts': `// El worker corre una tarea que puede lanzar. NO la envuelve en
// try/catch: deja que el error se propague al main.
addEventListener('message', ({ data }) => {
  const keys = riskyTask(data.payload); // JSON.parse → puede tirar SyntaxError
  postMessage({ id: data.id, type: 'result', keys });
});`,

  'en-el-main.ts': `// El main escucha DOS canales del worker:
const worker = new Worker(new URL('./risky.worker', import.meta.url), { type: 'module' });

// 1) onmessage: el resultado cuando la tarea sale bien.
worker.onmessage = (e) => log.ok(e.data.keys);

// 2) onerror: cualquier error NO atrapado dentro del worker llega acá.
//    La página NO se rompe y el worker sigue vivo para más tareas.
worker.onerror = (e) => {
  e.preventDefault();           // evita el log rojo en consola (ya lo mostramos)
  log.error(e.message);
};

worker.postMessage({ id: 1, payload: '{roto' }); // → dispara onerror`,

  'try-catch.ts': `// Alternativa: atrapar DENTRO del worker y reportar el error como
// un mensaje normal (más control: tipás el error, agregás contexto).
addEventListener('message', ({ data }) => {
  try {
    const keys = riskyTask(data.payload);
    postMessage({ id: data.id, type: 'result', keys });
  } catch (err) {
    postMessage({ id: data.id, type: 'error', message: String(err) });
  }
});`,
};
