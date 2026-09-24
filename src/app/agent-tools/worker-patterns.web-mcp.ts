import {
  declareExperimentalWebMcpTool,
  EnvironmentProviders,
  ErrorHandler,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { EXAMPLES } from '../core/domain/examples/examples.registry';
import { ThemeService } from '../theming/theme.service';
import {
  PATTERN_CATEGORIES,
  patternCatalog,
  PatternContents,
  patternDetail,
} from './worker-patterns.catalog';

/** Contenido i18n de todos los ejemplos (espera a que Transloco cargue el idioma). */
function loadContents(transloco: TranslocoService): Promise<PatternContents> {
  return firstValueFrom(transloco.selectTranslateObject<PatternContents>('examples'));
}

const unknownId = (id: string) =>
  JSON.stringify({
    error: `No existe el patrón "${id}".`,
    validIds: EXAMPLES.map((e) => e.id),
  });

/**
 * Expone el sitio a agentes de IA vía WebMCP (experimental, Angular 22.2).
 *
 * Tres herramientas: listar el catálogo, leer un patrón (texto + código) y
 * abrirlo en pantalla. Si el navegador no implementa `navigator.modelContext`,
 * Angular no registra nada: es inocuo para cualquier visitante sin agente.
 * Cada tool se declara por separado para que TypeScript infiera los args de su
 * propio `inputSchema`.
 */
export function provideWorkerPatternTools(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const transloco = inject(TranslocoService);
      const router = inject(Router);
      const theme = inject(ThemeService);
      const errors = inject(ErrorHandler);
      const report = (e: unknown) => errors.handleError(e);

      declareExperimentalWebMcpTool({
        name: 'list_worker_patterns',
        description:
          'Lista los patrones de Web Workers que enseña este sitio (id, número, categoría, ' +
          'título y resumen). Usalo primero para descubrir qué ids existen.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: PATTERN_CATEGORIES,
              description: 'Filtra por categoría. Omitilo para traer todos.',
            },
          },
        },
        annotations: { readOnlyHint: true },
        execute: async ({ category }) =>
          JSON.stringify(patternCatalog(EXAMPLES, await loadContents(transloco), category)),
      }).catch(report);

      declareExperimentalWebMcpTool({
        name: 'get_worker_pattern',
        description:
          'Devuelve el detalle de un patrón: qué mirar, conclusiones y el código fuente de ' +
          'cada snippet (main y worker). No cambia nada en pantalla.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Id del patrón, ej. "03-basic-communication".' },
          },
          required: ['id'],
        },
        annotations: { readOnlyHint: true },
        execute: async ({ id }) => {
          const detail = patternDetail(EXAMPLES, await loadContents(transloco), id);
          return detail ? JSON.stringify(detail) : unknownId(id);
        },
      }).catch(report);

      declareExperimentalWebMcpTool({
        name: 'open_worker_pattern',
        description:
          'Navega el sitio a la página interactiva de un patrón, en el theme activo, para ' +
          'que la persona vea y corra la demo.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Id del patrón a abrir.' },
          },
          required: ['id'],
        },
        annotations: { readOnlyHint: false, consequentialHint: false },
        execute: async ({ id }) => {
          if (!EXAMPLES.some((e) => e.id === id)) {
            return unknownId(id);
          }
          const url = `/t/${theme.activeId()}/example/${id}`;
          const ok = await router.navigateByUrl(url);
          return ok ? `Abierto: ${url}` : `No se pudo navegar a ${url}.`;
        },
      }).catch(report);
    }),
  ]);
}
