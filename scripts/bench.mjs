// Benchmark reproducible del costo de structured clone: la tesis del ejemplo 15.
// Clonar un payload NO es "cruzar el hilo" (eso es sub-ms) sino serializar y
// reconstruir el grafo, y ese costo crece con el TAMAÑO. Lo medimos con el
// `structuredClone` global de la plataforma (el MISMO algoritmo que `postMessage`
// usa por debajo), sobre payloads deterministas, tomando la mediana de N corridas
// (robusta a un pico de GC/scheduler) tras una vuelta de warm-up.
//
// Correr:  node scripts/bench.mjs
// Los números dependen de tu máquina y versión de Node: son ilustrativos del
// SHAPE (el costo escala con el tamaño), no un valor canónico ni un gate de CI.

const SIZES = [1_000, 10_000, 50_000, 200_000]; // cantidad de registros hoja
const REPS = 7;

/** Registro hoja determinista (mismo índice → mismo objeto): sin azar, reproducible. */
function makeLeaf(i) {
  return { i, v: (i * 2654435761) % 100000, label: `item-${i}` };
}

function buildPayload(size) {
  return Array.from({ length: size }, (_, i) => makeLeaf(i));
}

function median(xs) {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function benchClone(payload) {
  structuredClone(payload); // warm-up: JIT + serializer en frío, se descarta
  const samples = [];
  for (let r = 0; r < REPS; r++) {
    const t0 = performance.now();
    structuredClone(payload);
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

console.log(`structured clone cost — mediana de ${REPS} corridas (Node ${process.version})\n`);
console.log('  registros |     bytes JSON |  clone ms');
console.log('  ----------+----------------+----------');
for (const size of SIZES) {
  const payload = buildPayload(size);
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  const ms = benchClone(payload);
  console.log(
    `  ${String(size).padStart(9)} | ${`${bytes.toLocaleString('en')} B`.padStart(14)} | ${ms
      .toFixed(2)
      .padStart(8)}`,
  );
}
console.log('\nLa lección: el costo del clon sube con el tamaño del payload. Cuando eso');
console.log('duele, transferí (zero-copy, ejemplo 07) en vez de clonar.');
