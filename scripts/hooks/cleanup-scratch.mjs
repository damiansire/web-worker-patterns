#!/usr/bin/env node
/**
 * Hook SessionEnd — barre los scratch que dejan los pasos exploratorios.
 *
 * Durante la sesión, los subagentes y diagnósticos sueltan archivos temporales en la
 * raíz (p.ej. `wwp-diag-tmp.mjs`, `wwp-review-tmp.mjs`) que después aparecen como ruido
 * en `git status`. En vez de acordarnos de borrarlos a mano, los limpiamos al cerrar.
 *
 * Sólo toca patrones de scratch explícitos en la raíz del repo. Nunca borra nada
 * versionado ni dentro de src/. Falla en silencio: un hook no debe romper el cierre.
 */
import { readdirSync, rmSync } from 'node:fs';

const SCRATCH = /^wwp-.*-tmp\.[a-z0-9]+$/i;

try {
  const removed = [];
  for (const entry of readdirSync(process.cwd(), { withFileTypes: true })) {
    if (entry.isFile() && SCRATCH.test(entry.name)) {
      try {
        rmSync(entry.name);
        removed.push(entry.name);
      } catch {
        /* ignorar: archivo en uso o ya borrado */
      }
    }
  }
  if (removed.length) {
    process.stdout.write(`🧹 scratch limpiado: ${removed.join(', ')}\n`);
  }
} catch {
  /* no romper el cierre de sesión */
}
process.exit(0);
