#!/usr/bin/env node
/**
 * Sincroniza el conteo de tests del README con la suite real.
 *
 * El README afirmaba "100+ tests" a mano; sin un script que lo regenere, ese
 * numero queda congelado en el commit que lo escribio mientras la suite crece
 * o encoge. Reusa el mismo regex de parseo que scripts/test/guard-tests.mjs
 * (ya probado contra la salida real de `ng test`).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ng = path.resolve('node_modules/@angular/cli/bin/ng.js');
if (!existsSync(ng)) {
  console.error(`update-metrics: no encuentro la CLI de Angular en ${ng}. ¿npm install?`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [ng, 'test', '--watch=false'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const output = (result.stdout ?? '') + (result.stderr ?? '');
const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

const match = clean.match(/Tests\s+(\d+)\s+passed/);
if (!match) {
  console.error('update-metrics: no pude leer el conteo de tests de la salida de `ng test`.');
  console.error(clean.slice(-2000));
  process.exit(1);
}
const testCount = Number(match[1]);

const readmePath = path.resolve('README.md');
const readme = readFileSync(readmePath, 'utf8');
const updated = readme.replace(
  /<!-- METRICS:TESTS -->\d+\+?<!-- \/METRICS:TESTS -->/,
  `<!-- METRICS:TESTS -->${testCount}<!-- /METRICS:TESTS -->`
);

if (updated === readme) {
  console.error('update-metrics: no encontre los markers METRICS:TESTS en README.md');
  process.exit(1);
}

writeFileSync(readmePath, updated);
console.log(`tests: ${testCount}`);
