# AGENTS.md

Guía para **cualquier** asistente de IA o editor (Claude Code, Cursor, GitHub Copilot,
Codex, Zed, Gemini, Jules…). Este archivo es un **puntero**, no la fuente de verdad: las
reglas se escriben una sola vez y acá solo se resumen para que ninguna herramienta las ignore.

Leé, en este orden:

1. `ARQUITECTURA-multi-theme.md` — el diseño (fuente de verdad).
2. `CLAUDE.md` — cómo trabajar (fases, convenciones de código).
3. `docs/AI-PROCESS.md` — gates, loop de design-review, hooks.

## Estado actual (uno y uno)

Hoy el repo corre con **un solo theme** (`default`, neutro) y **un solo idioma** (`es`). El
motor de theming e i18n queda **genérico**: sumar themes/idiomas es agregar entradas al
registry / a `availableLangs`, sin tocar el dominio. La identidad visual del theme `default`
está por diseñarse. (Antes convivían 5 themes y 3 idiomas; se consolidó a uno de cada uno.)

## La regla de oro (no negociable)

> El dominio se escribe una vez. La presentación es un layer de theme intercambiable.

- Todo lo neutral (workers reales, registry de ejemplos, estado de hilos, i18n) vive en
  `core/` y **no conoce los themes**.
- `core/` **NUNCA** importa nada de `themes/`. La dependencia va en un solo sentido.
- La lógica de Web Workers vive en `core/domain/workers/`, **nunca** dentro de un theme.

## Gates antes de cerrar cualquier cambio

```bash
npm run format:check       # Prettier; `npm run format` arregla
npm run build              # 0 errores, 0 warnings nuevos
npm test                   # Vitest
npm run lint:boundaries    # hace cumplir la regla de oro; se auto-verifica
```

Estos gates se aplican **igual sin importar tu IDE/IA**: hay un git pre-commit (`.githooks/`,
se activa con `npm run setup`) y CI (`.github/workflows/ci.yml`) que los corren. No dependen
de que tu editor tenga hooks. Si trabajás en otro harness, esa es la red que te cubre.

## Atajos opcionales por herramienta (feedback temprano, no reemplazan los gates)

- **Claude Code**: hooks en `scripts/hooks/`; registro en `.claude/settings.hooks.sample.json`.
- **Cursor**: `.cursor/rules/`.
- **GitHub Copilot**: `.github/copilot-instructions.md`.
- **Google Antigravity**: lee este `AGENTS.md`; además hay regla nativa en `.agents/rules/`.

Convención del repo: los mensajes de commit van en español, estilo Conventional Commits, y
**sin atribución a la IA**.
