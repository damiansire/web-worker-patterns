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

// Gate de build PRIMERO: `tsc`/`ng test` pueden estar verdes mientras `ng build`
// (compilación AOT de plantillas) está roto. Ese falso verde fue justamente el P0
// que tapó un teardown llamando métodos inexistentes. Si `ng build` falla, el gate
// falla acá y no llegamos siquiera a correr tests sobre un build roto.
const build = spawnSync(process.execPath, [ng, 'build'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
process.stdout.write((build.stdout ?? '') + (build.stderr ?? ''));
if (build.status !== 0) {
  console.error(
    `\n✗ test gate: 'ng build' falló (exit ${build.status}). ` +
      'Un build roto NO es un pase limpio aunque `ng test`/`tsc` estén verdes.',
  );
  process.exit(build.status || 1);
}
console.log('\n✓ test gate: ng build OK. Sigo con los tests…\n');

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
