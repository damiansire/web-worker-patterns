// @ts-check
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

/**
 * Config de ESLint (flat) que defiende los invariantes que el repo predica.
 *
 * Tres ejes, enganchados al gate (`scripts/test/guard-tests.mjs` corre build + tests;
 * el lint corre por `npm run lint`):
 *   1. no-console en el código de la "lib" (src/, fuera de scripts y specs): un repo
 *      didáctico no debería dejar console.* colado en producción.
 *   2. prefer OnPush: el repo es zoneless y predica OnPush; lo hacemos cumplir por lint
 *      (prefer-on-push-component-change-detection) para que no se vuelva a degradar.
 *   3. a11y de teclado en plantillas: todo lo clickeable tiene que ser operable por
 *      teclado y enfocable (click/mouse-events-have-key-events, interactive-supports-focus).
 */
export default tseslint.config(
  {
    // Solo el código de la app. Scripts (Node) y artefactos quedan fuera.
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // (1) sin console.* en la lib.
      'no-console': 'error',
      // (2) OnPush obligatorio: el repo es zoneless y lo predica.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      // Los selectores de cada theme usan su propio prefijo (narrative-, brutalist-,
      // editorial-, devtool-, fb-) a propósito: son familias de componentes por theme.
      // No imponemos un prefijo único — eso es decisión de diseño del repo, no un invariante.
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
    },
  },
  {
    // Plantillas (HTML externo + plantillas inline procesadas arriba).
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {
      // `x != null` es el chequeo idiomático de null-y-undefined a la vez; permitirlo.
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
      // (3) a11y de teclado: lo clickeable debe ser operable por teclado y enfocable.
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
      '@angular-eslint/template/valid-aria': 'error',
    },
  },
);
