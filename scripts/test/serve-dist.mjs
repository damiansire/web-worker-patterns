// Sirve el build de producción COMO LO SIRVE GITHUB PAGES: bajo un sub-path, sin
// cabeceras propias y con el index como respuesta 404 de cualquier ruta desconocida
// (deploy.yml copia index.html a 404.html para que el router resuelva el deep-link).
// Lo comparten los e2e (`e2e-smoke.mjs`, `e2e-demos.mjs`).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const BASE = '/web-worker-patterns/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

/**
 * Levanta el server en un puerto libre. Sale con exit 1 si el build no existe o no
 * fue hecho con el sub-path: sin eso el e2e no reproduce producción y pasaría en falso.
 */
export async function serveDist(gate, distArg) {
  const distDir = path.resolve(distArg || 'dist/web-worker-patterns/browser');
  const indexPath = path.join(distDir, 'index.html');

  if (!existsSync(indexPath)) {
    console.error(`✗ ${gate}: no existe ${indexPath}. Corré el build con --base-href ${BASE}`);
    process.exit(1);
  }
  if (!readFileSync(indexPath, 'utf8').includes(`<base href="${BASE}"`)) {
    console.error(
      `✗ ${gate}: el build no tiene <base href="${BASE}">. Sin el sub-path este gate ` +
        `no reproduce Pages. Corré: npm run build -- --base-href ${BASE}`,
    );
    process.exit(1);
  }

  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (!pathname.startsWith(BASE)) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('fuera del sub-path');
      return;
    }
    const relative = decodeURIComponent(pathname.slice(BASE.length)) || 'index.html';
    const file = path.join(distDir, relative);
    if (file.startsWith(distDir) && existsSync(file) && path.extname(file)) {
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      });
      res.end(await readFile(file));
      return;
    }
    res.writeHead(404, { 'content-type': MIME['.html'] }).end(await readFile(indexPath));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, url: (route = '') => `${origin}${BASE}${route}`, close: () => server.close() };
}

/** Ids de los ejemplos, leídos del registry (la fuente de verdad, no una lista a mano). */
export function readExampleIds(gate) {
  const registry = readFileSync('src/app/core/domain/examples/examples.registry.ts', 'utf8');
  const ids = [...registry.matchAll(/^\s+id: '([^']+)',$/gm)].map((m) => m[1]);
  if (ids.length < 16) {
    console.error(`✗ ${gate}: leí ${ids.length} ejemplos del registry, esperaba >= 16.`);
    process.exit(1);
  }
  return ids;
}
