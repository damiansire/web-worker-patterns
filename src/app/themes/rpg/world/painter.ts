import { Look, Region } from './regions';
import { Dir, Point } from './world.logic';

/**
 * Dibuja una región y a su gente en un canvas, con rectángulos (pixel art hecho a
 * mano, sin imágenes). No tiene estado ni loop propio: el juego lo llama cuando
 * algo cambió. Un mapa quieto no gasta un solo frame.
 */
export const TILE = 32;
export const MAP_WIDTH = 16 * TILE;
export const MAP_HEIGHT = 10 * TILE;

export interface Person extends Point {
  look: Look;
  /** Cartelito sobre la cabeza: misión pendiente o cumplida. */
  badge?: 'todo' | 'done';
  /** Cuánto salta el cartelito (px): el festejo de una misión recién cumplida. */
  badgeLift?: number;
  facing?: Dir;
}

export interface Scene {
  region: Region;
  people: readonly Person[];
  player: Person;
  /** El main está por bloquearse: todos quedan con la mirada clavada. */
  frozen: boolean;
}

/** Ruido determinista por casilla: el pasto no cambia entre un dibujo y otro. */
const noise = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

export function paint(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { region } = scene;
  for (let y = 0; y < region.rows.length; y++) {
    for (let x = 0; x < region.rows[y].length; x++) {
      paintTile(ctx, region, x, y);
    }
  }
  // De arriba hacia abajo: el que está más cerca tapa al que está detrás.
  const everyone = [...scene.people, scene.player].sort((a, b) => a.y - b.y);
  for (const person of everyone) {
    paintPerson(ctx, person, scene.frozen);
  }
  // Los cartelitos van al final, encima de todos. Si justo arriba del vecino hay
  // alguien parado, el cartel se corre al costado para no taparle la cara.
  for (const person of scene.people) {
    const crowded = everyone.some(
      (other) => Math.round(other.x) === person.x && Math.round(other.y) === person.y - 1,
    );
    paintBadge(ctx, person, crowded);
  }
}

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function paintTile(ctx: CanvasRenderingContext2D, region: Region, x: number, y: number): void {
  const kind = region.rows[y][x];
  const X = x * TILE;
  const Y = y * TILE;
  const n = noise(x, y);
  const { ground, roof, wall } = region.palette;

  rect(ctx, X, Y, TILE, TILE, ground);
  if (n % 3 === 0) {
    rect(ctx, X + (n % 24), Y + (noise(y, x) % 24), 4, 4, 'rgba(0, 0, 0, 0.08)');
  }

  switch (kind) {
    case '=':
    case '<':
    case '>':
      rect(ctx, X, Y, TILE, TILE, '#d9b97a');
      rect(ctx, X + 6, Y + 10, 4, 4, '#c9a765');
      rect(ctx, X + 20, Y + 22, 4, 4, '#c9a765');
      if (kind !== '=') {
        paintArrow(ctx, X, Y, kind === '>' ? 1 : -1);
      }
      break;
    case '#':
      rect(ctx, X + 12, Y + 20, 8, 12, '#6b4a2b');
      rect(ctx, X + 4, Y + 4, 24, 20, region.palette.tree);
      rect(ctx, X + 8, Y, 16, 8, region.palette.tree);
      rect(ctx, X + 8, Y + 8, 6, 6, 'rgba(255, 255, 255, 0.12)');
      break;
    case '~':
      rect(ctx, X, Y, TILE, TILE, '#3d7fc4');
      rect(ctx, X + 4 + (n % 12), Y + 8, 12, 3, '#7ab3e8');
      rect(ctx, X + 10, Y + 22, 10, 3, '#7ab3e8');
      break;
    case 'w':
    case '_': {
      const inset = kind === 'w' ? 4 : 0;
      rect(ctx, X, Y, TILE, TILE, '#3d7fc4');
      rect(ctx, X + inset, Y, TILE - inset * 2, TILE, '#a9763f');
      for (let i = 0; i < 4; i++) {
        rect(ctx, X + inset, Y + i * 8 + 6, TILE - inset * 2, 2, '#8a5a33');
      }
      break;
    }
    case '^':
      rect(ctx, X, Y, TILE, TILE, '#8d8a80');
      rect(ctx, X, Y + 14, TILE, 2, '#6f6c63');
      rect(ctx, X + 14, Y, 2, 14, '#6f6c63');
      rect(ctx, X + 6, Y + 16, 2, 16, '#6f6c63');
      rect(ctx, X + 22, Y + 16, 2, 16, '#6f6c63');
      break;
    case 'R':
      rect(ctx, X, Y, TILE, TILE, roof);
      rect(ctx, X, Y + 12, TILE, 4, 'rgba(0, 0, 0, 0.18)');
      rect(ctx, X, Y + 28, TILE, 4, 'rgba(0, 0, 0, 0.18)');
      break;
    case 'H': {
      rect(ctx, X, Y, TILE, TILE, wall);
      rect(ctx, X, Y + 28, TILE, 4, 'rgba(0, 0, 0, 0.15)');
      const isMiddle = region.rows[y][x - 1] === 'H' && region.rows[y][x + 1] === 'H';
      if (isMiddle) {
        rect(ctx, X + 8, Y + 6, 16, 26, '#6b4a2b');
        rect(ctx, X + 20, Y + 18, 2, 3, '#e0a23a');
      } else {
        rect(ctx, X + 8, Y + 8, 16, 12, '#7ab3e8');
        rect(ctx, X + 15, Y + 8, 2, 12, wall);
      }
      break;
    }
  }
}

