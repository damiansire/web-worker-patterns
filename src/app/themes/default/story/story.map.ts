import { Chapter, CHAPTERS, Level, LEVELS } from './story.levels';

/**
 * Trazado del mapa de la historia: dónde cae cada nivel en el mundo, por dónde
 * pasa el camino, dónde va el hito de cada capítulo y dónde crecen los árboles.
 * Lógica pura (se testea sin TestBed); el dibujo vive en `story-map.component`.
 *
 * Hay dos trazados con el mismo dibujo: `wide` (pantalla apaisada, el mundo
 * entra entero) y `tall` (celular parado, más filas y el mundo se recorre
 * bajando). Las medidas están en unidades del viewBox; `s` agranda nodos,
 * carteles y personaje en el trazado angosto para que se lean igual.
 */
export type MapShape = 'wide' | 'tall';

export interface MapSpec {
  view: { w: number; h: number };
  /** Altura del horizonte: arriba cielo, abajo tierra. */
  horizon: number;
  cols: number;
  x0: number;
  colStep: number;
  row0: number;
  rowStep: number;
  /** Cuánto sube y baja cada nivel respecto de su fila, para que no sea una grilla. */
  wobble: number;
  s: number;
  /** Largo máximo de renglón de los nombres. */
  chars: number;
  /** Cuánto sale el camino por el costado al cambiar de fila. */
  turn: number;
}

export const MAP_SPECS: Record<MapShape, MapSpec> = {
  wide: {
    view: { w: 1920, h: 1110 },
    horizon: 330,
    cols: 6,
    x0: 260,
    colStep: 280,
    row0: 470,
    rowStep: 250,
    wobble: 20,
    s: 1,
    chars: 20,
    turn: 150,
  },
  tall: {
    view: { w: 1080, h: 2470 },
    horizon: 470,
    cols: 3,
    x0: 230,
    colStep: 310,
    row0: 620,
    rowStep: 330,
    wobble: 26,
    s: 1.7,
    chars: 13,
    turn: 170,
  },
};

export interface Point {
  x: number;
  y: number;
}

export interface MapSpot extends Point {
  row: number;
}

/** Un tramo del camino entre dos niveles seguidos, como curva de Bézier. */
export interface Segment {
  a: Point;
  c1: Point;
  c2: Point;
  b: Point;
}

export interface Landmark extends Point {
  chapter: Chapter['key'];
}

/** Un adorno del paisaje (árbol, mata, flor): `k` decide la variante, `size` la escala. */
export interface Prop extends Point {
  k: number;
  size: number;
}

/** Pseudoazar con semilla: el paisaje sale igual cada vez. */
export function hash(k: number, seed = 0): number {
  const x = Math.sin(k * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Niveles en serpentina: filas que van y vuelven, con un vaivén suave. */
export function mapSpots(spec: MapSpec, count = LEVELS.length): MapSpot[] {
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / spec.cols);
    const k = i % spec.cols;
    const col = row % 2 === 0 ? k : spec.cols - 1 - k;
    return {
      x: spec.x0 + col * spec.colStep,
      y: spec.row0 + row * spec.rowStep + Math.round(spec.wobble * Math.sin(i * 2.3)),
      row,
    };
  });
}

/** En la fila, una S suave; al cambiar de fila, una U que sale por el costado. */
export function segment(a: MapSpot, b: MapSpot, spec: MapSpec): Segment {
  if (a.row === b.row) {
    const mx = (a.x + b.x) / 2;
    return { a, c1: { x: mx, y: a.y }, c2: { x: mx, y: b.y }, b };
  }
  const out = spec.turn * (a.x > spec.view.w / 2 ? 1 : -1);
  return { a, c1: { x: a.x + out, y: a.y }, c2: { x: b.x + out, y: b.y }, b };
}

export function segments(spots: readonly MapSpot[], spec: MapSpec): Segment[] {
  return spots.slice(1).map((b, i) => segment(spots[i], b, spec));
}

/** El tramo sin su punto de partida, para encadenarlo en un solo `<path>`. */
export function segmentTail(g: Segment): string {
  return `C${g.c1.x} ${g.c1.y} ${g.c2.x} ${g.c2.y} ${g.b.x} ${g.b.y}`;
}

/** El camino desde el primer nivel hasta el `upTo` (inclusive). */
export function roadPath(
  spots: readonly MapSpot[],
  spec: MapSpec,
  upTo = spots.length - 1,
): string {
  if (!spots.length) return '';
  const tails = segments(spots.slice(0, upTo + 1), spec).map(segmentTail);
  return `M${spots[0].x} ${spots[0].y}${tails.join('')}`;
}

