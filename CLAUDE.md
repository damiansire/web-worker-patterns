# CLAUDE.md

Cómo trabajar en este repo: fases y convenciones de código. El diseño vive en
[`ARQUITECTURA-multi-theme.md`](ARQUITECTURA-multi-theme.md); los gates, el
tooling y el loop de design-review viven en
[`docs/AI-PROCESS.md`](docs/AI-PROCESS.md). Este archivo era referenciado por
`AGENTS.md`/`docs/AI-PROCESS.md` como fuente de verdad pero no existía —
creado por `/fragua adoptar` el 2026-07-10.

## Fases

- Cambios chicos y acotados, que se lean como diff — no reescrituras masivas.
- Un ejemplo nuevo = un commit por paso lógico (worker + logic.ts con test →
  registro en `examples.registry.ts` → i18n → wiring por theme), no todo junto.
- Parar a mostrar al terminar un hito: gates verdes (`npm run format:check`,
  `npm run build`, `npm test`, `npm run lint:boundaries`), sin warnings nuevos.
- Tests antes que UI: la lógica pura (`*.logic.ts`) se valida con un test
  unitario sin `TestBed` antes de cablear la pantalla que la consume.
- Si tocás `core/domain/`, dejá un test que lo cubra.

## Convenciones de código

- **Commits**: Conventional Commits en español (`feat(scope): …`,
  `fix(scope): …`, `chore(scope): …`). Sin atribución a IA ni `Co-Authored-By`.
- **Angular moderno únicamente**: standalone components, signals
  (`signal`/`computed`/`effect`/`input`/`output`), `inject()`,
  `ChangeDetectionStrategy.OnPush` en todo componente (la app es zoneless).
  Nada de `NgModule` ni inyección por constructor.
- **La regla de oro** (ver `AGENTS.md`): `core/` nunca importa de `themes/`.
  La lógica de Web Workers vive en `core/domain/workers/`, nunca en un theme.
- **Nombres por dominio**: un servicio/signal se nombra por lo que significa
  para el ejemplo (`workerPoolStatus`, `threadLane`), no por su mecanismo
  interno (`state`, `data`, `handler`).
- No agregues abstracciones para un caso de uso único; no diseñes para
  requisitos hipotéticos.

## Estándar nivel mundial

Piso transversal de `/fragua` (`fellow-standard.md` del corpus,
`~/.claude/tools/_audit-tools/refs/`), más lo que este repo ya cumple por
construcción (boundaries auto-verificados, CI multi-harness, gate de tests
con auto-verificación en `guard-tests.mjs` — ver el comentario ahí sobre el
falso-verde de dependency-cruiser 16, el mismo principio que motivó este
archivo):

- **El verificador se auto-verifica** (ya aplicado en `boundaries.mjs` y
  `guard-tests.mjs`): todo gate nuevo que pueda "pasar sin revisar nada"
  necesita su propio chequeo de que corrió de verdad.
- **README con prueba real, no solo claim** (ítem l): los números que el
  README publica (conteo de tests, cobertura) salen de un script
  (`scripts/update-metrics.mjs`), nunca tipeados a mano.
- **Referencias entre docs no rotas** (drift que este mismo archivo corrige):
  si un doc apunta a otro (`AGENTS.md` → `CLAUDE.md`, `CLAUDE.md` →
  `AI-PROCESS.md`), ese archivo tiene que existir. `doc-coherence.mjs` audita
  el README; las referencias cruzadas entre otros docs del repo no tienen gate
  automático todavía — mientras tanto, revisarlas a mano al tocar cualquiera.
