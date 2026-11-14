// Regenera public/tarjeta-social.jpg: el mapa del juego, de día, a 1200x630 (la
// medida de og:image). Se captura en vez de dibujarse para que la tarjeta sea el
// juego tal cual; tarjeta.css solo saca lo que en una miniatura es ruido.
//
//   npm start -- --port 4204
//   node docs/tarjeta-social/capturar.mjs [url] [salida.jpg]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] ?? 'http://localhost:4204/t/default';
const output = process.argv[3] ?? join(here, '../../public/tarjeta-social.jpg');
const css = readFileSync(join(here, 'tarjeta.css'), 'utf8');

const browser = await chromium.launch();
try {
  // Sin service workers: el coi-serviceworker recarga la página para aislarla y
  // la recarga puede caer en el medio de la captura. El mapa no necesita aislamiento.
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  });
  // Que la captura no cuente como una visita (igual no cuenta: navigator.webdriver).
  await page.route(/goatcounter/, (route) => route.abort());
  await page.goto(url);

  // El mapa suele arrancar de noche (story-dawn): un toque lo despierta y amanece.
  // Si la página ya figura como tocada arranca de día y no hay nada que despertar.
  await page.locator('.sm').waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
  if (await page.locator('.sm.is-night').count()) {
    await page.mouse.click(600, 315);
  }
  await page.locator('.sm:not(.is-night)').waitFor({ timeout: 20000 });
  // El amanecer y la entrada de la medalla de jugar terminan de animarse.
  await page.waitForTimeout(5000);

  await page.addStyleTag({ content: css });
  // Al amanecer el foco va al cartel de jugar: sin el anillo de foco en la foto.
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(400);
  await page.screenshot({ path: output, type: 'jpeg', quality: 90 });
  console.log(`Listo: ${output}`);
} finally {
  await browser.close();
}
