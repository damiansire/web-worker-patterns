import { CHAPTERS, LEVELS } from './story.levels';
import {
  chapterRoads,
  landmarks,
  MAP_SPECS,
  MapShape,
  mapSpots,
  roadPath,
  scatter,
  segments,
  wrapWords,
} from './story.map';

const SHAPES: MapShape[] = ['wide', 'tall'];
const inside = (p: { x: number; y: number }, w: number, h: number) =>
  p.x > 0 && p.x < w && p.y > 0 && p.y < h;

describe('story map', () => {
  for (const shape of SHAPES) {
    const spec = MAP_SPECS[shape];
    const spots = mapSpots(spec);

    describe(shape, () => {
      it('pone un nivel por lugar, todos dentro del dibujo y bajo el horizonte', () => {
        expect(spots.length).toBe(LEVELS.length);
        for (const p of spots) {
          expect(inside(p, spec.view.w, spec.view.h)).toBe(true);
          expect(p.y).toBeGreaterThan(spec.horizon);
        }
      });

      it('el camino va y vuelve en serpentina, sin saltos', () => {
        spots.slice(1).forEach((b, i) => {
          const a = spots[i];
          if (a.row === b.row) expect(Math.abs(b.x - a.x)).toBe(spec.colStep);
          else expect(b.x).toBe(a.x);
        });
      });

      it('el camino tiene un tramo por par de niveles y termina donde se le pide', () => {
        expect(segments(spots, spec).length).toBe(spots.length - 1);
        const last = spots[spots.length - 1];
        expect(roadPath(spots, spec).endsWith(`${last.x} ${last.y}`)).toBe(true);
        expect(roadPath(spots, spec, 0)).toBe(`M${spots[0].x} ${spots[0].y}`);
      });

      it('cada capítulo pinta su tramo, sin los pasos de un capítulo al otro', () => {
        const roads = chapterRoads(spots, spec);
        const inner = LEVELS.slice(1).filter((l, i) => l.chapter === LEVELS[i].chapter).length;
        const count = roads.reduce((n, r) => n + r.d.split('M').length - 1, 0);
        expect(count).toBe(inner);
        expect(count).toBeLessThan(segments(spots, spec).length);
        // Todos los capítulos tienen más de un nivel: cada uno pinta su tramo.
        expect(roads.map((r) => r.chapter)).toEqual(CHAPTERS.map((c) => c.key));
        const first = LEVELS.findIndex((l) => l.chapter === 'understanding');
        const own = roads.find((r) => r.chapter === 'understanding')!;
        expect(own.d.startsWith(`M${spots[first].x} ${spots[first].y}`)).toBe(true);
      });

      it('cada capítulo tiene su hito dentro del dibujo', () => {
        const marks = landmarks(spots, spec);
        expect(marks.map((m) => m.chapter)).toEqual(CHAPTERS.map((c) => c.key));
        for (const m of marks) expect(inside(m, spec.view.w, spec.view.h)).toBe(true);
      });

      it('los nombres entran en dos renglones', () => {
        for (const l of LEVELS) {
          const lines = wrapWords(l.title, spec.chars);
          expect(lines.length).toBeLessThanOrEqual(2);
        }
      });

      it('los árboles salen siempre iguales y lejos de los niveles', () => {
        const clear = { node: 140 * spec.s, road: 50 * spec.s, landmark: 100 * spec.s };
        const a = scatter(spec, spots, 30, 7, clear);
        expect(scatter(spec, spots, 30, 7, clear)).toEqual(a);
        expect(a.length).toBe(30);
        for (const t of a) {
          for (const p of spots)
            expect(Math.hypot(t.x - p.x, t.y - p.y)).toBeGreaterThan(clear.node);
        }
      });
    });
  }

  it('wrapWords no corta palabras', () => {
    expect(wrapWords('Lo que cuesta copiar', 13)).toEqual(['Lo que cuesta', 'copiar']);
    expect(wrapWords('Plan B', 13)).toEqual(['Plan B']);
  });

  it('wrapWords empareja los dos renglones: ninguna palabra queda sola abajo', () => {
    expect(wrapWords('Pintar desde otro hilo', 20)).toEqual(['Pintar desde', 'otro hilo']);
    expect(wrapWords('Pintar desde otro hilo', 22)).toEqual(['Pintar desde otro hilo']);
  });
});
