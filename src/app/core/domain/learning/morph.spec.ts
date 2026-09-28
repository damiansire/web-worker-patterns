import { morph, unknownTerms, wordCount } from './morph';
import { TermId } from './vocabulary';

const learned = (...ids: TermId[]) => new Set<TermId>(ids);
const read = (text: string, ids: TermId[] = []) =>
  morph(text, learned(...ids))
    .map((segment) => segment.value)
    .join('');

describe('morph: el texto cambia de idioma por palabra aprendida', () => {
  it('antes de aprender el término muestra el nombre llano', () => {
    expect(read('Llamá a {un ayudante|new-worker}.')).toBe('Llamá a un ayudante.');
  });

  it('después de aprenderlo muestra el nombre de la API, marcado como término', () => {
    const segments = morph('Llamá a {un ayudante|new-worker}.', learned('new-worker'));

    expect(segments).toEqual([
      { kind: 'text', value: 'Llamá a ' },
      { kind: 'term', termId: 'new-worker', value: 'new Worker()' },
      { kind: 'text', value: '.' },
    ]);
  });

  it('cada término cambia por separado', () => {
    const text = '{Un ayudante|new-worker} recibe {un mensaje|post-message}.';

    expect(read(text, ['post-message'])).toBe('Un ayudante recibe postMessage().');
  });

  it('una marca puede fijar cómo se lee ya aprendida (plurales)', () => {
    const text = 'Tengo 4 {ayudantes|worker|workers}.';

    expect(read(text)).toBe('Tengo 4 ayudantes.');
    expect(read(text, ['worker'])).toBe('Tengo 4 workers.');
    expect(wordCount(text)).toBe(3);
  });

  it('un texto sin marcas queda igual', () => {
    expect(morph('Acá atiendo todo yo.', learned())).toEqual([
      { kind: 'text', value: 'Acá atiendo todo yo.' },
    ]);
  });

  it('un término que no existe nunca cambia (y se puede detectar)', () => {
    expect(read('Usá {la cosa|no-existe}.')).toBe('Usá la cosa.');
    expect(unknownTerms('Usá {la cosa|no-existe} y {un ayudante|new-worker}.')).toEqual([
      'no-existe',
    ]);
  });
});

describe('wordCount: presupuesto de palabras en pantalla', () => {
  it('cuenta las palabras de un texto llano', () => {
    expect(wordCount('Acá atiendo todo yo. Solo.')).toBe(5);
  });

  it('toma el peor caso entre el nombre llano y el de la API', () => {
    // llano: "Soy el hilo principal de la casa" = 7; API: "Soy API de la casa" = 5
    expect(wordCount('Soy {el hilo principal|main-thread} de la casa')).toBe(7);
  });

  it('el nombre de una API cuenta como una sola palabra', () => {
    // llano: "Usá eso" = 2; API: "Usá API" = 2
    expect(wordCount('Usá {eso|structured-clone}')).toBe(2);
  });
});
