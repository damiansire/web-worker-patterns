import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { REGIONS } from '../../../core/domain/learning/missions';
import { missionsOf } from '../../../core/domain/learning/progress';
import { GUARD_ID, gridOf, WORLD } from './regions';
import { approach, facingActor, findPath, Grid, isWalkable, tileAt } from './world.logic';

const grid: Grid = {
  rows: ['#####', '#...#', '#.#.#', '#...#', '#####'],
  actors: [{ id: 'vecino', x: 3, y: 1 }],
};

describe('world.logic', () => {
  it('no se pisa una pared, un vecino ni lo que queda fuera del mapa', () => {
    expect(isWalkable(grid, 1, 1)).toBe(true);
    expect(isWalkable(grid, 2, 2)).toBe(false); // pared
    expect(isWalkable(grid, 3, 1)).toBe(false); // vecino
    expect(isWalkable(grid, 9, 9)).toBe(false); // afuera
  });

  it('sabe a quién tiene adelante el jugador', () => {
    expect(facingActor(grid, { x: 2, y: 1 }, 'right')?.id).toBe('vecino');
    expect(facingActor(grid, { x: 2, y: 1 }, 'left')).toBeUndefined();
  });

  it('encuentra el camino más corto rodeando las paredes', () => {
    const path = findPath(grid, { x: 1, y: 1 }, { x: 1, y: 3 });

    expect(path).toEqual([
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ]);
  });

  it('sin camino posible devuelve vacío', () => {
    const walled: Grid = { rows: ['#####', '#.#.#', '#####'], actors: [] };

    expect(findPath(walled, { x: 1, y: 1 }, { x: 3, y: 1 })).toEqual([]);
  });

  it('para hablar se acerca a la casilla vecina más cercana y mira al vecino', () => {
    const plan = approach(grid, { x: 1, y: 1 }, grid.actors[0]);

    expect(plan?.path.at(-1)).toEqual({ x: 2, y: 1 });
    expect(plan?.facing).toBe('right');
  });

  it('si ya está al lado no camina: solo se da vuelta', () => {
    const plan = approach(grid, { x: 2, y: 1 }, grid.actors[0]);

    expect(plan).toEqual({ path: [], facing: 'right' });
  });
});

describe('el mundo: ningún mapa deja a alguien inalcanzable', () => {
  it('hay una región por capítulo, en el mismo orden', () => {
    expect(WORLD.map((region) => region.id)).toEqual([...REGIONS]);
  });

  it('cada ejemplo tiene su vecino, en la región de su capítulo', () => {
    const placed = WORLD.flatMap((region) => region.neighbors.map((n) => n.id)).sort();

    expect(placed).toEqual(EXAMPLES.map((example) => example.id).sort());
    for (const region of WORLD) {
      const expected = missionsOf(region.id)
        .map((mission) => mission.exampleId)
        .sort();
      expect(region.neighbors.map((n) => n.id).sort(), region.id).toEqual(expected);
    }
  });

  it.each(WORLD.map((region) => [region.id, region] as const))(
    '%s: el mapa es de 16x10 y el jugador aparece en una casilla libre',
    (_, region) => {
      expect(region.rows).toHaveLength(10);
      expect(region.rows.every((row) => row.length === 16)).toBe(true);
      for (const done of [false, true]) {
        const map = gridOf(region, done);
        expect(isWalkable(map, region.entry.x, region.entry.y)).toBe(true);
        expect(isWalkable(map, region.back.x, region.back.y)).toBe(true);
      }
    },
  );

  it.each(WORLD.map((region) => [region.id, region] as const))(
    '%s: desde la entrada se llega a hablar con todos, guardia incluido',
    (_, region) => {
      const map = gridOf(region, false);
      for (const actor of map.actors) {
        expect(approach(map, region.entry, actor), `${region.id} → ${actor.id}`).not.toBeNull();
      }
    },
  );

  it.each(WORLD.slice(0, -1).map((region) => [region.id, region] as const))(
    '%s: el guardia tapa la salida hasta que la región se cumple',
    (_, region) => {
      const exit = { x: 15, y: 5 };
      expect(tileAt(gridOf(region, false), exit.x, exit.y)).toBe('>');

      const locked = gridOf(region, false);
      expect(locked.actors.some((actor) => actor.id === GUARD_ID)).toBe(true);
      expect(findPath(locked, region.entry, exit)).toEqual([]);

      const open = gridOf(region, true);
      expect(findPath(open, region.entry, exit).length).toBeGreaterThan(0);
    },
  );

  it('la última región no tiene salida ni guardia', () => {
    const last = WORLD.at(-1)!;

    expect(last.rows.join('')).not.toContain('>');
    expect(gridOf(last, false).actors.some((actor) => actor.id === GUARD_ID)).toBe(false);
  });
});
