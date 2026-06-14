import { chromium } from 'playwright';
const base = 'http://localhost:4200';
const themes = process.argv.slice(2);
const browser = await chromium.launch();
for (const t of themes) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
  await page.goto(`${base}/t/${t}/example/01-setinterval-counter`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /(correr|ejecutar).*en worker/i }).click();
  await page.waitForTimeout(3200); // worker run completes
  await page.getByRole('button', { name: /bloquear main/i }).click().catch(() => {});
  await page.waitForTimeout(800); // after the freeze
  await page.screenshot({ path: `docs/screenshots/${t}-counter.png`, fullPage: true });
  await page.close();
  console.log('done', t);
}
await browser.close();
