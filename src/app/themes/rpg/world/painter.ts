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
  if (scene.frozen) {
    ctx.fillStyle = 'rgba(229, 72, 77, 0.16)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
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

  rect(ctx, X, Y, TILE, TILE, region.ground);
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
        // Flecha de salida: tres escalones que apuntan hacia afuera.
        const dir = kind === '>' ? 1 : -1;
        for (let i = 0; i < 3; i++) {
          rect(ctx, X + 14 + dir * (i * 4 - 4), Y + 8 + i * 4, 4, 16 - i * 8 || 4, '#8a5a33');
        }
      }
      break;
    case '#':
      rect(ctx, X + 12, Y + 20, 8, 12, '#6b4a2b');
      rect(ctx, X + 4, Y + 4, 24, 20, '#2f6b3a');
      rect(ctx, X + 8, Y, 16, 8, '#2f6b3a');
      rect(ctx, X + 8, Y + 8, 6, 6, '#3d8449');
      break;
    case '~':
      rect(ctx, X, Y, TILE, TILE, '#3d7fc4');
      rect(ctx, X + 4 + (n % 12), Y + 8, 12, 3, '#7ab3e8');
      rect(ctx, X + 10, Y + 22, 10, 3, '#7ab3e8');
      break;
    case 'w':
    case '_':
      rect(ctx, X, Y, TILE, TILE, '#3d7fc4');
      rect(ctx, X + (kind === 'w' ? 4 : 0), Y, kind === 'w' ? 24 : TILE, TILE, '#a9763f');
      for (let i = 0; i < 4; i++) {
        rect(
          ctx,
          X + (kind === 'w' ? 4 : 0),
          Y + i * 8 + 6,
          kind === 'w' ? 24 : TILE,
          2,
          '#8a5a33',
        );
      }
      break;
    case '^':
      rect(ctx, X, Y, TILE, TILE, '#8d8a80');
      rect(ctx, X, Y + 14, TILE, 2, '#6f6c63');
      rect(ctx, X + 14, Y, 2, 14, '#6f6c63');
      rect(ctx, X + 6, Y + 16, 2, 16, '#6f6c63');
      rect(ctx, X + 22, Y + 16, 2, 16, '#6f6c63');
      break;
    case 'R':
      rect(ctx, X, Y, TILE, TILE, '#b5482f');
      rect(ctx, X, Y + 12, TILE, 4, '#963a25');
      rect(ctx, X, Y + 28, TILE, 4, '#963a25');
      break;
    case 'H': {
      rect(ctx, X, Y, TILE, TILE, '#f0e2c0');
      rect(ctx, X, Y + 28, TILE, 4, '#cdbd95');
      const isMiddle = region.rows[y][x - 1] === 'H' && region.rows[y][x + 1] === 'H';
      if (isMiddle) {
        rect(ctx, X + 8, Y + 6, 16, 26, '#6b4a2b');
        rect(ctx, X + 20, Y + 18, 2, 3, '#e0a23a');
      } else {
        rect(ctx, X + 8, Y + 8, 16, 12, '#7ab3e8');
        rect(ctx, X + 15, Y + 8, 2, 12, '#f0e2c0');
      }
      break;
    }
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
  } else {
    const shift = person.facing === 'left' ? -2 : person.facing === 'right' ? 2 : 0;
    if (frozen) {
      rect(ctx, X + 11 + shift, Y + 10, 4, 2, '#1a1a17');
      rect(ctx, X + 17 + shift, Y + 10, 4, 2, '#1a1a17');
    } else {
      rect(ctx, X + 12 + shift, Y + 9, 2, 3, '#1a1a17');
      rect(ctx, X + 18 + shift, Y + 9, 2, 3, '#1a1a17');
    }
  }

  if (person.badge) {
    const done = person.badge === 'done';
    rect(ctx, X + 10, Y - 14, 12, 12, done ? '#16a860' : '#ffd37a');
    if (done) {
      rect(ctx, X + 12, Y - 8, 2, 2, '#06210f');
      rect(ctx, X + 14, Y - 6, 2, 2, '#06210f');
      rect(ctx, X + 16, Y - 8, 2, 2, '#06210f');
      rect(ctx, X + 18, Y - 10, 2, 2, '#06210f');
    } else {
      rect(ctx, X + 15, Y - 12, 2, 5, '#1a1a17');
      rect(ctx, X + 15, Y - 5, 2, 2, '#1a1a17');
    }
  }
}
