// E2E de humo: verifica que el demo desplegado quede cross-origin-isolated,
// que es la condición dura para que el ejemplo 12 (SharedArrayBuffer + Atomics)
// corra de verdad en vez de caer al backend simulado.
//
// Falla (exit 1) si `crossOriginIsolated !== true`. Es el gate que convierte el
// claim del README ("el shim habilita el ejemplo 12 en Pages") en algo medido.
//
// Uso: node scripts/test/e2e-coi.mjs [url]
//   url por defecto: el demo público en GitHub Pages.
//
// Requiere Playwright (`playwright`) instalado con el navegador chromium. El
// workflow .github/workflows/e2e-coi.yml lo instala on-demand.

import { chromium } from 'playwright';

const url = process.argv[2] || 'https://damiansire.github.io/web-worker-patterns/';

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage();

  // Primera carga: registra el service worker (coi-serviceworker) que agrega
  // COOP/COEP client-side. En la primera visita el SW aún no controla la página.
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

  // El shim hace UNA recarga controlada para quedar bajo el SW; le damos margen
  // y forzamos un reload para asegurar que la página final venga aislada.
  await page.waitForTimeout(3_000);
  await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(1_500);

  const isolated = await page.evaluate(() => globalThis.crossOriginIsolated === true);
  const hasSAB = await page.evaluate(() => typeof SharedArrayBuffer !== 'undefined');

  if (isolated && hasSAB) {
    console.log(`OK · crossOriginIsolated=true y SharedArrayBuffer disponible en ${url}`);
  } else {
    failed = true;
    console.error(
      `FALLO · ${url} no quedó aislado: crossOriginIsolated=${isolated}, SharedArrayBuffer=${hasSAB}. ` +
        'El ejemplo 12 correría en modo simulado. Revisá el shim coi-serviceworker y el deploy.',
    );
  }
} finally {
  await browser.close();
}

process.exit(failed ? 1 : 0);
