# Mastering Web Workers

| Field | Value |
|-------|-------|
| **Status** | Stable |
| **Last updated** | Sunday, 22 June 2026 |

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🌐 This README is also available in other languages:**
> [Español](docs/README.es.md) | [Português](docs/README.pt.md)

Interactive educational platform about **Web Workers** built with **Angular 22**. It ships **16 progressive examples** with live demos and real thread visualization, multi-language support (ES/EN/PT), and **5 swappable visual themes** — the same neutral domain rendered five different ways.

**▶ Live demo: [damiansire.github.io/web-worker-patterns](https://damiansire.github.io/web-worker-patterns/)**

## Quick Start

**On any system (Windows, macOS, Linux):**

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm run dev
```

`npm run dev` checks Node.js (≥18) and npm (≥9), installs dependencies if needed, and starts the server at `http://localhost:4200`.

Alternatives:
- **Just start** (if you already ran `npm install`): `npm start`
- **Windows:** double-click `scripts/start/start.bat`, or in a terminal: `npm run dev`
- **macOS/Linux:** in a terminal: `./scripts/start/start.sh` or `npm run dev`

Open `http://localhost:4200` in your browser.

## Included Examples

The 16 examples are organized into 5 categories by concept. The grouping below mirrors `src/app/core/domain/examples/examples.registry.ts` — the single source of truth.

### Understanding

| # | Example | Description |
|---|---------|-------------|
| 01 | **Counter with setInterval** | How `setInterval` and the event loop work — the baseline to grasp before workers. |
| 02 | **The main thread & event loop** | One thread runs JS, layout, paint and input; a 50 ms task freezes everything. |
| 16 | **Compositor vs main** | The compositor thread keeps `transform`/`opacity` animations smooth even while the main thread is frozen. |

### Communication

| # | Example | Description |
|---|---------|-------------|
| 03 | **Basic communication** | The "Hello World" of workers — `postMessage` in both directions. |
| 08 | **SharedWorker** | One worker instance shared across tabs/panels, all seeing the same state. |

### Optimization

| # | Example | Description |
|---|---------|-------------|
| 04 | **Offload heavy work** | Count primes on a worker so the UI stays responsive — feel the difference side by side. |
| 07 | **Transferable objects** | Pass an `ArrayBuffer` zero-copy; the sender's buffer is left detached. |
| 10 | **Worker pool** | A fixed pool of N workers drains a task queue (4 workers, 24 tasks). |
| 14 | **OffscreenCanvas** | A worker owns the canvas and animates it — smooth even when the main thread blocks. |
| 15 | **The cost of cloning** | Measure the *real* round-trip of structured clone as data size and complexity grow. |

### Management

| # | Example | Description |
|---|---------|-------------|
| 05 | **Error handling** | A worker error doesn't crash the page; the main thread catches it. |
| 06 | **Lifecycle & termination** | Create, run and `terminate()` — the in-flight step is lost and the worker can't be reused. |
| 09 | **Limits of parallelism** | `navigator.hardwareConcurrency` caps real parallelism; beyond it, workers share cores. |

### Advanced

| # | Example | Description |
|---|---------|-------------|
| 11 | **Backpressure** | Flow control with credits and acks so the worker's queue doesn't grow without bound. |
| 12 | **SharedArrayBuffer** | Main and worker share the *same* memory; `Atomics` write/read with no `postMessage`. |
| 13 | **Graceful degradation** | Detect `typeof Worker` and fall back to the main thread when it's missing. |

## Visual Themes

The same domain is skinned by **5 independent themes**, switchable live from the UI:

**Brutalist** · **Full Brutalist** · **Dev Tool** · **Editorial** · **Narrative**

Each theme provides its own shell, home, example layout, UI primitives and a custom thread visualizer — without the domain ever knowing a theme exists.

## Project Architecture

The golden rule: **the domain is written once; the presentation is written five times.** `core/` is theme-neutral and **never** imports from `themes/`. The full rationale lives in [`ARQUITECTURA-multi-theme.md`](ARQUITECTURA-multi-theme.md).

```
src/app/
├── core/                       # Neutral domain — knows nothing about themes
│   ├── domain/
│   │   ├── workers/            # Real Web Workers + pure *.logic.ts (unit-tested)
│   │   └── examples/           # examples.registry.ts (source of truth) + code snippets
│   ├── services/               # Per-example demo services (signals-based)
│   ├── i18n/                   # Transloco loader
│   ├── styles/                 # Shared SCSS (_buttons, _containers, _example-layout)
│   └── utils/                  # Helpers (code-snippet.helper)
├── theming/                    # Theme registry, service, guard, token contract
├── ui-contracts/               # Interfaces every theme primitive must satisfy
├── ui-primitives/              # Theme-agnostic primitives (charts, language switcher)
├── themes/                     # Presentation — one folder per theme
│   ├── brutalist/  full-brutalist/  dev-tool/  editorial/  narrative/
│   │   ├── shell/  home/  example-layout/  primitives/  styles/
├── app.routes.ts              # Routes generated from the examples registry
└── app.ts                     # Root component

public/i18n/                    # en.json · es.json · pt.json (UI + per-example content)
```

### Adding a New Example

A new example is **one neutral domain definition** rendered by all 5 themes. The full pipeline is codified in the `/migrate-example` command (`.claude/commands/migrate-example.md`). In short:

1. Add the worker in `core/domain/workers/` (+ a pure `*.logic.ts` with a unit test) and its snippets under `core/domain/examples/snippets/`.
2. Register it in `core/domain/examples/examples.registry.ts` (`id`, `order`, `category`, `demo`, `workerFactory`).
3. Add the educational content (title, summary, takeaways) to `public/i18n/{en,es,pt}.json`.
4. Wire the demo's visualization into the `@case` of each theme's example layout.

Routes, navigation and the home page update automatically from the registry.

## Tech Stack

- **Angular 22** — Standalone components, Signals, zoneless change detection (opt-in via `provideZonelessChangeDetection()`), esbuild-based build
- **TypeScript 6.0.3**
- **SCSS** — Semantic design tokens (`--surface`, `--ink`, `--accent`, `--thread-*`) per theme
- **@jsverse/transloco** — Runtime i18n (ES/EN/PT)
- **highlight.js** — Syntax highlighting for code blocks
- **Vitest** — Unit tests (100+ tests across the pure domain logic, the services and the themes)
- **dependency-cruiser** — Enforces the `core/ ⇏ themes/` boundary
- **Web Workers API** — Dedicated Workers, SharedWorker, Transferable Objects, SharedArrayBuffer + Atomics, OffscreenCanvas

This project uses Angular's built-in worker support (`@angular/build` / esbuild). Other setups use [worker-plugin](https://github.com/GoogleChromeLabs/worker-plugin) (webpack), [rollup-plugin-off-main-thread](https://github.com/surma/rollup-plugin-off-main-thread), or Parcel's native worker support.

## Angular Version

This project targets **Angular 22** with `@angular/build` and a dedicated `webWorkerTsConfig` for worker bundles.

If you are upgrading from an older major version, use the Angular update tool and follow the official migration guidance:

```bash
ng update @angular/core @angular/cli
```

Then:

- **Zoneless (opt-in)**: Angular is not zoneless by default; this app enables it with `provideZonelessChangeDetection()` in `app.config.ts` (which is why it ships no zone.js in polyfills). It relies on Signals and `computed()` for change detection.
- **Tests**: `tsconfig.spec.json` excludes `**/*.worker.ts`, so worker files are not compiled with the DOM `Window` type.
- **Build**: `@angular/build` is the standard builder and bundles the app with esbuild.

## Available Scripts

```bash
npm run dev            # Checks Node/npm, installs deps if needed and starts the server (all platforms)
npm start              # Dev server at localhost:4200 (requires a prior npm install)
npm run build          # Production build
npm test               # Gate: ESLint + ng build + unit tests (Vitest)
npm run lint           # ESLint: no-console, mandatory OnPush, keyboard a11y
npm run format         # Format the code with Prettier
npm run format:check   # Check formatting without writing (CI gate)
npm run lint:boundaries# Enforce the golden rule (core/ ⇏ themes/)
```

Quality gates (lint, build, format, tests, boundaries) run on every push/PR via [CI](.github/workflows/ci.yml) and as a local git pre-commit hook — independent of your editor. ESLint enforces the invariants the repo preaches: `no-console` in the lib, `ChangeDetectionStrategy.OnPush` on every component (the app is zoneless), and keyboard a11y in templates. See [`AGENTS.md`](AGENTS.md) and [`docs/AI-PROCESS.md`](docs/AI-PROCESS.md).

## Multi-language Support

The application supports English, Spanish, and Portuguese via [Transloco](https://jsverse.github.io/transloco/). Translations live in:

- `public/i18n/en.json` · `public/i18n/es.json` · `public/i18n/pt.json` — UI text **and** the educational content for every example

Switch languages from the selector in each theme's shell.

## Documentation

- [Docker Guide](DOCKER.md) — Run the project with Docker
- [Docker Guide (ES)](docs/DOCKER.es.md) | [Docker Guide (PT)](docs/DOCKER.pt.md)
- [Multi-theme architecture](ARQUITECTURA-multi-theme.md) — The design source of truth
- [AI process](docs/AI-PROCESS.md) — Gates, design-review loop, tooling

### Further reading

- [Use web workers to run JavaScript off the browser's main thread](https://web.dev/articles/off-main-thread) (web.dev) — Why off-main-thread architecture helps Core Web Vitals (INP, LCP) and reduces main-thread contention.
- [Comlink](https://github.com/GoogleChromeLabs/comlink) — Use workers without writing `postMessage` by hand; expose an API that returns promises. This repo uses the native API to teach the fundamentals.
- [PROXX](https://github.com/GoogleChromeLabs/proxx) — Case study: Minesweeper clone with game logic in a worker and rendering on the main thread; see the web.dev article for the tradeoffs (reducing risk and improving UX rather than raw speed).

## License

MIT
