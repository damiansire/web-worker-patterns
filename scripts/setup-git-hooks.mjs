#!/usr/bin/env node
/**
 * Activa los git hooks versionados del repo (harness-agnósticos): apunta core.hooksPath
 * a .githooks/, así el pre-commit corre sin importar el IDE/IA que use cada persona.
 *
 * Se ejecuta solo tras `npm install` (script "prepare") y también a mano con `npm run setup`.
 * Falla en silencio si no estamos en un repo git o en CI: nunca debe romper el install.
 */
import { execSync } from 'node:child_process';

const quiet = { stdio: 'ignore' };

// En CI no queremos tocar config local (los gates corren por el workflow).
if (process.env.CI) process.exit(0);

try {
  execSync('git rev-parse --is-inside-work-tree', quiet);
} catch {
  process.exit(0); // no es un repo git (p.ej. instalado como dependencia): nada que hacer.
}

try {
  execSync('git config core.hooksPath .githooks', quiet);
  console.log('✓ git hooks activados (core.hooksPath=.githooks). El pre-commit valida boundaries.');
} catch {
  // No romper el install por no poder escribir la config.
}
