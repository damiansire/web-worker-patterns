# Regla de oro de la arquitectura multi-theme

Regla persistente para Google Antigravity (carpeta `.agents/rules/`, escaneada en el git root).
Antigravity también lee `AGENTS.md`; esto es el mismo contenido como regla nativa. Es un
puntero, no la fuente de verdad.

- El dominio se escribe una vez en `core/`; la presentación cinco veces en `themes/`.
- `core/` NUNCA importa de `themes/` — la dependencia va en un solo sentido.
- La lógica de Web Workers vive en `core/domain/workers/`, nunca dentro de un theme.
- Nada de colores/fuentes literales en componentes compartidos: siempre tokens semánticos
  (`--surface`, `--ink`, `--accent`, `--thread-*`).
- Antes de cerrar un cambio: `npm run format:check`, `npm run build`, `npm test`, `npm run lint:boundaries`.

Fuente de verdad completa: `ARQUITECTURA-multi-theme.md`, `CLAUDE.md`, `docs/AI-PROCESS.md`,
`AGENTS.md`. La red de aplicación (git pre-commit + CI) corre igual con cualquier IDE/IA.
