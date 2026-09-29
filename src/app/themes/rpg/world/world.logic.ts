/**
 * Geometría del mundo: qué se puede pisar, quién está adelante, cómo llegar.
 * Lógica pura sobre una grilla, sin canvas ni Angular, para poder testear que
 * ningún mapa deja a un vecino inalcanzable.
 */
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

/** Alguien parado en el mapa: ocupa su casilla y se le puede hablar. */
export interface Actor extends Point {
  id: string;
}

export interface Grid {
  rows: readonly string[];
  actors: readonly Actor[];
}

export const DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Pasto, camino, muelle, puente y las dos salidas. Todo lo demás es pared. */
const WALKABLE = new Set(['.', '=', 'w', '_', '<', '>']);

export function tileAt(grid: Grid, x: number, y: number): string {
  return grid.rows[y]?.[x] ?? '#';
}

export function actorAt(grid: Grid, x: number, y: number): Actor | undefined {
  return grid.actors.find((actor) => actor.x === x && actor.y === y);
}

export function isWalkable(grid: Grid, x: number, y: number): boolean {
  return WALKABLE.has(tileAt(grid, x, y)) && !actorAt(grid, x, y);
}

export function step(from: Point, dir: Dir): Point {
  return { x: from.x + DELTA[dir].x, y: from.y + DELTA[dir].y };
}

/** A quién tiene adelante el jugador, si hay alguien. */
export function facingActor(grid: Grid, from: Point, dir: Dir): Actor | undefined {
  const ahead = step(from, dir);
  return actorAt(grid, ahead.x, ahead.y);
}

/** Dirección de un paso entre dos casillas vecinas. */
export function dirBetween(from: Point, to: Point): Dir {
  if (to.x > from.x) return 'right';
  if (to.x < from.x) return 'left';
  return to.y > from.y ? 'down' : 'up';
}

export type BadgeSpot = 'above' | 'right' | 'left';

/**
 * Dónde va el cartelito de un vecino. Arriba de su cabeza, salvo que ahí haya
 * alguien parado: entonces se corre al costado que esté libre, para no taparle
 * la cara a nadie.
 */
export function badgeSpot(person: Point, everyone: readonly Point[]): BadgeSpot {
  const taken = (x: number, y: number) =>
    everyone.some((other) => Math.round(other.x) === x && Math.round(other.y) === y);
  if (!taken(person.x, person.y - 1)) {
    return 'above';
  }
  return taken(person.x + 1, person.y) && !taken(person.x - 1, person.y) ? 'left' : 'right';
}

/**
 * Camino más corto entre dos casillas (sin contar la de partida). Vacío si el
 * destino es la partida o si no se puede llegar. Es un BFS: en una grilla de
 * 16x10 alcanza y sobra.
 */
export function findPath(grid: Grid, from: Point, to: Point): Point[] {
  if (from.x === to.x && from.y === to.y) {
    return [];
  }
  const key = (p: Point) => `${p.x},${p.y}`;
  const cameFrom = new Map<string, Point | null>([[key(from), null]]);
  const queue: Point[] = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === to.x && current.y === to.y) {
      const path: Point[] = [];
      for (let p: Point | null = current; p && cameFrom.get(key(p)); p = cameFrom.get(key(p))!) {
        path.unshift(p);
      }
      return path;
    }
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const next = step(current, dir);
      if (!cameFrom.has(key(next)) && isWalkable(grid, next.x, next.y)) {
        cameFrom.set(key(next), current);
        queue.push(next);
      }
    }
  }
  return [];
}

/**
 * Cómo acercarse a alguien para hablarle: el camino hasta la casilla vecina más
 * cercana y hacia dónde mirar al llegar. `null` si no hay forma de llegar.
 */
export function approach(
  grid: Grid,
  from: Point,
  actor: Actor,
): { path: Point[]; facing: Dir } | null {
  let best: { path: Point[]; facing: Dir } | null = null;
  for (const dir of Object.keys(DELTA) as Dir[]) {
    const spot = step(actor, dir);
    const standingThere = spot.x === from.x && spot.y === from.y;
    if (!standingThere && !isWalkable(grid, spot.x, spot.y)) {
      continue;
    }
    const path = findPath(grid, from, spot);
    if (!standingThere && path.length === 0) {
      continue;
    }
    if (!best || path.length < best.path.length) {
      best = { path, facing: dirBetween(spot, actor) };
    }
  }
  return best;
}
