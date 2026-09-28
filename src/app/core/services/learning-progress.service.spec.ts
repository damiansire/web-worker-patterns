import { TestBed } from '@angular/core/testing';
import { LearningProgressService } from './learning-progress.service';

const fresh = () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(LearningProgressService);
};

describe('LearningProgressService', () => {
  it('arranca sin nada aprendido', () => {
    const progress = fresh();

    expect(progress.learned().size).toBe(0);
    expect(progress.doneCount()).toBe(0);
    expect(progress.total).toBe(16);
  });

  it('recorrer un camino devuelve solo las palabras que son nuevas', () => {
    const progress = fresh();

    expect(progress.completePath('01-setinterval-counter', 'worker')).toEqual(['new-worker']);
    expect(progress.completePath('01-setinterval-counter', 'worker')).toEqual([]);
    expect(progress.isMissionDone('01-setinterval-counter')).toBe(true);
    expect(progress.doneCount()).toBe(1);
  });

  it('el texto cambia de idioma apenas se aprende la palabra', () => {
    const progress = fresh();
    const text = 'Llamá a {un ayudante|new-worker}.';
    const read = () =>
      progress
        .morph(text)
        .map((segment) => segment.value)
        .join('');

    expect(read()).toBe('Llamá a un ayudante.');
    progress.completePath('01-setinterval-counter', 'worker');
    expect(read()).toBe('Llamá a new Worker().');
  });

  it('el progreso sobrevive a recargar la página', () => {
    fresh().completePath('03-basic-communication', 'message');
    // `fresh()` arma un servicio nuevo, como después de un reload, sobre el mismo storage.
    const stored = localStorage.getItem('wwp-progress');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    localStorage.setItem('wwp-progress', stored ?? '');

    const reloaded = TestBed.inject(LearningProgressService);

    expect(reloaded.learned().has('post-message')).toBe(true);
    expect(reloaded.isPathDone('03-basic-communication', 'message')).toBe(true);
  });

  it('un guardado roto no impide arrancar', () => {
    localStorage.setItem('wwp-progress', '{esto no es json');

    expect(fresh().doneCount()).toBe(0);
  });

  it('reset olvida todo, también lo guardado', () => {
    const progress = fresh();
    progress.completePath('01-setinterval-counter', 'worker');

    progress.reset();

    expect(progress.learned().size).toBe(0);
    expect(fresh().doneCount()).toBe(0);
  });
});
