/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import pkgRaw from '../package.json?raw';
// Si el LICENSE del paquete no existe, este import hace fallar el archivo entero.
import licenseRaw from '../LICENSE?raw';
import buildScriptRaw from '../scripts/build.mjs?raw';

// Se leen con `?raw` de Vite: el paquete no depende de @types/node.
const pkg = JSON.parse(pkgRaw) as {
  license: string;
  files: string[];
  scripts: Record<string, string>;
};

describe('packaging', () => {
  it('el tarball lleva el LICENSE que declara `license`', () => {
    expect(pkg.license).toBe('MIT');
    expect(licenseRaw).toMatch(/^MIT License/);
    expect(pkg.files).toContain('LICENSE');
  });

  // Sin limpiar, un modulo renombrado dejaba su .js/.d.ts viejo dentro de dist/.
  // Pero borrar dist/ entero antes de `tsc` dejaba un hueco en el que `ng serve`
  // no encontraba el paquete (TS2307): se limpia despues, solo lo no emitido.
  it('build limpia lo que tsc no emitio, sin vaciar dist antes de compilar', () => {
    expect(pkg.scripts['build']).toBe('node scripts/build.mjs');
    expect(buildScriptRaw).toContain('--listEmittedFiles');
    expect(buildScriptRaw).toMatch(/emittedFiles\.has\(path\)/);
    expect(buildScriptRaw).not.toMatch(/rmSync\(\s*distDir/);
    expect(buildScriptRaw.indexOf('removeStaleFiles(distDir)')).toBeGreaterThan(
      buildScriptRaw.indexOf('spawnSync('),
    );
  });

  it('prepublishOnly corre el type-check de test y README', () => {
    expect(pkg.scripts['typecheck']).toContain('tsconfig.test.json');
    expect(pkg.scripts['prepublishOnly']).toContain('typecheck');
  });
});
