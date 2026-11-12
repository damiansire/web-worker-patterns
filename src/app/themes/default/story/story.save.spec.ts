import {
  EMPTY_SAVE,
  hasPath,
  isEmpty,
  parseSave,
  SaveShape,
  serializeSave,
  withChallenge,
  withPath,
} from './story.save';

const SHAPE: SaveShape = {
  paths: { prologo: ['main', 'worker'], 'conoce-a-main': ['seen'] },
  challenges: ['prologo', '01-setinterval-counter'],
};

describe('story save', () => {
  it('registra caminos y retos sin tocar el valor anterior ni repetir', () => {
    const one = withPath(EMPTY_SAVE, 'prologo', 'main');
    expect(EMPTY_SAVE.paths).toEqual({});
    expect(hasPath(one, 'prologo', 'main')).toBe(true);
    expect(hasPath(one, 'prologo', 'worker')).toBe(false);
    expect(withPath(one, 'prologo', 'main')).toBe(one);

    const two = withChallenge(one, 'prologo');
    expect(two.challenges).toEqual(['prologo']);
    expect(withChallenge(two, 'prologo')).toBe(two);
    expect(isEmpty(EMPTY_SAVE)).toBe(true);
    expect(isEmpty(two)).toBe(false);
  });

  it('lo guardado se lee igual', () => {
    const save = withChallenge(
      withPath(withPath(EMPTY_SAVE, 'prologo', 'worker'), 'conoce-a-main', 'seen'),
      '01-setinterval-counter',
    );
    expect(parseSave(serializeSave(save), SHAPE)).toEqual(save);
  });

  it('un guardado roto, viejo o vacío arranca de cero sin tirar', () => {
    for (const raw of [null, '', '{', '[]', '"x"', '{"version":0,"paths":{}}', 'null']) {
      expect(parseSave(raw, SHAPE)).toEqual(EMPTY_SAVE);
    }
  });

  it('descarta lo que no reconoce y conserva el resto', () => {
    const raw = JSON.stringify({
      version: 1,
      paths: {
        prologo: ['worker', 'atajo', 'worker'],
        'nivel-que-no-existe': ['main'],
        'conoce-a-main': 'seen',
      },
      challenges: ['prologo', 'otro', 7],
    });
    expect(parseSave(raw, SHAPE)).toEqual({
      paths: { prologo: ['worker'] },
      challenges: ['prologo'],
    });
  });
});
