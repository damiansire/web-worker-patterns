#!/usr/bin/env node
/**
 * Guard de boundaries con auto-verificación (lección ECC: "testeá que tu verificador verifica").
 *
 * Contexto: al subir a TypeScript 6, dependency-cruiser 16 dejó de parsear las fuentes
 * y empezó a cruzar 0 módulos EN SILENCIO — el check seguía dando ✓ mientras la regla de
 * oro (core/ ⇏ themes/) quedaba sin vigilar. Un check que pasa sin revisar nada es peor
 * que uno que falla. Este wrapper corre depcruise en JSON y FALLA ruidosamente si:
 *   1. cruzó menos módulos de los esperados (parser roto / glob vacío), o
 *   2. hay violaciones de severidad error.
 *
 * Correr con: `npm run lint:boundaries`
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Tenemos ~128 módulos. Si el cruiser de golpe ve un puñado, algo se rompió.
const MIN_MODULES = 50;

// Invocamos el entry .mjs del cruiser con el mismo node (sin shell) para evitar
// los shims .cmd/.bin y la deprecación de spawn con shell:true. El paquete bloquea
// require.resolve por su mapa de exports, así que ubicamos el bin en node_modules.
const cli = path.resolve('node_modules/dependency-cruiser/bin/dependency-cruise.mjs');
if (!existsSync(cli)) {
  console.error(`✗ boundaries: no encuentro el cruiser en ${cli}. ¿Corriste npm install?`);
  process.exit(1);
}

const res = spawnSync(
  process.execPath,
  [cli, 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

if (res.error) {
  console.error('✗ boundaries: no se pudo ejecutar dependency-cruiser:', res.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(res.stdout);
} catch {
  console.error('✗ boundaries: la salida de dependency-cruiser no es JSON parseable.');
  console.error(res.stdout?.slice(0, 500) ?? '(stdout vacío)');
  console.error(res.stderr?.slice(0, 500) ?? '');
  process.exit(1);
}

const summary = report.summary ?? {};
const cruised = summary.totalCruised ?? 0;
const violations = summary.violations ?? [];
const errorCount = summary.error ?? 0;

// (1) Self-test: el guard tiene que estar mirando algo real.
if (cruised < MIN_MODULES) {
  console.error(
    `✗ boundaries: solo se cruzaron ${cruised} módulos (esperado >= ${MIN_MODULES}).\n` +
      '  Esto NO es un pase limpio: el cruiser casi seguro no puede parsear las fuentes\n' +
      '  (¿desfase de versión de TypeScript? reinstalá dependency-cruiser@latest).',
  );
  process.exit(1);
}

// (2) Violaciones reales de la regla de oro u otras reglas error.
if (errorCount > 0) {
  console.error(`✗ boundaries: ${errorCount} violación(es) de severidad error sobre ${cruised} módulos:\n`);
  for (const v of violations) {
    if (v.rule?.severity !== 'error') continue;
    console.error(`  [${v.rule.name}] ${v.from} → ${v.to}`);
  }
  process.exit(1);
}

console.log(`✓ boundaries OK — ${cruised} módulos cruzados, 0 violaciones error (regla de oro intacta).`);
