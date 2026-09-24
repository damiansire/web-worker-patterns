import { ExampleContent } from '../core/domain/examples/example-content.model';
import { Category, WorkerExample } from '../core/domain/examples/example.model';

/** Categorías que un agente puede usar para filtrar el catálogo. */
export const PATTERN_CATEGORIES = [
  'understanding',
  'communication',
  'management',
  'optimization',
  'advanced',
] as const satisfies readonly Category[];

/** Una fila del catálogo de patrones, tal como la ve un agente de IA. */
export interface PatternSummary {
  id: string;
  order: number;
  category: Category;
  title: string;
  summary: string | null;
}

/** El detalle de un patrón: lo educativo más el código de cada snippet. */
export interface PatternDetail extends PatternSummary {
  whatToWatch: string | null;
  takeaways: string[];
  snippets: { label: string; code: string }[];
}

/** Contenido i18n de todos los ejemplos, indexado por id (`examples.*` de Transloco). */
export type PatternContents = Record<string, Partial<ExampleContent> | undefined>;

function summarize(example: WorkerExample, content: Partial<ExampleContent> | undefined) {
  return {
    id: example.id,
    order: example.order,
    category: example.category,
    title: content?.title ?? example.id,
    summary: content?.summary ?? null,
  };
}

/** Catálogo ordenado, opcionalmente filtrado por categoría. */
export function patternCatalog(
  examples: readonly WorkerExample[],
  contents: PatternContents,
  category?: Category,
): PatternSummary[] {
  return examples
    .filter((ex) => !category || ex.category === category)
    .map((ex) => summarize(ex, contents[ex.id]))
    .sort((a, b) => a.order - b.order);
}

/** Detalle de un patrón por id, o `null` si el id no existe. */
export function patternDetail(
  examples: readonly WorkerExample[],
  contents: PatternContents,
  id: string,
): PatternDetail | null {
  const example = examples.find((ex) => ex.id === id);
  if (!example) {
    return null;
  }
  const content = contents[id];
  return {
    ...summarize(example, content),
    whatToWatch: content?.whatToWatch ?? null,
    takeaways: content?.takeaways?.items ?? [],
    snippets: Object.entries(example.snippets).map(([label, code]) => ({ label, code })),
  };
}
