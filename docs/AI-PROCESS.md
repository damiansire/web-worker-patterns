# Nuestro proceso de IA

Cómo trabajamos este repo con asistencia de IA. La fuente de verdad del **diseño** sigue
siendo `ARQUITECTURA-multi-theme.md`; la del **cómo trabajar**, `CLAUDE.md`. Este documento
hace explícito el *proceso* — gates, loops, tooling — para que sea repetible y no dependa de
la memoria de una sesión.

> Inspirado en patrones de [ECC](https://github.com/affaan-m/ECC) (el "agent harness OS").
> Tomamos los patrones, no la escala: nada de 262 skills ni 64 agentes. Lo que nos sirve y
> nada más.

## 1. Gates de verificación (no negociables)

Antes de cerrar cualquier cambio, todo verde:

```bash
npm run build              # 0 errores, 0 warnings nuevos
npm test                   # Vitest
npm run lint:boundaries    # regla de oro: core/ ⇏ themes/
```

**El verificador se auto-verifica.** `lint:boundaries` corre por `scripts/lint/boundaries.mjs`,
que FALLA ruidosamente si el cruiser ve menos de 50 módulos. Por qué: al subir a TypeScript 6,
dependency-cruiser 16 dejó de parsear y empezó a cruzar **0 módulos en silencio** — el check
daba ✓ mientras la regla de oro quedaba sin vigilar. Un check que pasa sin revisar nada es
peor que uno que falla.

## 2. Loop de design-review (toda UI renderizada)

`construir → [design-review ⇄ corregir lo bloqueante]* → LISTO`

El subagente **`design-reviewer`** (`.claude/agents/design-reviewer.md`) es read-only: saca la
captura real con Playwright, la mira y critica (jerarquía, contraste, estados, y si enseña el
concepto sin leer el código). El constructor aplica; se re-revisa. Itera hasta `LISTO`. Tope
~3–4 vueltas; si no converge, escalar. El crítico no edita: ojo fresco, sin sesgo de autor.

Esto es el patrón ECC de "subagentes con scope acotado" + verificación adversarial. Para
*código* (no diseño) el equivalente es correr varios lentes — correctitud, seguridad, a11y,
perf — anclados en la skill `angular-developer`, no un solo pase.

## 3. Hooks event-driven (defensa en profundidad)

Scripts Node cross-platform en `scripts/hooks/` (patrón ECC: "los hooks disparan en eventos").
Se registran copiando `.claude/settings.hooks.sample.json` → `.claude/settings.json`:

- **`guard-regla-de-oro.mjs`** (PostToolUse Write|Edit): bloquea en vivo si `core/` importa de
  `themes/` o si aparece un `*.worker.ts` dentro de un theme. Adelanta el lint al momento de
  escribir; no lo reemplaza.
- **`cleanup-scratch.mjs`** (SessionEnd): barre los `wwp-*-tmp.*` que dejan los pasos
  exploratorios, para que no ensucien `git status`.

No son un gate (el gate es `npm run`), son una red temprana que provoca autocorrección.

## 4. El pipeline por-ejemplo: `/migrate-example`

La migración de un worker a dominio neutral + 5 themes está codificada en
`.claude/commands/migrate-example.md` (skill `/migrate-example`). Resumen:
dominio una vez en `core/` (worker + `.logic` puro + service en signals + DemoKind + registry
+ test) → i18n es/en/pt → `@case` en los 5 layouts con visualización propia → loop de
design-review → gates → commit + screenshots. El estado **sobrevive al cambio de theme**.

## 5. Research-first

Antes de implementar una API poco habitual (SharedArrayBuffer/Atomics, COOP/COEP,
transferables), traer la doc autoritativa primero, no cuando me trabo. Recursos cableados:

- **Angular CLI MCP** (`.mcp.json` / `.vscode/mcp.json`): `get_best_practices`,
  `find_examples`, `search_documentation`. **Configurado ≠ usado**: entra al loop real de
  desarrollo, no es decoración.
- **`.github/copilot-instructions.md`**: guías oficiales de Angular (angular.dev/ai), verbatim.
- **Skill `angular-developer`**: referencias locales por tema (componentes, signals, DI, a11y,
  testing, routing). Arrancar cada tarea Angular preguntando qué referencia aplica.

## 6. Memoria / instincts

Los gotchas durables se capturan como memoria persistente (no prosa de una sesión):
`.claude/.../memory/` + índice en `MEMORY.md`. Si un patrón se repite o un bug nos costó,
se escribe. Ejemplos vivos: el self-test de boundaries, el overlay stale de Vite, el pipeline
de 5 themes.

## 7. Lo que NO copiamos de ECC

Su escala es para un meta-sistema multi-harness, no para una app: 262 skills, 64 agentes,
dashboard Tkinter, control-plane en Rust, motor de scoring de instincts. Sobredimensionado
acá. El valor para nosotros es selectivo: self-test del verificador, hooks de guardrail,
skills + reviewers especializados, research-first, memoria disciplinada.
