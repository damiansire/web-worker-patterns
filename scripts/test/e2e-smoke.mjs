// E2E de humo del build de producción servido COMO LO SIRVE GITHUB PAGES: bajo un
// sub-path (/web-worker-patterns/), sin cabeceras propias y con 404.html como
// fallback de SPA.
//
// Existe porque los gates unitarios estaban verdes con producción rota: el loader
// de i18n pedía `/i18n/es.json` (absoluto, 404 bajo el sub-path) y la CSP bloqueaba
// el script inline que activa la hoja de estilos. Ninguno de los dos se ve sirviendo
// desde `/`, que es lo único que ejercitan `ng serve` y los tests.
//
// Falla (exit 1) si en la home o en cualquier ejemplo:
//   - hay un error de consola (incluye violaciones de CSP),
//   - un recurso del propio sitio responde >= 400,
//   - el título del ejemplo es su id crudo (el contenido educativo no cargó),
//   - la hoja de estilos quedó en media="print" (nunca se activó).
// Y se auto-verifica: falla si recorrió menos ejemplos que los del registry.
//
// Uso: node scripts/test/e2e-smoke.mjs [distDir]
//   distDir por defecto: dist/web-worker-patterns/browser, buildeado con
//   `npm run build -- --base-href /web-worker-patterns/`.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = '/web-worker-patterns/';
const distDir = path.resolve(process.argv[2] || 'dist/web-worker-patterns/browser');
const indexPath = path.join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`✗ e2e-smoke: no existe ${indexPath}. Corré el build con --base-href ${BASE}`);
  process.exit(1);
}
if (!readFileSync(indexPath, 'utf8').includes(`<base href="${BASE}"`)) {
  console.error(
    `✗ e2e-smoke: el build no tiene <base href="${BASE}">. Sin el sub-path este gate ` +
      `no reproduce Pages. Corré: npm run build -- --base-href ${BASE}`,
  );
  process.exit(1);
}

// La fuente de verdad de los ejemplos es el registry; se leen los ids del fuente
// para no mantener una segunda lista a mano.
const registry = readFileSync('src/app/core/domain/examples/examples.registry.ts', 'utf8');
const exampleIds = [...registry.matchAll(/^\s+id: '([^']+)',$/gm)].map((m) => m[1]);
if (exampleIds.length < 16) {
  console.error(`✗ e2e-smoke: leí ${exampleIds.length} ejemplos del registry, esperaba >= 16.`);
  process.exit(1);
}

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

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (!pathname.startsWith(BASE)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('fuera del sub-path');
    return;
  }
  const relative = decodeURIComponent(pathname.slice(BASE.length)) || 'index.html';
  const file = path.join(distDir, relative);
  if (file.startsWith(distDir) && existsSync(file) && path.extname(file)) {
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
    return;
  }
  // Igual que Pages: ruta desconocida => 404 con el index (deploy.yml copia
  // index.html a 404.html) y el router resuelve el deep-link.
  res.writeHead(404, { 'content-type': MIME['.html'] }).end(await readFile(indexPath));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const routes = [
  { name: 'home', url: `${origin}${BASE}`, exampleId: null },
  ...exampleIds.map((id) => ({
    name: id,
    url: `${origin}${BASE}t/default/example/${id}`,
    exampleId: id,
  })),
];

const browser = await chromium.launch();
const failures = [];
let checkedExamples = 0;

try {
  for (const route of routes) {
    const page = await browser.newPage();
    const problems = [];

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      // El 404 del documento en un deep-link es el fallback de SPA esperado (Pages
      // sirve 404.html); Chrome lo loguea como error de recurso. No es un defecto.
      if (route.exampleId && msg.location().url === route.url) return;
      problems.push(`consola: ${msg.text().slice(0, 200)}`);
    });
    page.on('pageerror', (err) => problems.push(`excepción: ${err.message.slice(0, 200)}`));
    page.on('response', (response) => {
      // El 404 del documento en un deep-link es el fallback de SPA esperado.
      const isDocument = response.request().resourceType() === 'document';
      if (response.status() >= 400 && !isDocument) {
        problems.push(`HTTP ${response.status()}: ${response.url().replace(origin, '')}`);
      }
    });

    // No se espera 'networkidle' a secas: el script de un SharedWorker (ej. 08) queda
    // como request en vuelo para Playwright y la red nunca "se calma". Se espera el
    // load, se le da un margen acotado a la red y después al <h1> ya renderizado.
    await page.goto(route.url, { waitUntil: 'load', timeout: 60_000 });
    // coi-serviceworker recarga la página una vez para quedar bajo el SW.
    await page.waitForTimeout(1_500);
    await page.waitForLoadState('load');
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    await page.waitForSelector('article h1, main h1', { timeout: 10_000 }).catch(() => {});

    const state = await page.evaluate(() => ({
      heading: document.querySelector('article h1, main h1')?.textContent?.trim() ?? '',
      printOnlySheets: [...document.querySelectorAll('link[rel="stylesheet"]')]
        .filter((link) => link.media === 'print')
        .map((link) => link.getAttribute('href')),
    }));

    if (route.exampleId) {
      checkedExamples += 1;
      if (!state.heading) problems.push('no hay <h1> en el ejemplo');
      if (state.heading === route.exampleId) {
        problems.push(`el título es el id crudo ("${state.heading}"): el contenido i18n no cargó`);
      }
    }
    if (state.printOnlySheets.length > 0) {
      problems.push(
        `hoja de estilos sin activar (media=print): ${state.printOnlySheets.join(', ')}`,
      );
    }

    const unique = [...new Set(problems)];
    if (unique.length > 0) failures.push({ route: route.name, problems: unique });
    console.log(`${unique.length === 0 ? '✓' : '✗'} ${route.name}`);
    for (const problem of unique) console.log(`    ${problem}`);

    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (checkedExamples < exampleIds.length) {
  console.error(
    `\n✗ e2e-smoke: recorrí ${checkedExamples} ejemplos de ${exampleIds.length}. ` +
      'El gate no verificó todo lo que dice verificar.',
  );
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`\n✗ e2e-smoke: ${failures.length} de ${routes.length} rutas con problemas.`);
  process.exit(1);
}

console.log(
  `\n✓ e2e-smoke: ${routes.length} rutas limpias bajo ${BASE} (${checkedExamples} ejemplos).`,
);
