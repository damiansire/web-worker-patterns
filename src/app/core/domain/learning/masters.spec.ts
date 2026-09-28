import { REGIONS } from './missions';
import { findMaster, MASTERS, optionsOf, teacherOf, termsSeenBy } from './masters';
import { VOCABULARY } from './vocabulary';

describe('maestras: una por región, con tres situaciones', () => {
  it('hay una maestra por región, en el orden del recorrido', () => {
    expect(MASTERS.map((master) => master.region)).toEqual([...REGIONS]);
    for (const master of MASTERS) {
      expect(master.challenges, master.region).toHaveLength(3);
    }
  });

  it('solo pregunta por términos que el alumno ya pudo ver', () => {
    const unseen: string[] = [];
    for (const master of MASTERS) {
      const seen = termsSeenBy(master.region);
      for (const challenge of master.challenges) {
        for (const term of [challenge.answer, ...challenge.decoys]) {
          if (!seen.has(term)) unseen.push(`${master.region}/${challenge.id}: ${term}`);
        }
      }
    }

    expect(unseen).toEqual([]);
  });

  it('la respuesta es de la región: la maestra evalúa lo que se aprendió ahí', () => {
    for (const master of MASTERS) {
      const index = REGIONS.indexOf(master.region);
      const before = index > 0 ? termsSeenBy(REGIONS[index - 1]) : new Set();
      for (const challenge of master.challenges) {
        expect(before.has(challenge.answer), `${master.region}/${challenge.id}`).toBe(false);
      }
    }
  });

  it('las tres opciones de una situación son distintas', () => {
    for (const master of MASTERS) {
      for (const challenge of master.challenges) {
        expect(new Set(optionsOf(challenge)).size, challenge.id).toBe(3);
      }
    }
  });

  it('la respuesta correcta no cae siempre en el mismo lugar', () => {
    const positions = MASTERS.flatMap((master) =>
      master.challenges.map((challenge) => optionsOf(challenge).indexOf(challenge.answer)),
    );

    expect(new Set(positions).size).toBeGreaterThan(1);
  });

  it('el orden de las opciones es estable entre un intento y otro', () => {
    const challenge = findMaster('understanding')!.challenges[0];

    expect(optionsOf(challenge)).toEqual(optionsOf(challenge));
  });

  it('todo término tiene un vecino con quien repasarlo', () => {
    const orphans = VOCABULARY.filter((term) => !teacherOf(term.id)).map((term) => term.id);

    expect(orphans).toEqual([]);
    expect(teacherOf('new-worker')).toBe('01-setinterval-counter');
  });
});
