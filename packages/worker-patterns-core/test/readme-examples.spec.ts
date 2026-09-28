/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import readmeRaw from '../README.md?raw';

/**
 * Los bloques `ts` del README viven copiados tal cual en `test/readme-examples/`,
 * donde `npm run typecheck` los compila bajo `strict`. Este test asegura que la
 * copia no se desincronice: si alguien edita el README y no la copia (o al
 * reves), el type-check estaria validando un ejemplo que nadie lee.
 * (Se lee con `?raw`/`import.meta.glob` de Vite: el paquete no depende de @types/node).
 */
const normalize = (s: string): string => s.replace(/\r\n/g, '\n').trim();

const readme = readmeRaw.replace(/\r\n/g, '\n');
const readmeBlocks = [...readme.matchAll(/^```ts\n([\s\S]*?)^```$/gm)].map((m) => normalize(m[1]));
const exampleFiles = Object.values(
  import.meta.glob<string>('./readme-examples/*.ts', { query: '?raw', import: 'default', eager: true }),
).map(normalize);

describe('ejemplos del README', () => {
  it('hay ejemplos que chequear', () => {
    expect(readmeBlocks.length).toBeGreaterThan(0);
  });

  it('cada bloque ts del README tiene su copia exacta en test/readme-examples', () => {
    expect([...exampleFiles].sort()).toEqual([...readmeBlocks].sort());
  });
});
