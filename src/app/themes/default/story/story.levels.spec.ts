import { EXAMPLES } from '../../../core/domain/examples/examples.registry';
import {
  currentLevel,
  LEVELS,
  levelState,
  nextLevel,
  PROLOGUE_ID,
  serpentine,
} from './story.levels';

describe('story levels', () => {
  it('arranca en el prólogo y tiene un nivel por ejemplo del registry', () => {
    expect(LEVELS[0].id).toBe(PROLOGUE_ID);
    expect(LEVELS.length).toBe(EXAMPLES.length + 1);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    LEVELS.forEach((l, i) => expect(l.n).toBe(i));
  });

  it('el capítulo 1 se juega con escena, en orden de capítulo', () => {
    const ch1 = LEVELS.filter((l) => l.chapter === 'understanding').map((l) => l.id);
    expect(ch1).toEqual(['01-setinterval-counter', '02-main-thread', '16-compositor-vs-main']);
    expect(LEVELS.filter((l) => l.chapter === 'understanding').every((l) => l.scene)).toBe(true);
  });

  it('cada nivel con escena se destraba al superar el anterior', () => {
    const done = new Set<string>();
    const isDone = (id: string) => done.has(id);
    const byId = (id: string) => LEVELS.find((l) => l.id === id)!;
    expect(levelState(byId(PROLOGUE_ID), isDone)).toBe('open');
    expect(levelState(byId('01-setinterval-counter'), isDone)).toBe('locked');
    done.add(PROLOGUE_ID);
    expect(levelState(byId(PROLOGUE_ID), isDone)).toBe('done');
    expect(levelState(byId('01-setinterval-counter'), isDone)).toBe('open');
    expect(levelState(byId('02-main-thread'), isDone)).toBe('locked');
  });

  it('los niveles sin escena están en obra y se pueden abrir siempre', () => {
    const wip = LEVELS.find((l) => !l.scene)!;
    expect(levelState(wip, () => false)).toBe('wip');
  });

  it('main se para en el primer nivel jugable sin superar', () => {
    expect(currentLevel(() => false).id).toBe(PROLOGUE_ID);
    expect(currentLevel((id) => id === PROLOGUE_ID).id).toBe('01-setinterval-counter');
    expect(currentLevel(() => true).id).toBe('16-compositor-vs-main');
  });

  it('el siguiente del último no existe', () => {
    expect(nextLevel(PROLOGUE_ID)?.id).toBe('01-setinterval-counter');
    expect(nextLevel(LEVELS[LEVELS.length - 1].id)).toBeNull();
  });

  it('la serpentina va y vuelve sin saltos', () => {
    const p = serpentine(7, 3, { w: 100, h: 50 }, { x: 0, y: 0 });
    expect(p.map((q) => q.x)).toEqual([0, 100, 200, 200, 100, 0, 0]);
    expect(p.map((q) => q.y)).toEqual([0, 0, 0, 50, 50, 50, 100]);
  });
});
