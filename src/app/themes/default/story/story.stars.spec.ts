import { SCRIPTS } from './story.scripts';
import { countStars, GOALS, nextStar, STAR_IDS, StarFacts, starsOf } from './story.stars';

const facts = (over: Partial<StarFacts> & { walkedIds?: string[] } = {}): StarFacts => ({
  solved: false,
  walked: (id) => (over.walkedIds ?? []).includes(id),
  challenge: false,
  ...over,
});

describe('story stars', () => {
  it('los caminos de cada nivel son los de su guion (no se desfasan)', () => {
    expect(Object.keys(GOALS).sort()).toEqual(Object.keys(SCRIPTS).sort());
    for (const [scene, goals] of Object.entries(GOALS)) {
      const script = SCRIPTS[scene as keyof typeof SCRIPTS];
      expect([...goals.paths].sort()).toEqual(script.paths.map((p) => p.id).sort());
    }
  });

  it('cada nivel tiene un reto corto, que entra en un renglón', () => {
    for (const goals of Object.values(GOALS)) {
      expect(goals.challenge.length).toBeGreaterThan(10);
      expect(goals.challenge.length).toBeLessThanOrEqual(48);
    }
  });

  it('sin jugar no hay estrellas y la primera pista es superar el nivel', () => {
    const stars = starsOf(GOALS.prologue, facts());
    expect(stars.map((s) => s.id)).toEqual(STAR_IDS);
    expect(countStars(stars)).toBe(0);
    expect(nextStar(stars)?.id).toBe('solved');
  });

  it('superar el nivel da una; el otro camino, la segunda; el reto, la tercera', () => {
    const solved = starsOf(GOALS.prologue, facts({ solved: true, walkedIds: ['worker'] }));
    expect(countStars(solved)).toBe(1);
    expect(nextStar(solved)?.id).toBe('explored');

    const both = starsOf(GOALS.prologue, facts({ solved: true, walkedIds: ['worker', 'main'] }));
    expect(countStars(both)).toBe(2);
    expect(nextStar(both)).toMatchObject({ id: 'challenge', text: GOALS.prologue.challenge });

    const all = starsOf(
      GOALS.prologue,
      facts({ solved: true, walkedIds: ['worker', 'main'], challenge: true }),
    );
    expect(countStars(all)).toBe(3);
    expect(nextStar(all)).toBeNull();
  });

  it('el camino que duele solo no supera el nivel ni cuenta como explorado', () => {
    const stars = starsOf(GOALS.counter, facts({ walkedIds: ['main'] }));
    expect(countStars(stars)).toBe(0);
  });

  it('en un nivel de un solo camino, superarlo ya es haberlo visto todo', () => {
    const stars = starsOf(GOALS.queue, facts({ solved: true, walkedIds: ['block'] }));
    expect(countStars(stars)).toBe(2);
    expect(nextStar(stars)?.id).toBe('challenge');
  });
});
