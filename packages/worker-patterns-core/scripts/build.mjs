/**
 * Build del paquete sin dejar `dist/` vacío en ningún momento.
 *
 * Antes el script borraba `dist/` entero y después corría `tsc`. La app
 * resuelve `@worker-patterns/core` contra `dist/index.d.ts`, así que si
 * `ng serve` estaba corriendo cuando alguien lanzaba `npm run build` o
 * `npm test` (sus `prebuild`/`pretest` compilan este paquete), el dev server
 * recompilaba justo en ese hueco y mostraba un TS2307 que quedaba en pantalla.
 *
 * Ahora `tsc` escribe encima de lo que ya hay y recién después se borran los
 * archivos de `dist/` que este build no emitió (restos de fuentes que ya no
 * existen). Si `tsc` falla, `dist/` queda como estaba.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, rmdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(packageRoot, 'dist');
const tscBin = createRequire(import.meta.url).resolve('typescript/bin/tsc');

const tsc = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json', '--listEmittedFiles'], {
  cwd: packageRoot,
  encoding: 'utf8',
});
const outputLines = tsc.stdout.split(/\r?\n/);
const diagnostics = outputLines.filter((line) => line && !line.startsWith('TSFILE: '));
if (diagnostics.length) console.log(diagnostics.join('\n'));
if (tsc.stderr) process.stderr.write(tsc.stderr);
// Con errores de tipos `tsc` igual emite (noEmitOnError está apagado, como
// antes); no se limpia nada y el próximo build exitoso se encarga de los restos.
if (tsc.status !== 0) process.exit(tsc.status ?? 1);

const emittedFiles = new Set(
  outputLines
    .filter((line) => line.startsWith('TSFILE: '))
    .map((line) => resolve(line.slice('TSFILE: '.length).trim())),
);

// Sin esto el build podría "pasar" sin haber emitido nada y la limpieza
// vaciaría `dist/`: el mismo hueco que este script existe para evitar.
if (
  !emittedFiles.has(join(distDir, 'index.js')) ||
  !emittedFiles.has(join(distDir, 'index.d.ts'))
) {
  console.error('build: tsc no reportó dist/index.js y dist/index.d.ts; no se toca dist/.');
  process.exit(1);
}

/** Borra los archivos de `dir` que no emitió este build; devuelve si quedó vacío. */
function removeStaleFiles(dir) {
  let remaining = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (removeStaleFiles(path)) rmdirSync(path);
      else remaining++;
    } else if (emittedFiles.has(path)) {
      remaining++;
    } else {
      rmSync(path);
      console.log(`build: borrado ${path.slice(packageRoot.length + 1)} (no lo emitió este build)`);
    }
  }
  return remaining === 0;
}

removeStaleFiles(distDir);
console.log(`build: ${emittedFiles.size} archivos emitidos en dist/`);
