# Mastering Web Workers

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🌐 Este README también está disponible en otros idiomas:**
> [English](../README.md) | [Português](README.pt.md)

Plataforma educativa interactiva sobre **Web Workers** construida con **Angular 22**. Incluye **16 ejemplos progresivos** con demos en vivo y visualización real de hilos, soporte multiidioma (ES/EN/PT) y **5 temas visuales intercambiables** — el mismo dominio neutral renderizado de cinco formas distintas.

## Quick Start

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm run dev
```

`npm run dev` comprueba Node.js (≥18) y npm (≥9), instala dependencias si hace falta y arranca el servidor en `http://localhost:4200`.

Alternativas:
- **Solo arrancar** (si ya hiciste `npm install`): `npm start`
- **Windows:** doble clic en `scripts/start/start.bat` o en una terminal: `npm run dev`
- **macOS/Linux:** en una terminal: `./scripts/start/start.sh` o `npm run dev`

Abre `http://localhost:4200` en el navegador.

## Ejemplos incluidos

Los 16 ejemplos se organizan en 5 categorías por concepto. La agrupación refleja `src/app/core/domain/examples/examples.registry.ts` — la única fuente de verdad.

### Entender

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 01 | **Contador con setInterval** | Cómo funcionan `setInterval` y el event loop — la base antes de los workers. |
| 02 | **El hilo principal y el event loop** | Un solo hilo corre JS, layout, paint y eventos; una tarea de 50 ms congela todo. |
| 16 | **Compositor vs main** | El hilo compositor mantiene fluidas las animaciones de `transform`/`opacity` aunque el main esté congelado. |

### Comunicación

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 03 | **Comunicación básica** | El "Hola Mundo" de los workers — `postMessage` en ambos sentidos. |
| 08 | **SharedWorker** | Una sola instancia compartida entre pestañas/paneles, todos viendo el mismo estado. |

### Optimización

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 04 | **Descargar trabajo pesado** | Contar primos en un worker para mantener la UI fluida — la diferencia se siente lado a lado. |
| 07 | **Objetos transferibles** | Pasar un `ArrayBuffer` sin copiar (zero-copy); el buffer del emisor queda *detached*. |
| 10 | **Worker pool** | Un pool fijo de N workers drena una cola de tareas (4 workers, 24 tareas). |
| 14 | **OffscreenCanvas** | Un worker es dueño del canvas y lo anima — fluido incluso con el main bloqueado. |
| 15 | **El costo de clonar** | Medir el round-trip *real* del structured clone a medida que crecen tamaño y complejidad. |

### Gestión

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 05 | **Manejo de errores** | Un error en un worker no rompe la página; el hilo principal lo captura. |
| 06 | **Ciclo de vida y terminación** | Crear, correr y `terminate()` — el paso en curso se pierde y el worker no se reutiliza. |
| 09 | **Límites del paralelismo** | `navigator.hardwareConcurrency` topea el paralelismo real; más allá, los workers comparten núcleos. |

### Avanzado

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 11 | **Backpressure** | Control de flujo con créditos y acks para que la cola del worker no crezca sin límite. |
| 12 | **SharedArrayBuffer** | Main y worker comparten la *misma* memoria; `Atomics` escribe/lee sin `postMessage`. |
| 13 | **Degradación elegante** | Detectar `typeof Worker` y caer al hilo principal cuando no está disponible. |

## Temas visuales

El mismo dominio se viste con **5 temas independientes**, conmutables en vivo desde la UI:

**Brutalist** · **Full Brutalist** · **Dev Tool** · **Editorial** · **Narrative**

Cada tema aporta su propio shell, home, layout de ejemplo, primitivos de UI y un visualizador de hilos a medida — sin que el dominio sepa jamás que existe un tema.

## Arquitectura del proyecto

La regla de oro: **el dominio se escribe una vez; la presentación se escribe cinco veces.** `core/` es neutral y **nunca** importa de `themes/`. El razonamiento completo vive en [`ARQUITECTURA-multi-theme.md`](../ARQUITECTURA-multi-theme.md).

```
src/app/
├── core/                       # Dominio neutral — no conoce los themes
│   ├── domain/
│   │   ├── workers/            # Web Workers reales + *.logic.ts puro (con tests)
│   │   └── examples/           # examples.registry.ts (fuente de verdad) + snippets
│   ├── services/               # Servicios de demo por ejemplo (basados en signals)
│   ├── i18n/                   # Loader de Transloco
│   ├── styles/                 # SCSS compartido (_buttons, _containers, _example-layout)
│   └── utils/                  # Helpers (code-snippet.helper)
├── theming/                    # Registry de themes, service, guard, contrato de tokens
├── ui-contracts/               # Interfaces que todo primitivo de theme debe cumplir
├── ui-primitives/              # Primitivos agnósticos al theme (charts, selector de idioma)
├── themes/                     # Presentación — una carpeta por theme
│   ├── brutalist/  full-brutalist/  dev-tool/  editorial/  narrative/
│   │   ├── shell/  home/  example-layout/  primitives/  styles/
├── app.routes.ts              # Rutas generadas desde el registry de ejemplos
└── app.ts                     # Componente raíz

public/i18n/                    # en.json · es.json · pt.json (UI + contenido por ejemplo)
```

