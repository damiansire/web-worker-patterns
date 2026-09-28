/**
 * Tipado ambiental mínimo de `node:fs`, solo lo que usa `content.spec.ts` para leer
 * el contenido real del juego desde `public/i18n/es.json`. Mismo criterio que
 * `workers/node-worker-threads.d.ts`: no se suma `@types/node` por una función.
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}
