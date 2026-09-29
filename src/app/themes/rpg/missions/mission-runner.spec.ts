import { MISSIONS } from '../../../core/domain/learning/missions';
import { LIVE, PREPARE, RUNNERS } from './mission-runner';

describe('mission-runner: cada camino tiene algo real que hacer', () => {
  it('hay un runner por cada camino de cada misión, y ninguno de más', () => {
    const promised = MISSIONS.flatMap((mission) =>
      mission.paths.map((path) => `${mission.exampleId}/${path.id}`),
    ).sort();
    const implemented = Object.entries(RUNNERS)
      .flatMap(([exampleId, paths]) => Object.keys(paths).map((id) => `${exampleId}/${id}`))
      .sort();

    expect(implemented).toEqual(promised);
  });

  it('los medidores en vivo apuntan a misiones que existen', () => {
    const known = new Set(MISSIONS.map((mission) => mission.exampleId));

    expect(Object.keys(LIVE).filter((id) => !known.has(id))).toEqual([]);
    expect(Object.keys(PREPARE).filter((id) => !known.has(id))).toEqual([]);
  });
});
