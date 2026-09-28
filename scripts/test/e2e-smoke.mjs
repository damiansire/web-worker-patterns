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

import { chromium } from 'playwright';
import { BASE, readExampleIds, serveDist } from './serve-dist.mjs';

const exampleIds = readExampleIds('e2e-smoke');
const site = await serveDist('e2e-smoke', process.argv[2]);
const origin = site.origin;

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
  site.close();
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
