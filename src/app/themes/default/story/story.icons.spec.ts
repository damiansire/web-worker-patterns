import { LEVEL_ICONS } from './story.icons';
import { LEVELS } from './story.levels';

describe('story icons', () => {
  it('cada nivel tiene su propio ícono', () => {
    for (const l of LEVELS) expect(LEVEL_ICONS[l.id], l.id).toBeDefined();
    const drawings = LEVELS.map((l) => JSON.stringify(LEVEL_ICONS[l.id]));
    expect(new Set(drawings).size).toBe(LEVELS.length);
  });

  it('no sobran íconos de niveles que ya no existen', () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    for (const id of Object.keys(LEVEL_ICONS)) expect(ids.has(id), id).toBe(true);
  });
});
