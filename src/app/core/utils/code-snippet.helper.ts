/**
 * Template tag that trims leading/trailing whitespace from a code snippet
 * and appends a trailing newline. Use in .snippets.ts files to keep code
 * readable without indentation artifacts.
 *
 * @example
 * import { code } from '../../core/utils/code-snippet.helper';
 * export const MY_SNIPPETS = { createWorker: code`const w = new Worker('w.js');` };
 */
export const code = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  `${String.raw(strings, ...values).trim()}\n`;