/** Flecha de salida: una punta hecha de escalones, apuntando hacia afuera. */
function paintArrow(ctx: CanvasRenderingContext2D, X: number, Y: number, dir: 1 | -1): void {
  const tip = dir === 1 ? X + 22 : X + 6;
  for (let i = 0; i < 4; i++) {
    rect(ctx, tip - dir * i * 4, Y + 14 - i * 2, 4, 4 + i * 4, '#8a5a33');
  }
}

function paintPerson(ctx: CanvasRenderingContext2D, person: Person, frozen: boolean): void {
  const X = person.x * TILE;
  const Y = person.y * TILE;
  const { skin, shirt, hair } = person.look;

  rect(ctx, X + 8, Y + 27, 16, 4, 'rgba(0, 0, 0, 0.25)');
  rect(ctx, X + 9, Y + 16, 14, 11, shirt);
  rect(ctx, X + 8, Y + 4, 16, 13, frozen ? '#ff9a9d' : skin);
  rect(ctx, X + 8, Y + 2, 16, 5, hair);

  if (person.facing === 'up') {
    rect(ctx, X + 8, Y + 4, 16, 9, hair); // de espaldas: se le ve la nuca
    return;
  }
  const shift = person.facing === 'left' ? -2 : person.facing === 'right' ? 2 : 0;
  if (frozen) {
    rect(ctx, X + 11 + shift, Y + 10, 4, 2, '#1a1a17');
    rect(ctx, X + 17 + shift, Y + 10, 4, 2, '#1a1a17');
  } else {
    rect(ctx, X + 12 + shift, Y + 9, 2, 3, '#1a1a17');
    rect(ctx, X + 18 + shift, Y + 9, 2, 3, '#1a1a17');
  }
}

function paintBadge(ctx: CanvasRenderingContext2D, person: Person, crowded: boolean): void {
  if (!person.badge) return;
  const X = person.x * TILE + (crowded ? 22 : 9);
  const Y = person.y * TILE - (crowded ? 2 : 16) - (person.badgeLift ?? 0);
  const done = person.badge === 'done';

  // Borde claro: el cartel se lee sobre una puerta, un techo o el pasto.
  rect(ctx, X - 1, Y - 1, 16, 16, '#fbfaf6');
  rect(ctx, X, Y, 14, 14, done ? '#0f7a45' : '#ffd37a');
  if (done) {
    rect(ctx, X + 2, Y + 7, 2, 2, '#ffffff');
    rect(ctx, X + 4, Y + 9, 2, 2, '#ffffff');
    rect(ctx, X + 6, Y + 7, 2, 2, '#ffffff');
    rect(ctx, X + 8, Y + 5, 2, 2, '#ffffff');
    rect(ctx, X + 10, Y + 3, 2, 2, '#ffffff');
  } else {
    rect(ctx, X + 6, Y + 2, 2, 6, '#1a1a17');
    rect(ctx, X + 6, Y + 10, 2, 2, '#1a1a17');
  }
}
