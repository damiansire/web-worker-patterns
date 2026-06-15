#!/usr/bin/env node
/**
 * Hook PostToolUse (Write|Edit) — la regla de oro, vigilada en cada edición.
 *
 * Patrón ECC: "los hooks disparan en eventos de tool" (bloquear secretos, avisar
 * antipatrones). Acá hacemos cumplir la arquitectura multi-theme EN VIVO, sin esperar
 * al lint manual:
 *   1. `core/` NUNCA importa de `themes/` (la dependencia va en un solo sentido).
 *   2. La lógica de Web Workers vive en `core/domain/workers/`, no dentro de un theme.
 *
 * depcruise ya valida (1) on-demand; este hook lo adelanta al momento de escribir el
 * archivo, así el modelo se autocorrige antes de seguir. Es defensa en profundidad,
 * no reemplazo: el gate sigue siendo `npm run lint:boundaries`.
 *
 * Contrato de hooks de Claude Code: recibe el payload JSON por stdin; exit 2 + mensaje
 * en stderr = feedback bloqueante que vuelve al modelo. Cualquier otro problema interno
 * NO debe romper el flujo (exit 0), para no convertir el guard en un estorbo.
 */
import { readFileSync } from 'node:fs';

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => resolve(raw));
    // Si no llega nada en 2s, seguimos de largo (no bloquear).
    setTimeout(() => resolve(raw), 2000).unref?.();
  });
}

const norm = (p) => (p ?? '').replace(/\\/g, '/');

try {
  const payload = JSON.parse((await readStdin()) || '{}');
  const filePath = norm(payload.tool_input?.file_path);
  if (!filePath) process.exit(0);

  const violations = [];

  // (2) Lógica de worker dentro de un theme: prohibido por nombre de archivo.
  if (/src\/app\/themes\/.+\.worker(\.logic)?\.ts$/.test(filePath)) {
    violations.push(
      `Archivo de worker dentro de themes/: ${filePath}\n` +
        '  La lógica de Web Workers vive en core/domain/workers/, no en un theme ' +
        '(CLAUDE.md: "No meter lógica de Web Workers dentro de un theme").',
    );
  }

  // (1) core/ importando de themes/.
  const isCore = /src\/app\/core\//.test(filePath) && !filePath.endsWith('.spec.ts');
  if (isCore) {
    let src = '';
    try {
      src = readFileSync(payload.tool_input.file_path, 'utf8');
    } catch {
      src = ''; // archivo borrado/movido: nada que revisar.
    }
    const importsTheme = src
      .split('\n')
      .some((line) => /^\s*(import|export)\b[^\n]*from\s+['"][^'"]*themes\//.test(line));
    if (importsTheme) {
      violations.push(
        `core/ importa de themes/: ${filePath}\n` +
          '  Rompe la regla de oro (core/ ⇏ themes/). Reubicá lo compartido en core/ ' +
          'o en un primitivo por tokens (ARQUITECTURA §2).',
      );
    }
  }

  if (violations.length) {
    process.stderr.write('⛔ Regla de oro multi-theme violada:\n\n' + violations.join('\n\n') + '\n');
    process.exit(2); // feedback bloqueante para el modelo.
  }
} catch {
  // Nunca romper el flujo por un error del propio hook.
}
process.exit(0);
