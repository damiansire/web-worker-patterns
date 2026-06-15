#!/usr/bin/env node
/**
 * Gate de tests con auto-verificación (misma lección que scripts/lint/boundaries.mjs).
 *
 * El runner de Vitest bajo `ng test` a veces falla en el bootstrap y reporta "no tests" /
 * "failed to find the runner" PERO sale con código 0 — un falso verde: el gate pasa sin
 * correr nada. Igual que con boundaries: un check que pasa sin verificar es peor que uno que
 * falla. Este wrapper corre `ng test`, y FALLA si:
 *   1. la salida dice "no tests" / no encontró el runner, o
 *   2. corrieron menos tests de los esperados (umbral configurable por WWP_MIN_TESTS).
 *
 * Correr con: `npm test`
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const MIN_TESTS = Number(process.env.WWP_MIN_TESTS) || 50;

const ng = path.resolve('node_modules/@angular/cli/bin/ng.js');
if (!existsSync(ng)) {
  console.error(`✗ test gate: no encuentro la CLI de Angular en ${ng}. ¿npm install?`);
  process.exit(1);
}

const res = spawnSync(process.execPath, [ng, 'test'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

const raw = (res.stdout ?? '') + (res.stderr ?? '');
process.stdout.write(raw); // mostramos la salida real del runner

// Quitamos códigos ANSI para parsear el resumen ("Tests  81 passed (81)").
const clean = raw.replace(/\[[0-9;]*m/g, '');
const match = clean.match(/Tests\s+(\d+)\s+passed/);
const ran = match ? Number(match[1]) : 0;

const looksEmpty = /no tests|failed to find the runner/i.test(clean);

if (looksEmpty || ran < MIN_TESTS) {
  console.error(
    `\n✗ test gate: corrieron ${ran} tests (esperado >= ${MIN_TESTS}).\n` +
      "  'no tests' / runner roto NO es un pase limpio — es un falso verde. Reintentá o\n" +
      '  arreglá el bootstrap del runner antes de confiar en este gate.',
  );
  process.exit(1);
}

if (res.status !== 0) {
  process.exit(res.status); // hubo tests fallados: respetamos el código del runner
}

console.log(`\n✓ test gate: ${ran} tests corridos y verdes (umbral >= ${MIN_TESTS}).`);
