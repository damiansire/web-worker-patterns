import { Category } from '../../../core/domain/examples/example.model';
import { Actor, Grid, Point } from './world.logic';

/**
 * Las cinco regiones del mundo, una por capítulo. Cada mapa es una grilla de
 * 16x10 que entra entera en pantalla (sin cámara ni scroll). Todas comparten la
 * calle principal en la fila 5: se entra por la izquierda (`<`) y se sale por la
 * derecha (`>`).
 *
 * Leyenda: `#` árbol · `.` pasto · `=` camino · `~` agua · `R` techo · `H` pared
 *          `^` muralla · `w` muelle · `_` puente · `<` `>` salidas
 */
export interface Look {
  skin: string;
  shirt: string;
  hair: string;
}

export interface Neighbor extends Actor {
  /** Id del ejemplo cuya misión da este vecino. */
  id: string;
  look: Look;
}

export interface Region {
  id: Category;
  rows: readonly string[];
  neighbors: readonly Neighbor[];
  /** Dónde aparece el jugador al empezar el juego en esta región o al entrar por la izquierda. */
  entry: Point;
  /** Dónde aparece al volver desde la región siguiente. */
  back: Point;
  /** Color del pasto: cada región tiene su clima. */
  ground: string;
}

export const GUARD_ID = 'guard';
export const GUARD_LOOK: Look = { skin: '#f0c9a0', shirt: '#7a3b1e', hair: '#1a1a17' };
export const PLAYER_LOOK: Look = { skin: '#f0c9a0', shirt: '#e0a23a', hair: '#7a3b1e' };

/** El guardia tapa la salida hasta que la región queda cumplida; después se corre. */
export const GUARD_BLOCKING: Point = { x: 14, y: 5 };
export const GUARD_ASIDE: Point = { x: 14, y: 4 };

const look = (skin: string, shirt: string, hair: string): Look => ({ skin, shirt, hair });

export const WORLD: readonly Region[] = [
  {
    id: 'understanding',
    ground: '#4f9d55',
    entry: { x: 8, y: 8 },
    back: { x: 13, y: 5 },
    rows: [
      '################',
      '#..RRR....RRR..#',
      '#..HHH....HHH..#',
      '#...=......=...#',
      '#...=......=...#',
      '#...===========>',
      '#.......=......#',
      '#..~~...=......#',
      '#..~~...=......#',
      '################',
    ],
    neighbors: [
      { id: '02-main-thread', x: 4, y: 3, look: look('#ffd37a', '#1e7a4c', '#3b2a1a') },
      { id: '01-setinterval-counter', x: 11, y: 3, look: look('#f0c9a0', '#b5482f', '#c9c2b0') },
      { id: '16-compositor-vs-main', x: 5, y: 7, look: look('#d9a877', '#3d7fc4', '#1a1a17') },
    ],
  },
  {
    id: 'communication',
    ground: '#5aa36a',
    entry: { x: 1, y: 5 },
    back: { x: 13, y: 5 },
    rows: [
      '################',
      '#..RRR....RRR..#',
      '#..HHH....HHH..#',
      '#...=......=...#',
      '#...=......=...#',
      '<==============>',
      '#......=.......#',
      '#~~~~~~w~~~~~~~#',
      '#~~~~~~w~~~~~~~#',
      '################',
    ],
    neighbors: [
      { id: '03-basic-communication', x: 4, y: 3, look: look('#f0c9a0', '#3a34b0', '#7a3b1e') },
      { id: '08-shared-worker', x: 11, y: 3, look: look('#d9a877', '#e0a23a', '#c9c2b0') },
    ],
  },
  {
    id: 'optimization',
    ground: '#6aa84f',
    entry: { x: 1, y: 5 },
    back: { x: 13, y: 5 },
    rows: [
      '################',
      '#.RRR..RRR..RRR#',
      '#.HHH..HHH..HHH#',
      '#..=....=....=.#',
      '#..=....=....=.#',
      '<==============>',
      '#....=.....=...#',
      '#...RRR...RRR..#',
      '#...HHH...HHH..#',
      '################',
    ],
    neighbors: [
      { id: '04-offloading-computation', x: 3, y: 3, look: look('#f0c9a0', '#8a5a33', '#c9c2b0') },
      { id: '07-transferable-objects', x: 8, y: 3, look: look('#d9a877', '#b5482f', '#1a1a17') },
      { id: '10-worker-pool', x: 13, y: 3, look: look('#ffd37a', '#5b54d6', '#3b2a1a') },
      { id: '14-offscreen-canvas', x: 5, y: 6, look: look('#f0c9a0', '#c0398a', '#7a3b1e') },
      { id: '15-clone-cost', x: 11, y: 6, look: look('#d9a877', '#1e7a4c', '#1a1a17') },
    ],
  },
  {
    id: 'management',
    ground: '#7a9a5a',
    entry: { x: 1, y: 5 },
    back: { x: 13, y: 5 },
    rows: [
      '################',
      '#^^^^^^^^^^^^^^#',
      '#^.RRR....RRR.^#',
      '#^.HHH....HHH.^#',
      '#...=......=...#',
      '<==============>',
      '#......=.......#',
      '#^.....=......^#',
      '#^^^^^^^^^^^^^^#',
      '################',
    ],
    neighbors: [
      { id: '05-error-handling', x: 4, y: 4, look: look('#f0c9a0', '#f4f0e8', '#1a1a17') },
      { id: '06-lifecycle-termination', x: 11, y: 4, look: look('#d9a877', '#2b3329', '#c9c2b0') },
      { id: '09-worker-limits', x: 7, y: 7, look: look('#ffd37a', '#b5482f', '#7a3b1e') },
    ],
  },
  {
    id: 'advanced',
    ground: '#5f8f6b',
    entry: { x: 1, y: 5 },
    back: { x: 13, y: 5 },
    rows: [
      '################',
      '#..RRR...~~....#',
      '#..HHH...~~.RRR#',
      '#...=....~~.HHH#',
      '#...=....~~..=.#',
      '<========__====#',
      '#......=.~~....#',
      '#......=.~~....#',
      '#........~~....#',
      '################',
    ],
    neighbors: [
      { id: '12-shared-array-buffer', x: 4, y: 3, look: look('#f0c9a0', '#5b54d6', '#c9c2b0') },
      { id: '11-backpressure-scheduling', x: 7, y: 7, look: look('#d9a877', '#3d7fc4', '#3b2a1a') },
      { id: '13-graceful-degradation', x: 13, y: 4, look: look('#ffd37a', '#1e7a4c', '#1a1a17') },
    ],
  },
];

export function findRegion(id: Category): Region {
  return WORLD.find((region) => region.id === id) ?? WORLD[0];
}

export function regionOfExample(exampleId: string): Region | undefined {
  return WORLD.find((region) => region.neighbors.some((neighbor) => neighbor.id === exampleId));
}

/** La región siguiente, o `undefined` en la última. */
export function nextRegion(region: Region): Region | undefined {
  return WORLD[WORLD.indexOf(region) + 1];
}

export function previousRegion(region: Region): Region | undefined {
  return WORLD[WORLD.indexOf(region) - 1];
}

/**
 * La grilla de una región tal como está ahora: los vecinos, y el guardia parado en
 * la salida o corrido a un costado según la región esté cumplida.
 */
export function gridOf(region: Region, regionDone: boolean): Grid {
  const actors: Actor[] = [...region.neighbors];
  if (nextRegion(region)) {
    actors.push({ id: GUARD_ID, ...(regionDone ? GUARD_ASIDE : GUARD_BLOCKING) });
  }
  return { rows: region.rows, actors };
}
