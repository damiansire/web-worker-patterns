import { chromium } from 'playwright';
import { rm, mkdir } from 'node:fs/promises';

const base = 'http://localhost:4200';
const themes = ['brutalist', 'full-brutalist', 'dev-tool', 'editorial', 'narrative'];

// Reemplazo limpio: borrar las capturas viejas y recrear la carpeta desde cero,
// así no quedan archivos huérfanos si cambian los themes/nombres.
// Cada ejemplo interactivo va en su propia subcarpeta.
const dir = 'docs/screenshots';
const dir03 = `${dir}/03-basic-communication`;
const dir04 = `${dir}/04-offloading-computation`;
await rm(dir, { recursive: true, force: true });
await mkdir(dir03, { recursive: true });
await mkdir(dir04, { recursive: true });

const browser = await chromium.launch();
// Fijamos idioma para capturas consistentes (el usuario escribe en español).
const ctx = await browser.newContext({ viewport: { width: 1100, height: 1400 } });
await ctx.addInitScript(() => localStorage.setItem('wwp-language', 'es'));
for (const t of themes) {
  let page = await ctx.newPage();
  await page.goto(`${base}/t/${t}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `docs/screenshots/${t}-home.png`, fullPage: true });
  await page.close();

  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/01-setinterval-counter`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /(correr|ejecutar).*en worker/i }).first().click();
  await page.waitForTimeout(3200);
  await page.getByRole('button', { name: /bloquear main/i }).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `docs/screenshots/${t}-counter.png`, fullPage: true });
  await page.close();

  // Ejemplo 03: comunicación bidireccional (mandamos unos mensajes).
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/03-basic-communication`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  for (const text of ['hola', 'web worker', 'comunicacion bidireccional']) {
    await page.locator('input').first().fill(text);
    await page.getByRole('button', { name: /enviar/i }).first().click();
    await page.waitForTimeout(650);
  }
  await page.screenshot({ path: `${dir03}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 04: descargar cómputo pesado (worker no congela vs main congela).
  // Corremos los dos lados para capturar ambos resultados enfrentados.
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/04-offloading-computation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /(calcular|correr).*en worker/i }).first().click();
  await page.waitForTimeout(1500); // deja terminar el worker y asentar el resultado
  await page.getByRole('button', { name: /(calcular en el main|bloquear main)/i }).first().click();
  await page.waitForTimeout(1200); // el main congela y termina; el screenshot va después
  await page.screenshot({ path: `${dir04}/${t}.png`, fullPage: true });
  await page.close();
  console.log('done', t);
}
await browser.close();
