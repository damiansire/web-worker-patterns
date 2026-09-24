import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { EXAMPLES } from '../core/domain/examples/examples.registry';
import { provideThemeRegistry } from '../theming/theme.registry';
import { provideWorkerPatternTools } from './worker-patterns.web-mcp';

interface RegisteredTool {
  name: string;
  annotations?: { readOnlyHint?: boolean };
  execute: (args: Record<string, unknown>, client?: { signal: AbortSignal }) => Promise<unknown>;
}

/** Doble de `navigator.modelContext`: guarda lo registrado y lo suelta al abortar. */
class FakeModelContext {
  readonly tools = new Map<string, RegisteredTool>();
  registerTool(tool: RegisteredTool, opts: { signal: AbortSignal }): Promise<void> {
    this.tools.set(tool.name, tool);
    opts.signal.addEventListener('abort', () => this.tools.delete(tool.name));
    return Promise.resolve();
  }
}

class Loader implements TranslocoLoader {
  getTranslation() {
    return of({
      examples: { '03-basic-communication': { title: 'Comunicación básica', summary: 'hola' } },
    } as Translation);
  }
}

@Component({ template: '' })
class Dummy {}

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: 't/:theme/example/:id', component: Dummy }]),
      provideThemeRegistry(),
      provideTransloco({
        config: { availableLangs: ['es'], defaultLang: 'es' },
        loader: Loader,
      }),
      provideWorkerPatternTools(),
    ],
  });
  // Instanciar algo del environment injector dispara los initializers.
  return TestBed.inject(Router);
}

describe('WebMCP: tools de worker-patterns', () => {
  let ctx: FakeModelContext;
  const call = (name: string, args: Record<string, unknown> = {}) =>
    ctx.tools.get(name)!.execute(args, { signal: new AbortController().signal });

  beforeEach(() => {
    ctx = new FakeModelContext();
    Object.defineProperty(document, 'modelContext', { value: ctx, configurable: true });
  });

  afterEach(() => {
    delete (document as unknown as { modelContext?: unknown }).modelContext;
  });

  it('registra las tres tools con sus anotaciones', () => {
    setup();
    expect([...ctx.tools.keys()].sort()).toEqual([
      'get_worker_pattern',
      'list_worker_patterns',
      'open_worker_pattern',
    ]);
    expect(ctx.tools.get('list_worker_patterns')!.annotations?.readOnlyHint).toBe(true);
    expect(ctx.tools.get('open_worker_pattern')!.annotations?.readOnlyHint).toBe(false);
  });

  it('list_worker_patterns devuelve el registry real con títulos i18n', async () => {
    setup();
    const list = JSON.parse(String(await call('list_worker_patterns'))) as {
      id: string;
      title: string;
    }[];
    expect(list).toHaveLength(EXAMPLES.length);
    expect(list.find((p) => p.id === '03-basic-communication')?.title).toBe('Comunicación básica');

    const advanced = JSON.parse(
      String(await call('list_worker_patterns', { category: 'advanced' })),
    );
    expect(advanced.length).toBe(EXAMPLES.filter((e) => e.category === 'advanced').length);
  });

  it('get_worker_pattern trae el código; un id inválido devuelve los ids válidos', async () => {
    setup();
    const detail = JSON.parse(
      String(await call('get_worker_pattern', { id: '03-basic-communication' })),
    );
    expect(detail.snippets.length).toBeGreaterThan(0);

    const bad = JSON.parse(String(await call('get_worker_pattern', { id: 'nope' })));
    expect(bad.error).toContain('nope');
    expect(bad.validIds).toContain('03-basic-communication');
  });

  it('open_worker_pattern navega a la página del patrón en el theme activo', async () => {
    const router = setup();
    const out = await call('open_worker_pattern', { id: '03-basic-communication' });
    expect(out).toBe('Abierto: /t/default/example/03-basic-communication');
    expect(router.url).toBe('/t/default/example/03-basic-communication');
  });

  it('al destruirse el injector, las tools se desregistran', () => {
    setup();
    expect(ctx.tools.size).toBe(3);
    TestBed.resetTestingModule();
    expect(ctx.tools.size).toBe(0);
  });

  it('sin navigator.modelContext no registra nada ni rompe', () => {
    delete (document as unknown as { modelContext?: unknown }).modelContext;
    expect(() => setup()).not.toThrow();
    expect(ctx.tools.size).toBe(0);
  });
});
