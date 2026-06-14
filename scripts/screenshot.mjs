/**
 * Captura de pantalla para verificación visual con el dev server corriendo.
 *
 *   node scripts/screenshot.mjs <ruta> [out.png] [textoBotonAClickear]
 *
 * Ej:  node scripts/screenshot.mjs /t/brutalist/example/01-setinterval-counter shot.png Start
 *
 * Requiere `npm i -D playwright` + `npx playwright install chromium`.
 */
import { chromium } from 'playwright';

const path = process.argv[2] ?? '/t/brutalist';
const out = process.argv[3] ?? 'scripts/screenshot.png';
const click = process.argv[4];
const base = process.env.BASE_URL ?? 'http://localhost:4200';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
if (click) {
  await page.getByRole('button', { name: click }).first().click();
  await page.waitForTimeout(1600);
}
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out);
