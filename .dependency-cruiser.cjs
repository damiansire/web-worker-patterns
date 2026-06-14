/**
 * Lint de boundaries de la arquitectura multi-theme.
 *
 * Regla de oro (ver CLAUDE.md / ARQUITECTURA §2):
 *   `core/` es la capa neutral y NUNCA debe importar nada de `themes/`.
 *   La dependencia va en un solo sentido: themes -> core, jamás al revés.
 *
 * Correr con: `npm run lint:boundaries`
 */
module.exports = {
  forbidden: [
    {
      name: 'core-no-themes',
      severity: 'error',
      comment:
        'core/ es la capa neutral y no conoce los themes. Si necesitás importar ' +
        'algo de themes/ desde core/, está mal ubicado: probablemente pertenece a ' +
        'core/ o a un primitivo compartido por tokens (ver ARQUITECTURA §2).',
      from: { path: '^src/app/core/' },
      to: { path: '^src/app/themes/' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    // Seguir también imports type-only para que el límite no se evada con `import type`.
    tsPreCompilationDeps: true,
    exclude: { path: '(\\.spec\\.ts$|node_modules)' }
  }
};
