/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import pkgRaw from '../package.json?raw';
// Si el LICENSE del paquete no existe, este import hace fallar el archivo entero.
import licenseRaw from '../LICENSE?raw';

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
  it('build borra dist antes de compilar', () => {
    const build = pkg.scripts['build'] ?? '';
    const clean = build.indexOf('rmSync');
    expect(clean).toBeGreaterThanOrEqual(0);
    expect(build.indexOf('tsc')).toBeGreaterThan(clean);
  });

  it('prepublishOnly corre el type-check de test y README', () => {
    expect(pkg.scripts['typecheck']).toContain('tsconfig.test.json');
    expect(pkg.scripts['prepublishOnly']).toContain('typecheck');
  });
});
