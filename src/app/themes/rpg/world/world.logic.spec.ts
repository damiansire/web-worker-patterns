import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import { REGIONS } from '../../../core/domain/learning/missions';
import { missionsOf } from '../../../core/domain/learning/progress';
import { GUARD_ID, gridOf, WORLD } from './regions';
import {
  approach,
  badgeSpot,
  cameraFocus,
  facingActor,
  findPath,
  Grid,
  isWalkable,
  tileAt,
} from './world.logic';

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

  it('la cámara mira al centro de la casilla del jugador', () => {
    const size = { columns: 16, rows: 10 };

    expect(cameraFocus({ x: 0, y: 0 }, size)).toEqual({ x: 0.03125, y: 0.05 });
    expect(cameraFocus({ x: 15, y: 9 }, size)).toEqual({ x: 0.96875, y: 0.95 });
    // A mitad de un paso acompaña el movimiento.
    expect(cameraFocus({ x: 7.5, y: 5 }, size)).toEqual({ x: 0.5, y: 0.55 });
    // Nunca mira fuera del mapa.
    expect(cameraFocus({ x: 40, y: -3 }, size)).toEqual({ x: 1, y: 0 });
  });

  it('el cartel de un vecino nunca tapa a quien tiene al lado', () => {
    const neighbor = { x: 3, y: 3 };
    const above = { x: 3, y: 2 };
    const right = { x: 4, y: 3 };
    const left = { x: 2, y: 3 };

    expect(badgeSpot(neighbor, [neighbor])).toBe('above');
    expect(badgeSpot(neighbor, [neighbor, right])).toBe('above');
    expect(badgeSpot(neighbor, [neighbor, above])).toBe('right');
    // Arriba el jugador y a la derecha el ayudante: el cartel se va a la izquierda.
    expect(badgeSpot(neighbor, [neighbor, above, right])).toBe('left');
    expect(badgeSpot(neighbor, [neighbor, above, right, left])).toBe('right');
    // Alguien que viene caminando cuenta por la casilla a la que está llegando.
    expect(badgeSpot(neighbor, [neighbor, { x: 3, y: 2.4 }])).toBe('right');
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
    '%s: desde la entrada se llega a hablar con todos, maestra incluida',
    (_, region) => {
      const map = gridOf(region, false);
      for (const actor of map.actors) {
        expect(approach(map, region.entry, actor), `${region.id} → ${actor.id}`).not.toBeNull();
      }
    },
  );

  it.each(WORLD.slice(0, -1).map((region) => [region.id, region] as const))(
    '%s: la maestra tapa la salida hasta dar su sello',
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

  it('la última región no tiene salida, pero sí maestra', () => {
    const last = WORLD.at(-1)!;

    expect(last.rows.join('')).not.toContain('>');
    for (const stamped of [false, true]) {
      const map = gridOf(last, stamped);
      const master = map.actors.find((actor) => actor.id === GUARD_ID);
      expect(master && approach(map, last.entry, master), String(stamped)).toBeTruthy();
    }
  });
});
