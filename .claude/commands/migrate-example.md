---
description: Migra un ejemplo de Web Worker al dominio neutral y lo renderiza en los themes registrados (pipeline punta a punta con loop de design-review).
argument-hint: <id-del-ejemplo> (p.ej. 09-backpressure), o vacío para tomar el siguiente del registry
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, TodoWrite, Task
---

# Migrar ejemplo: `$1`

Codifica el pipeline por-ejemplo que ya repetimos en los ejemplos 04–13. Seguilo en orden;
no saltees el loop de design-review. La **regla de oro** manda: el dominio se escribe una
vez en `core/`, la presentación vive en `themes/`. `core/` NUNCA importa de `themes/`.

## 0. Encuadre
- Si `$1` está vacío, abrí `src/app/core/domain/examples/examples.registry.ts` y tomá el
  primer ejemplo sin migrar (sin `@case` en los layouts / sin entrada de contenido).
- Mirá el worker legacy correspondiente y decidí el `DemoKind` (o si hace falta uno nuevo).
- Anotá el plan con `TodoWrite` antes de tocar código.

## 1. Dominio (se escribe UNA vez, en `core/`)
1. **Worker neutral**: portá el legacy a `core/domain/workers/<id>.worker.ts`. Extraé la
   lógica pura a `<id>.worker.logic.ts` para poder testearla sin Worker real (jsdom no los
   soporta). El worker queda como cáscara fina sobre la lógica pura.
2. **Service**: `core/services/<algo>-demo.service.ts`, `@Injectable({ providedIn: 'root' })`,
   estado en **signals**. Seam de tiempo inyectable (`clock` / `stepDelayMs`) para los specs.
   Requisito duro: **el estado sobrevive al cambio de theme** (un worker corriendo sigue).
3. **DemoKind**: si el ejemplo no encaja en una variante existente, sumá el literal a la
   union en `core/domain/examples/example.model.ts`.
4. **Registry**: entrada en `examples.registry.ts` con `workerFactory`/`sharedWorkerFactory`
   y los snippets de código neutrales que muestra el code-block.
5. **Test de dominio (antes de UI)**: spec del `.worker.logic.ts` y/o del service con un
   fake-worker. Si tocaste dominio, hay test que lo cubre. `npm test` verde.

## 2. i18n (contenido neutral)
- Agregá `examples.$1.*` a `public/i18n/es.json` (único idioma registrado hoy;
  `availableLangs` en `src/app/app.config.ts`). El contenido educativo es neutral; sólo el
  chrome de cada theme tiene strings propios.

## 3. Presentación (theme `default`)
- Sumá el `@case '<DemoKind>'` en el example-layout de `src/app/themes/default/`.
- El theme `midnight` reusa el example-layout de `default` (ver `theme.registry.ts` /
  `midnight.theme.ts`), así que no hace falta duplicar nada ahí. Si más adelante un theme
  nuevo tiene presentación propia, sumá el mismo `@case` en su layout.
- Visualización **sin colores/fuentes literales**, siempre tokens semánticos (`--surface`,
  `--ink`, `--accent`, `--thread-*`): así el switch de theme (incluido `midnight`) se ve
  correcto sin tocar el layout. El visualizer se resuelve por DI (`THREAD_VISUALIZER`).
- Criterio clave: **la visualización enseña el concepto SIN leer el código**.

## 4. Loop de design-review (NO opcional)
Construir → `[design-review ⇄ corregir]*` → terminado. Por cada theme registrado
(`theme.registry.ts`: hoy `default` y `midnight`):
1. Si tenés el subagente **`design-reviewer`** configurado (vive en la configuración personal
   de Claude Code del autor, `~/.claude/agents/design-reviewer.md`, no viene en este repo),
   invocalo: es read-only, saca captura real con Playwright y la critica (jerarquía,
   contraste, estados vacío/disabled/hover, y si enseña el concepto). Sin ese agente, hacé el
   mismo chequeo a mano: serví la app (`npm start`), capturá la pantalla del ejemplo en cada
   theme y comparala contra la captura previa del mismo ejemplo.
2. Aplicá lo que marque (o lo que veas) como bloqueante (los nits de gusto no bloquean).
3. Repetí hasta veredicto **`LISTO`**. Tope ~3–4 vueltas; si no converge, escalá al usuario.

## 5. Gates de "hecho" (todos verdes antes de cerrar)
```bash
npm run build              # 0 errores, 0 warnings nuevos
npm test                   # Vitest verde
npm run lint:boundaries    # regla de oro intacta (y el self-test no se silencia)
```
- El cambio de theme no reinicia el estado (verificado).
- Captura: `npm run screenshots` (wipe limpio + regenerar; quedan trackeadas).

## 6. Commit
- Un commit por ejemplo. Mensaje en español, estilo Conventional Commits.
- **Sin atribución a Claude/Anthropic** en el mensaje (convención del repo).
- Usá heredoc con `EOF` entre comillas simples para evitar la sustitución por backticks.

> Recordá: antes de captura/review, si el dev server muestra un overlay de error de Vite que
> el build/tsc NO reproducen, es HMR stale → reiniciá `ng serve`. Y forzá
> `localStorage 'wwp-language'='es'` para capturas ES consistentes.
