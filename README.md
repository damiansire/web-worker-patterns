# Mastering Web Workers

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Plataforma educativa interactiva sobre **Web Workers** construida con Angular 19. Incluye 10 ejemplos progresivos con demos en vivo, visualización de hilos, soporte multiidioma (ES/EN/PT) y un tema visual cyberpunk.

## Quick Start

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm install
npm start
```

Abre `http://localhost:4200` en tu navegador.

## Ejemplos incluidos

La aplicación organiza los ejemplos en 5 categorías por nivel de complejidad:

### Fundamentos

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 01 | **Contador con setInterval** | Cómo funciona el event loop y por qué setInterval se ejecuta en el hilo principal. |
| 02 | **Main Thread Blocking** | Demuestra el bloqueo de la UI al ejecutar cálculos pesados en el hilo principal. |

### Comunicación

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 03 | **Basic Communication** | Primeros pasos: enviar y recibir mensajes entre el hilo principal y un Worker. |
| 04 | **Offloading Computation** | Mover cálculos pesados a un Worker para mantener la UI fluida. |

### Gestión

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 05 | **Error Handling** | Capturar y manejar errores que ocurren dentro de los Workers. |
| 06 | **Lifecycle & Termination** | Crear, ejecutar y terminar Workers de forma controlada. |

### Optimización

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 07 | **Transferable Objects** | Transferir datos en memoria sin copiarlos usando `ArrayBuffer`. |

### Avanzado

| # | Ejemplo | Descripción |
|---|---------|-------------|
| 08 | **Shared Worker** | Compartir un Worker entre múltiples pestañas del navegador. |
| 09 | **Worker Limits** | Descubrir los límites de hardware y cuántos Workers soporta el navegador. |
| 10 | **Worker Pool** | Patrón de pool: gestionar un conjunto fijo de Workers con una cola de tareas. |

## Arquitectura del proyecto

```
src/app/
├── core/
│   ├── components/          # Componentes reutilizables (InfoBox, CodeSection, LogPanel, etc.)
│   ├── layout/              # Header, Sidebar, Footer
│   ├── models/              # ExampleManifest, tipos compartidos
│   ├── services/            # LanguageService, NavigationService
│   ├── styles/              # SCSS compartidos (_buttons, _containers, _shared)
│   ├── translations/        # Traducciones UI + contenido por ejemplo
│   └── utils/               # Helpers (code-snippet.helper)
├── examples/
│   ├── 01-setinterval-counter/
│   │   ├── manifest.ts                        # Metadata declarativa del ejemplo
│   │   ├── setinterval-counter.component.ts   # Lógica del componente
│   │   ├── setinterval-counter.component.html # Template
│   │   ├── setinterval-counter.component.scss # Estilos
│   │   └── setinterval-counter.snippets.ts    # Code snippets para visualización
│   ├── 02-main-thread/
│   ├── ...
│   └── examples.registry.ts  # Registro central de todos los ejemplos
├── home/                      # Página principal con tarjetas de ejemplo
├── app.routes.ts              # Rutas generadas dinámicamente desde el registry
└── app.ts                     # Componente raíz
```

### Agregar un nuevo ejemplo

1. Crear una carpeta bajo `src/app/examples/` (ej: `11-mi-ejemplo/`)
2. Crear `manifest.ts` con la metadata del ejemplo (id, categoría, traducciones, `loadComponent`)
3. Crear el componente, template, estilos y archivo de snippets
4. Importar el `MANIFEST` en `examples.registry.ts` y agregarlo al array

Las rutas, la navegación del sidebar y la página home se actualizan automáticamente.

## Stack técnico

- **Angular 19** — Standalone Components, Signals
- **SCSS** — Design tokens, tema cyberpunk con variables CSS
- **highlight.js** — Syntax highlighting para los bloques de código
- **Web Workers API** — Dedicated Workers, Shared Workers, Transferable Objects

## Scripts disponibles

```bash
npm start       # Servidor de desarrollo en localhost:4200
npm run build   # Build de producción
npm test        # Tests unitarios
```

## Soporte multiidioma

La aplicación soporta Español, Inglés y Portugués. Las traducciones se gestionan en:

- `src/app/core/translations/translations.ts` — Textos de UI (sidebar, header, home)
- `src/app/core/translations/examples/*.content.ts` — Contenido educativo por ejemplo

El idioma se cambia desde el selector en el sidebar.

## Licencia

MIT
