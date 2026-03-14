# Mastering Web Workers

| | |
|---|---|
| **Estado** | Work in progress |
| **Última actualización** | Domingo 15 de marzo de 2026 |

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🌐 This README is also available in other languages:**
> [Español](docs/README.es.md) | [Português](docs/README.pt.md)

Interactive educational platform about **Web Workers** built with **Angular 21**. Includes 10 progressive examples with live demos, thread visualization, multi-language support (ES/EN/PT), and a cyberpunk visual theme.

## Quick Start

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm install
npm start
```

Open `http://localhost:4200` in your browser.

## Included Examples

The application organizes examples into 5 categories by complexity level:

### Understanding

| # | Example | Description |
|---|---------|-------------|
| 01 | **SetInterval Counter** | How the event loop works and why setInterval runs on the main thread. |
| 02 | **Main Thread Blocking** | Demonstrates UI blocking when running heavy computations on the main thread. |

### Communication

| # | Example | Description |
|---|---------|-------------|
| 03 | **Basic Communication** | First steps: send and receive messages between the main thread and a Worker. |
| 04 | **Offloading Computation** | Move heavy computations to a Worker to keep the UI responsive. |

### Management

| # | Example | Description |
|---|---------|-------------|
| 05 | **Error Handling** | Catch and handle errors that occur inside Workers. |
| 06 | **Lifecycle & Termination** | Create, run, and terminate Workers in a controlled manner. |

### Optimization

| # | Example | Description |
|---|---------|-------------|
| 07 | **Transferable Objects** | Transfer data in memory without copying using `ArrayBuffer`. |

### Advanced

| # | Example | Description |
|---|---------|-------------|
| 08 | **Shared Worker** | Share a Worker across multiple browser tabs. |
| 09 | **Worker Limits** | Discover hardware limits and how many Workers the browser supports. |
| 10 | **Worker Pool** | Pool pattern: manage a fixed set of Workers with a task queue. |

## Project Architecture

```
src/app/
├── core/
│   ├── components/          # Reusable components (InfoBox, CodeSection, LogPanel, etc.)
│   ├── layout/              # Header, Sidebar, Footer
│   ├── models/              # ExampleManifest, shared types
│   ├── services/            # LanguageService, NavigationService
│   ├── styles/              # Shared SCSS (_buttons, _containers, _shared)
│   ├── translations/        # UI translations + per-example content
│   └── utils/               # Helpers (code-snippet.helper)
├── examples/
│   ├── 01-setinterval-counter/
│   │   ├── manifest.ts                        # Declarative example metadata
│   │   ├── setinterval-counter.component.ts   # Component logic
│   │   ├── setinterval-counter.component.html # Template
│   │   ├── setinterval-counter.component.scss # Styles
│   │   └── setinterval-counter.snippets.ts    # Code snippets for display
│   ├── 02-main-thread/
│   ├── ...
│   └── examples.registry.ts  # Central registry of all examples
├── home/                      # Home page with example cards
├── app.routes.ts              # Routes dynamically generated from the registry
└── app.ts                     # Root component
```

### Adding a New Example

1. Create a folder under `src/app/examples/` (e.g., `11-my-example/`)
2. Create `manifest.ts` with the example metadata (id, category, translations, `loadComponent`)
3. Create the component, template, styles, and snippets file
4. Import the `MANIFEST` in `examples.registry.ts` and append it to the array

Routes, sidebar navigation, and the home page update automatically.

## Tech Stack

- **Angular 21** — Standalone components, Signals, zoneless change detection by default, Vite-based build
- **TypeScript 5.9**
- **SCSS** — Design tokens, cyberpunk theme with CSS custom properties
- **highlight.js** — Syntax highlighting for code blocks
- **Vitest** — Unit tests
- **Web Workers API** — Dedicated Workers, Shared Workers, Transferable Objects

## Upgrading from Angular 19

This project targets **Angular 21**. If you are on an older major version, use the official migrator and then fix any breaking changes:

```bash
# From Angular 19: upgrade stepwise so migrations run (19 → 20 → 21)
ng update @angular/core@20 @angular/cli@20
ng update @angular/core@21 @angular/cli@21
```

Then:

- **Zoneless by default**: Angular 21 uses zoneless change detection unless you add `provideZoneChangeDetection()`. This app relies on Signals and `computed()`, so no extra config is needed.
- **Tests**: `tsconfig.spec.json` excludes `**/*.worker.ts` so worker files (which use `WorkerGlobalScope` / `SharedWorkerGlobalScope`) are not compiled with the DOM `Window` type.
- **Build**: `@angular/build` (esbuild/Vite) is the default; the project uses `application` builder and `webWorkerTsConfig` for worker bundles.

*This repository was updated from Angular 21 (next/rc) to stable 21.2; the steps above are for upgrading from Angular 19 from scratch and ensuring migrations run via `ng update`.*

## Available Scripts

```bash
npm start       # Dev server at localhost:4200
npm run build   # Production build
npm test        # Unit tests
```

## Multi-language Support

The application supports English, Spanish, and Portuguese. Translations are managed in:

- `src/app/core/translations/translations.ts` — UI text (sidebar, header, home)
- `src/app/core/translations/examples/*.content.ts` — Educational content per example

Switch languages from the selector in the sidebar.

## Documentation

- [Docker Guide](DOCKER.md) — Run the project with Docker
- [Docker Guide (ES)](docs/DOCKER.es.md) | [Docker Guide (PT)](docs/DOCKER.pt.md)

## License

MIT
