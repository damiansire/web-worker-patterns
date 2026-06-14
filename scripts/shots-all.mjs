import { chromium } from 'playwright';
const base = 'http://localhost:4200';
const themes = ['brutalist', 'full-brutalist', 'dev-tool', 'editorial', 'narrative'];
const browser = await chromium.launch();
for (const t of themes) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await page.goto(`${base}/t/${t}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `docs/screenshots/${t}-home.png`, fullPage: true });
  await page.goto(`${base}/t/${t}/example/01-setinterval-counter`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  try {
    await page.getByRole('button', { name: /start|run|ejecutar/i }).first().click();
    await page.waitForTimeout(1600);
  } catch (e) { console.log('no start btn for', t); }
  await page.screenshot({ path: `docs/screenshots/${t}-counter.png`, fullPage: true });
  await page.close();
  console.log('done', t);
}
await browser.close();
