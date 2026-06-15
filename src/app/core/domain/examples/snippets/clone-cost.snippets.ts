/**
 * Snippets neutrales del ejemplo 15 (costo de structured clone). Muestran cómo se
 * mide el round-trip REAL de clonar un payload, sin inventar una curva.
 */
export const CLONE_COST_SNIPPETS: Record<string, string> = {
  'clone-cost.worker.ts': `// El worker devuelve el payload TAL CUAL: no hace trabajo.
// Así lo único que pesa en el round-trip es el structured clone.
addEventListener('message', ({ data }) => {
  postMessage({ id: data.id, payload: data.payload }); // clona al volver
});`,

  'medir.ts': `// Main thread: cronometramos el ida y vuelta REAL.
const worker = new Worker(new URL('./clone-cost.worker', import.meta.url), { type: 'module' });

function medir(payload) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    worker.onmessage = () => resolve(performance.now() - t0); // ms del round-trip
    worker.postMessage({ id: 1, payload }); // clona al salir
  });
}

// Barremos tamaños crecientes → una curva de ms vs bytes:
for (const size of [500, 1000, 2000, 4000, 8000]) {
  console.log(size, await medir(construirPayload({ size, depth })));
}`,

  'construir-payload.ts': `// 'size' controla el TAMAÑO (cuántas hojas); 'depth' la COMPLEJIDAD:
// cada hoja se anida 'depth' niveles, así la profundidad multiplica los nodos
// por registro y el costo del clon sube a igualdad de tamaño.
function construirPayload({ size, depth }) {
  const wrap = (leaf) => {
    let node = leaf;
    for (let level = 0; level < depth; level++) node = { lvl: level, child: node };
    return node;
  };
  return Array.from({ length: size }, (_, i) => wrap({ i, v: i * 2, label: 'item-' + i }));
}`,
};