### Agregar un nuevo ejemplo

Un ejemplo nuevo es **una definición de dominio neutral** renderizada por los 5 themes. El pipeline completo está codificado en el comando `/migrate-example` (`.claude/commands/migrate-example.md`). En resumen:

1. Agregar el worker en `core/domain/workers/` (+ un `*.logic.ts` puro con test) y sus snippets en `core/domain/examples/snippets/`.
2. Registrarlo en `core/domain/examples/examples.registry.ts` (`id`, `order`, `category`, `demo`, `workerFactory`).
3. Agregar el contenido educativo (título, resumen, takeaways) a `public/i18n/{en,es,pt}.json`.
4. Conectar la visualización del demo en el `@case` del layout de cada theme.

Las rutas, la navegación y el home se actualizan solos desde el registry.

## Stack tecnológico

- **Angular 22** — Componentes standalone, Signals, change detection zoneless por defecto, build con esbuild
- **TypeScript 6.0.3**
- **SCSS** — Tokens de diseño semánticos (`--surface`, `--ink`, `--accent`, `--thread-*`) por theme
- **@jsverse/transloco** — i18n en runtime (ES/EN/PT)
- **highlight.js** — Resaltado de sintaxis en bloques de código
- **Vitest** — Tests unitarios (109 tests sobre la lógica pura del dominio)
- **dependency-cruiser** — Hace cumplir el límite `core/ ⇏ themes/`
- **Web Workers API** — Dedicated Workers, SharedWorker, Transferable Objects, SharedArrayBuffer + Atomics, OffscreenCanvas

Este proyecto usa el soporte de workers integrado de Angular (`@angular/build` / esbuild). Otros setups usan [worker-plugin](https://github.com/GoogleChromeLabs/worker-plugin) (webpack), [rollup-plugin-off-main-thread](https://github.com/surma/rollup-plugin-off-main-thread) o el soporte nativo de Parcel.

## Versión de Angular

Este proyecto apunta a **Angular 22** con `@angular/build` y un `webWorkerTsConfig` dedicado para los bundles de workers.

Si venís de una versión mayor anterior, usá la herramienta de actualización de Angular y seguí la guía oficial:

```bash
ng update @angular/core @angular/cli
```

Después:

- **Zoneless por defecto**: Angular 22 usa change detection zoneless salvo que agregues `provideZoneChangeDetection()`. Esta app se apoya en Signals y `computed()`, así que no hace falta config extra.
- **Tests**: `tsconfig.spec.json` excluye `**/*.worker.ts`, así los archivos de worker no se compilan con el tipo `Window` del DOM.
- **Build**: `@angular/build` es el builder estándar y empaqueta la app con esbuild.

## Scripts disponibles

```bash
npm run dev            # Comprueba Node/npm, instala deps si hace falta y arranca el servidor
npm start              # Dev server en localhost:4200 (requiere npm install previo)
npm run build          # Build de producción
npm test               # Tests unitarios (Vitest)
npm run format         # Formatea el código con Prettier
npm run format:check   # Verifica el formato sin escribir (gate de CI)
npm run lint:boundaries# Hace cumplir la regla de oro (core/ ⇏ themes/)
```

Los gates de calidad (build, formato, tests, boundaries) corren en cada push/PR vía [CI](../.github/workflows/ci.yml) y como git pre-commit local — independiente del editor. Ver [`AGENTS.md`](../AGENTS.md) y [`docs/AI-PROCESS.md`](AI-PROCESS.md).

## Soporte multiidioma

La aplicación soporta inglés, español y portugués vía [Transloco](https://jsverse.github.io/transloco/). Las traducciones viven en:

- `public/i18n/en.json` · `public/i18n/es.json` · `public/i18n/pt.json` — texto de UI **y** el contenido educativo de cada ejemplo

Cambiá de idioma desde el selector en el shell de cada theme.

## Documentación

- [Guía de Docker](../DOCKER.md) — Correr el proyecto con Docker
- [Guía de Docker (ES)](DOCKER.es.md) | [Guía de Docker (PT)](DOCKER.pt.md)
- [Arquitectura multi-theme](../ARQUITECTURA-multi-theme.md) — La fuente de verdad del diseño
- [Proceso de IA](AI-PROCESS.md) — Gates, loop de design-review, tooling

## Licencia

MIT
