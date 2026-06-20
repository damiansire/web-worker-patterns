---
description: Revisa un PR (o el diff de la rama actual) buscando solo problemas funcionales, con foco en el dominio Web Workers. Rúbrica con tabla de veredicto.
argument-hint: <número-de-PR> — o vacío para tomar el PR abierto de la rama actual
allowed-tools: Read, Grep, Glob, Bash
---

# Revisar PR: `$1`

Revisá el pull request indicado buscando **solo problemas funcionales**: correctitud,
performance, concurrencia y mantenibilidad. Ignorá los nits de estilo que no impactan el
comportamiento (de eso ya se ocupan Prettier y `lint:boundaries`).

El número de PR viene como argumento. Si está vacío, buscá un PR abierto en la rama actual.

## 1. Traer el contexto del PR

- `gh pr view <número> --json title,body,headRefName,baseRefName,files,additions,deletions`
- `gh pr diff <número>` para el diff completo.
- Leé **cada archivo tocado** del diff — no lo hojees.

## 2. Áreas de foco

Evaluá el diff contra estas categorías. Reportá solo lo que tenga impacto funcional real.
La fila de **Web Workers** es propia de este repo y es la que más importa acá.

| Categoría                  | Qué buscar                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Web Workers**            | Race conditions; protocolo de `postMessage` mal tipado o desincronizado (mensajes sin discriminante, respuestas sin correlación); ownership de `Transferable` (un `ArrayBuffer` transferido queda detached del lado emisor); `SharedArrayBuffer`/`Atomics` sin los headers COOP/COEP o sin fallback; workers/`MessagePort` que no se terminan (`terminate()`/`close()`) → leaks. |
| **Regla de oro / capas**   | `core/` importando algo de `themes/` (va en un solo sentido). La lógica de workers debe vivir en `core/domain/workers/`, nunca en un theme. |
| **Estado y ciclo de vida** | El estado debe sobrevivir al cambio de theme (un worker corriendo sigue). Estado mutable a nivel módulo; limpieza faltante en `ngOnDestroy`. |
| **Bugs de lógica**         | Off-by-one, condiciones invertidas, código inalcanzable, fallas silenciosas.                                                                |
| **Type safety**            | Casts inseguros, huecos en la discriminación de uniones de mensajes, fugas de `any`, genéricos incorrectos.                                 |
| **Performance**            | Ráfagas de `postMessage` que disparan N reconciliaciones (drená por frame / coalescing por scope); copias innecesarias donde corresponde transferir; O(n²) evitable. |
| **Contratos de API**       | Cambios de comportamiento silenciosos en el contrato de mensajes `shared`; manejo de errores incorrecto en los bordes worker↔main.        |
| **Cobertura de tests**     | ¿Los tests ejercitan de verdad los paths que cambiaron? La lógica pura del worker (`*.worker.logic.ts`) debe testearse sin Worker real (jsdom no los soporta). |
| **i18n**                   | Si se sumó contenido, ¿están las tres claves (`es`/`en`/`pt`) y son neutrales (sin chrome de theme)?                                        |

## 3. Chequeo mecánico de convenciones

El repo no tiene `CONTRIBUTING.md`; las reglas viven en `AGENTS.md` y `docs/AI-PROCESS.md`.
Verificá solo lo mecánico:

| Convención            | Cómo verificar                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Mensaje de commit** | Conventional Commits **en español** (`feat`/`fix`/`docs`/`refactor`/`chore`/`perf`/`test`). Scope real del repo.    |
| **Sin atribución IA** | El mensaje **no** menciona a Claude/Anthropic ni lleva `Co-Authored-By`.                                             |
| **Tests incluidos**   | Si tocó dominio/lógica, debe haber un test que lo cubra.                                                             |
| **Gates verdes**      | `npm run format:check`, `npm run build`, `npm test`, `npm run lint:boundaries` deben pasar (es lo que corre el CI).  |
| **Commit atómico**    | Un cambio lógico por commit; marcá cambios dispares que deberían ir separados.                                       |

## 4. Formato de salida

Escribí los hallazgos en **segunda persona**, accionables, listos para pegar como comentario
de review.

- Hallazgos de código como lista plana agrupada por severidad. Por cada uno: nombrá la
  categoría, referenciá archivo y código, explicá el impacto funcional y sugerí un fix si no
  es obvio.
- Hallazgos mecánicos de convención aparte.

Omití las categorías sin hallazgos. No rellenes con elogios ni paja.

Cerrá con una tabla de veredicto:

```
| Área | Veredicto |
|------|-----------|
| ...  | ...       |
```

Veredictos de una frase: "Limpio", "Reparo menor", "Arreglar antes de mergear", "Bloqueante".
