import { WorkerExample } from '../core/domain/examples/example.model';
import { EXAMPLES } from '../core/domain/examples/examples.registry';
import { patternCatalog, patternDetail, PATTERN_CATEGORIES } from './worker-patterns.catalog';

const ex = (id: string, order: number, category: WorkerExample['category']): WorkerExample => ({
  id,
  order,
  category,
  i18nKey: `examples.${id}`,
  snippets: { 'main.ts': `// ${id}` },
});

const EXS = [ex('b', 2, 'advanced'), ex('a', 1, 'understanding')];

describe('worker-patterns catalog (lo que ve un agente vía WebMCP)', () => {
  it('ordena por número de ejemplo y usa el título i18n', () => {
    const list = patternCatalog(EXS, { a: { title: 'Alfa', summary: 'resumen a' } });
    expect(list.map((p) => p.id)).toEqual(['a', 'b']);
    expect(list[0]).toEqual({
      id: 'a',
      order: 1,
      category: 'understanding',
      title: 'Alfa',
      summary: 'resumen a',
    });
  });

  it('sin contenido i18n cae al id como título y summary null', () => {
    const [b] = patternCatalog(EXS, {}, 'advanced');
    expect(b.title).toBe('b');
    expect(b.summary).toBeNull();
  });

  it('filtra por categoría', () => {
    expect(patternCatalog(EXS, {}, 'advanced').map((p) => p.id)).toEqual(['b']);
  });

  it('el detalle trae takeaways y snippets; id desconocido da null', () => {
    const detail = patternDetail(
      EXS,
      { a: { title: 'Alfa', takeaways: { title: 't', items: ['uno'] }, whatToWatch: 'mirá' } },
      'a',
    );
    expect(detail?.takeaways).toEqual(['uno']);
    expect(detail?.whatToWatch).toBe('mirá');
    expect(detail?.snippets).toEqual([{ label: 'main.ts', code: '// a' }]);
    expect(patternDetail(EXS, {}, 'nope')).toBeNull();
  });

  it('las categorías del enum cubren todas las que usa el registry real', () => {
    const used = new Set(EXAMPLES.map((e) => e.category));
    for (const cat of used) {
      expect(PATTERN_CATEGORIES).toContain(cat);
    }
  });
});
