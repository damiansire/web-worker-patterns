import { EXAMPLES } from '../examples/examples.registry';
import { findMission, MISSIONS, REGIONS } from './missions';
import {
  completePath,
  doneCount,
  EMPTY_PROGRESS,
  isMissionDone,
  isRegionDone,
  isRegionOpen,
  missionsOf,
  parse,
  Progress,
  serialize,
} from './progress';
import { VOCABULARY } from './vocabulary';

const walk = (steps: [string, string][], from: Progress = EMPTY_PROGRESS) =>
  steps.reduce((progress, [exampleId, pathId]) => completePath(progress, exampleId, pathId), from);

describe('misiones: la estructura del recorrido', () => {
  it('hay una misión por cada ejemplo del registry, y ninguna de más', () => {
    const missions = MISSIONS.map((mission) => mission.exampleId).sort();
    const examples = EXAMPLES.map((example) => example.id).sort();

    expect(missions).toEqual(examples);
  });

  it('toda misión tiene al menos un camino que aplica el patrón', () => {
    for (const mission of MISSIONS) {
      const patterns = mission.paths.filter((path) => path.kind === 'pattern');
      expect(patterns.length, mission.exampleId).toBeGreaterThan(0);
    }
  });

  it('los ids de camino no se repiten dentro de una misión', () => {
    for (const mission of MISSIONS) {
      const ids = mission.paths.map((path) => path.id);
      expect(new Set(ids).size, mission.exampleId).toBe(ids.length);
    }
  });

  it('ninguna palabra del vocabulario queda huérfana: alguna misión la enseña', () => {
    const taught = new Set(MISSIONS.flatMap((m) => m.paths.flatMap((path) => path.teaches)));
    const orphans = VOCABULARY.map((term) => term.id).filter((id) => !taught.has(id));

    expect(orphans).toEqual([]);
  });

  it('cada región tiene misiones y entre todas cubren las 16', () => {
    const perRegion = REGIONS.map((region) => missionsOf(region).length);

    expect(perRegion.every((count) => count > 0)).toBe(true);
    expect(perRegion.reduce((a, b) => a + b, 0)).toBe(MISSIONS.length);
  });
});

describe('progreso', () => {
  it('recorrer un camino suma sus términos al vocabulario', () => {
    const progress = walk([['01-setinterval-counter', 'worker']]);

    expect(progress.learned).toEqual(['new-worker']);
  });

  it('el camino que duele también enseña, pero no cumple la misión', () => {
    const mission = findMission('01-setinterval-counter')!;
    const progress = walk([['01-setinterval-counter', 'main']]);

    expect(progress.learned).toEqual(['main-thread']);
    expect(isMissionDone(progress, mission)).toBe(false);
  });

  it('la misión se cumple al recorrer el camino que aplica el patrón', () => {
    const mission = findMission('01-setinterval-counter')!;

    expect(isMissionDone(walk([['01-setinterval-counter', 'worker']]), mission)).toBe(true);
  });

  it('repetir un camino no duplica nada', () => {
    const once = walk([['04-offloading-computation', 'worker']]);
    const twice = walk([['04-offloading-computation', 'worker']], once);

    expect(twice).toEqual(once);
  });

  it('un camino o una misión que no existen no cambian el progreso', () => {
    expect(walk([['04-offloading-computation', 'no-existe']])).toBe(EMPTY_PROGRESS);
    expect(walk([['99-no-existe', 'worker']])).toBe(EMPTY_PROGRESS);
  });

  it('no muta el progreso anterior', () => {
    const before = walk([['01-setinterval-counter', 'main']]);
    const snapshot = JSON.stringify(before);

    walk([['01-setinterval-counter', 'worker']], before);

    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('regiones: se abren en orden', () => {
  const firstRegionDone = walk([
    ['01-setinterval-counter', 'worker'],
    ['02-main-thread', 'block'],
    ['16-compositor-vs-main', 'worker'],
  ]);

  it('la primera región está abierta desde el arranque y las demás no', () => {
    expect(isRegionOpen(EMPTY_PROGRESS, 'understanding')).toBe(true);
    expect(isRegionOpen(EMPTY_PROGRESS, 'communication')).toBe(false);
  });

  it('cumplir todas las misiones de una región abre la siguiente, no la de más allá', () => {
    expect(isRegionDone(firstRegionDone, 'understanding')).toBe(true);
    expect(isRegionOpen(firstRegionDone, 'communication')).toBe(true);
    expect(isRegionOpen(firstRegionDone, 'optimization')).toBe(false);
    expect(doneCount(firstRegionDone)).toBe(3);
  });

  it('con una misión pendiente la región no está cumplida', () => {
    const almost = walk([
      ['01-setinterval-counter', 'worker'],
      ['02-main-thread', 'block'],
    ]);

    expect(isRegionDone(almost, 'understanding')).toBe(false);
  });
});

describe('guardado', () => {
  it('lo que se guarda se vuelve a leer igual', () => {
    const progress = walk([
      ['01-setinterval-counter', 'main'],
      ['01-setinterval-counter', 'worker'],
      ['03-basic-communication', 'message'],
    ]);

    expect(parse(serialize(progress))).toEqual(progress);
  });

  it.each([
    ['nada guardado', null],
    ['texto que no es JSON', '{roto'],
    ['JSON que no es un objeto', '[1,2]'],
    ['una versión que no se conoce', '{"version":99,"learned":["new-worker"],"paths":{}}'],
  ])('%s arranca de cero, sin tirar', (_, raw) => {
    expect(parse(raw)).toEqual(EMPTY_PROGRESS);
  });

  it('descarta lo que no reconoce y conserva el resto', () => {
    const raw = JSON.stringify({
      version: 1,
      learned: ['new-worker', 'termino-retirado', 42],
      paths: {
        '01-setinterval-counter': ['worker', 'camino-viejo', 'worker'],
        '99-ejemplo-borrado': ['worker'],
        '04-offloading-computation': 'no-es-una-lista',
      },
    });

    expect(parse(raw)).toEqual({
      learned: ['new-worker'],
      paths: { '01-setinterval-counter': ['worker'] },
    });
  });
});
