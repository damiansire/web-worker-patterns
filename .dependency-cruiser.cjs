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
    },
    {
      name: 'contracts-no-themes-ni-primitives',
      severity: 'error',
      comment:
        'ui-contracts/ es la capa neutral de contratos (la API que los themes ' +
        'implementan). Sólo puede mirar hacia core/. Si importa de themes/ o de ' +
        'ui-primitives/, la dependencia quedó al revés: el contrato no debe conocer ' +
        'a sus implementaciones (estilo Taiga: kit -> core -> cdk, nunca al revés).',
      from: { path: '^src/app/ui-contracts/' },
      to: { path: '^src/app/(themes|ui-primitives)/' }
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
