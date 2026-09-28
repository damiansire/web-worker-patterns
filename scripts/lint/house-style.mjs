#!/usr/bin/env node
/**
 * Gate de estilo de la casa: ninguna raya larga (U+2014) en el repo.
 *
 * La regla existía escrita y el repo igual acumuló 168 en 56 archivos, 24 de ellas en
 * el texto que lee el alumno. Una regla que nadie verifica no es una regla: este script
 * la convierte en gate. Reemplazo habitual: punto, coma, paréntesis o dos puntos.
 *
 * Se auto-verifica (misma lección que boundaries.mjs): falla si revisó menos archivos
 * de los esperados, porque un gate que no mira nada pasa siempre.
 *
 * Correr con: `npm run lint:style`
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const EM_DASH = String.fromCharCode(0x2014);
const MIN_FILES = 100;
// Código de terceros vendorizado y binarios: no son texto nuestro.
const SKIP = [/^package-lock\.json$/, /^public\/coi-serviceworker\.js$/, /\.(png|ico|jpg|woff2?)$/];

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !SKIP.some((pattern) => pattern.test(file)));

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // borrado en el working tree pero todavía en el índice
  }
  text.split('\n').forEach((line, index) => {
    if (line.includes(EM_DASH)) {
      hits.push(`${file}:${index + 1}: ${line.trim().slice(0, 120)}`);
    }
  });
}

if (files.length < MIN_FILES) {
  console.error(
    `✗ house-style: revisé ${files.length} archivos (esperado >= ${MIN_FILES}). ` +
      'El gate no está mirando el repo: ¿corrió fuera de la raíz o sin git?',
  );
  process.exit(1);
}

if (hits.length > 0) {
  console.error(
    `✗ house-style: ${hits.length} raya(s) larga(s). Usá punto, coma, paréntesis o dos puntos:\n`,
  );
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`✓ house-style OK: ${files.length} archivos revisados, 0 rayas largas.`);
