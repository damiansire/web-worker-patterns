/**
 * Lógica pura del worker de costo de structured clone (ejemplo 15), extraída
 * para testearla sin levantar un Web Worker real.
 *
 * El concepto: postMessage CLONA el payload (structured clone). Ese costo no es
 * "cruzar el hilo" —eso es sub-ms— sino serializar/deserializar el grafo, y
 * crece con el TAMAÑO (cuántos datos) y la COMPLEJIDAD estructural (cuántos
 * nodos / qué tan anidado). Acá no inventamos una curva: construimos payloads
 * deterministas y dejamos que la UI mida el round-trip REAL en la máquina del
 * que aprende. Esta lógica solo arma el payload y lo describe (nodos y bytes
 * UTF-8 del JSON, un proxy del peso del clon — no su tamaño exacto, que el
 * structured clone calcula en su propio formato binario) — magnitudes
 * deterministas que sirven de eje X de la gráfica y de base para los tests.
 */

export interface PayloadConfig {
  /** Cantidad de registros hoja: controla el TAMAÑO del payload. */
  size: number;
  /** Profundidad de anidación: controla la COMPLEJIDAD estructural. */
  depth: number;
}

export interface PayloadStats {
  /** Nodos del grafo (contenedores + valores hoja): lo que el clon debe recorrer. */
  nodeCount: number;
  /**
   * Bytes UTF-8 del JSON del payload: un PROXY del peso del clon, no su tamaño exacto.
   * El structured clone usa un formato binario propio (no JSON), así que el peso real del
   * clon diverge de este número; lo usamos como eje X comparable, no como medición del clon.
   */
  serializedBytes: number;
}

/** Un registro hoja determinista (mismo índice → mismo objeto). */
function makeLeaf(i: number): Record<string, unknown> {
  return { i, v: (i * 2654435761) % 100000, label: `item-${i}` };
}

/** Envuelve un valor en `depth` niveles de anidación (cada nivel agrega un contenedor). */
function wrap(value: unknown, depth: number): unknown {
  let node = value;
  for (let level = 0; level < depth; level++) {
    node = { lvl: level, child: node };
  }
  return node;
}

/**
 * Construye un payload determinista para `config`: un lote de `size` registros
 * hoja, donde CADA hoja se anida `depth` niveles. Mismo config → misma estructura
 * (sin azar), para que la medición sea reproducible.
 *
 * Por qué cada hoja y no el lote entero: si solo envolviéramos el array una vez,
 * `depth` agregaría apenas un puñado de nodos frente a miles de hojas y la
 * complejidad no se notaría. Anidando cada hoja, `depth` multiplica los nodos por
 * registro → a igualdad de `size`, más profundidad = grafo más pesado de clonar.
 * Así los dos ejes (tamaño y complejidad) mueven el costo de forma visible.
 */
export function buildPayload({ size, depth }: PayloadConfig): unknown {
  const n = Math.max(0, Math.floor(size));
  const d = Math.max(0, Math.floor(depth));
  return Array.from({ length: n }, (_, i) => wrap(makeLeaf(i), d));
}

/** Cuenta nodos del grafo: cada objeto/array y cada valor hoja suma uno. */
export function countNodes(value: unknown): number {
  if (value === null || typeof value !== 'object') {
    return 1; // hoja primitiva (incluye null)
  }
  let count = 1; // el contenedor (objeto o array)
  for (const child of Object.values(value as Record<string, unknown>)) {
    count += countNodes(child);
  }
  return count;
}

/**
 * Bytes UTF-8 del JSON del payload. `String.length` cuenta unidades UTF-16, no bytes,
 * así que medimos los bytes reales con TextEncoder. Sigue siendo un PROXY del peso del
 * clon (el structured clone no es JSON): un eje X comparable, no el tamaño exacto del clon.
 */
export function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/** Describe un config con magnitudes deterministas (eje X de la gráfica + tests). */
export function describePayload(config: PayloadConfig): PayloadStats {
  const payload = buildPayload(config);
  return { nodeCount: countNodes(payload), serializedBytes: serializedBytes(payload) };
}