export function bezierAt(g: Segment, t: number): Point {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: w[0] * g.a.x + w[1] * g.c1.x + w[2] * g.c2.x + w[3] * g.b.x,
    y: w[0] * g.a.y + w[1] * g.c1.y + w[2] * g.c2.y + w[3] * g.b.y,
  };
}

/**
 * Un hito por capítulo (la casa de main, la torre del reloj...), parado al
 * borde del camino entre dos de sus niveles de la misma fila. Si el capítulo
 * tiene un solo nivel, va entre ese nivel y su vecino de fila.
 */
export function landmarks(
  spots: readonly MapSpot[],
  spec: MapSpec,
  levels: readonly Level[] = LEVELS,
): Landmark[] {
  const between = (chapter: Chapter['key'], i: number, j: number): Landmark => ({
    chapter,
    x: (spots[i].x + spots[j].x) / 2,
    y: (spots[i].y + spots[j].y) / 2 - 30 * spec.s,
  });
  return CHAPTERS.map((ch) => {
    const idx = levels.flatMap((l, i) => (l.chapter === ch.key ? [i] : []));
    const pairs = idx
      .slice(1)
      .map((j, n) => [idx[n], j] as const)
      .filter(([i, j]) => spots[i].row === spots[j].row);
    if (pairs.length) {
      const [i, j] = pairs[Math.ceil((pairs.length - 1) / 2)];
      return between(ch.key, i, j);
    }
    const i = idx[0];
    const j = spots[i + 1]?.row === spots[i].row ? i + 1 : i - 1;
    return between(ch.key, i, j);
  });
}

/**
 * Siembra `n` adornos en la tierra, lejos del camino, de los niveles y de los
 * hitos. Cubre también lo que queda fuera del viewBox, porque en una pantalla
 * más ancha o más alta que el dibujo se ve el borde del mundo.
 */
export function scatter(
  spec: MapSpec,
  spots: readonly MapSpot[],
  n: number,
  seed: number,
  clear: { node: number; road: number; landmark: number },
): Prop[] {
  const segs = segments(spots, spec);
  const road = segs.flatMap((g) => [0.2, 0.4, 0.6, 0.8].map((t) => bezierAt(g, t)));
  const marks = landmarks(spots, spec);
  const far = (p: Point, list: readonly Point[], r: number) =>
    list.every((q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 >= r * r);
  const out: Prop[] = [];
  const x0 = -spec.view.w * 0.4;
  const w = spec.view.w * 1.8;
  const y0 = spec.horizon + 30 * spec.s;
  const h = spec.view.h + spec.view.h * 0.3 - y0;
  for (let k = 0; out.length < n && k < n * 40; k++) {
    const p = { x: x0 + hash(k, seed) * w, y: y0 + hash(k + 0.5, seed) * h };
    if (!far(p, spots, clear.node) || !far(p, road, clear.road)) continue;
    if (!far(p, marks, clear.landmark)) continue;
    out.push({ ...p, k: hash(k + 0.25, seed), size: 0.75 + hash(k + 0.75, seed) * 0.5 });
  }
  return out.sort((a, b) => a.y - b.y);
}

/** Un perfil de cerros entre `from` y `to`, cerrado hacia abajo. */
export function ridge(
  seed: number,
  baseY: number,
  amp: number,
  from: number,
  to: number,
  step: number,
): string {
  const pts: Point[] = [];
  for (let x = from, i = 0; x <= to + step; x += step, i++) {
    pts.push({ x, y: Math.round(baseY - amp * (0.35 + 0.65 * hash(i, seed))) });
  }
  let d = `M${from} ${baseY + 4000}L${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const mx = (p.x + pts[i].x) / 2;
    const my = (p.y + pts[i].y) / 2;
    d += `Q${p.x} ${p.y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${last.x} ${last.y}L${last.x} ${baseY + 4000}Z`;
}

/** Una nube de ancho `w` apoyada en (x, y). */
export function cloudPath(x: number, y: number, w: number): string {
  const u = w / 100;
  const p = (dx: number, dy: number) => `${Math.round(x + dx * u)} ${Math.round(y + dy * u)}`;
  return (
    `M${p(-50, 0)}C${p(-62, -2)} ${p(-60, -26)} ${p(-38, -24)}` +
    `C${p(-36, -48)} ${p(-6, -52)} ${p(4, -32)}` +
    `C${p(14, -50)} ${p(46, -44)} ${p(42, -20)}` +
    `C${p(62, -22)} ${p(64, 2)} ${p(48, 2)}Z`
  );
}

/** Parte un texto en renglones de hasta `max` caracteres, sin cortar palabras. */
export function wrapWords(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && (last + ' ' + word).length <= max)
      lines[lines.length - 1] += ' ' + word;
    else lines.push(word);
  }
  return lines;
}
