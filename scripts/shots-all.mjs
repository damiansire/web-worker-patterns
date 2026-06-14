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
const dir05 = `${dir}/05-error-handling`;
const dir06 = `${dir}/06-lifecycle-termination`;
const dir07 = `${dir}/07-transferable-objects`;
const dir08 = `${dir}/08-shared-worker`;
const dir09 = `${dir}/09-worker-limits`;
const dir10 = `${dir}/10-worker-pool`;
const dir11 = `${dir}/11-backpressure-scheduling`;
await rm(dir, { recursive: true, force: true });
await mkdir(dir03, { recursive: true });
await mkdir(dir04, { recursive: true });
await mkdir(dir05, { recursive: true });
await mkdir(dir06, { recursive: true });
await mkdir(dir07, { recursive: true });
await mkdir(dir08, { recursive: true });
await mkdir(dir09, { recursive: true });
await mkdir(dir10, { recursive: true });
await mkdir(dir11, { recursive: true });

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

  // Ejemplo 05: manejo de errores (un error en el worker no rompe la app).
  // Corremos OK → falla → OK de nuevo para mostrar que el worker sobrevive.
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/05-error-handling`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /json válido/i }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /json roto/i }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /json válido/i }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir05}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 06: ciclo de vida. Arrancamos la tarea y la cortamos a mitad para
  // capturar el estado 'terminated' (progreso congelado, trabajo perdido).
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/06-lifecycle-termination`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /iniciar/i }).first().click();
  await page.waitForTimeout(1900); // dejamos subir la barra ~5-6 pasos
  await page.getByRole('button', { name: /terminar|terminate/i }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir06}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 07: transferibles. Corremos transferir y clonar para capturar
  // ambos resultados (round-trip de cada uno + el buffer del main detached).
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/07-transferable-objects`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /transferir/i }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /clonar/i }).first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir07}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 08: SharedWorker. Sumamos en un panel para mostrar el contador
  // idéntico en los dos (un solo estado, varias conexiones).
  page = await ctx.newPage();
  // El SharedWorker mantiene conexiones vivas, así que 'networkidle' nunca llega:
  // usamos 'domcontentloaded' + una espera fija a que monte la demo.
  await page.goto(`${base}/t/${t}/example/08-shared-worker`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const plus = page.getByRole('button', { name: '+1', exact: true }).first();
  await plus.click();
  await page.waitForTimeout(250);
  await plus.click();
  await page.waitForTimeout(250);
  await plus.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir08}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 09: límites del paralelismo. Corremos la escala (1,2,4,8,16) y
  // esperamos a que terminen las 5 tandas para capturar la columna de tiempos.
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/09-worker-limits`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /correr (la )?escala|correr escala/i }).first().click();
  // la escala completa tarda ~2-4s según la máquina; esperamos con margen
  // y hasta que aparezca la última fila (32×).
  await page.getByText('32×').first().waitFor({ timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dir09}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 10: pool de workers. Arrancamos el drenado y capturamos a media cola
  // (el throttle del service deja ~3-4s de drenado; tiramos el shot a ~1.4s).
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/10-worker-pool`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /procesar (la )?cola/i }).first().click();
  await page.waitForTimeout(1400); // cola a medio drenar: slots ocupados + ✓ + pendientes
  await page.screenshot({ path: `${dir10}/${t}.png`, fullPage: true });
  await page.close();

  // Ejemplo 11: backpressure. Corremos los dos lados (sin/con control de flujo)
  // y capturamos los dos picos de cola enfrentados.
  page = await ctx.newPage();
  await page.goto(`${base}/t/${t}/example/11-backpressure-scheduling`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /disparar todo/i }).first().click();
  await page.waitForTimeout(2200); // deja drenar la cola naive
  await page.getByRole('button', { name: /control de flujo/i }).first().click();
  await page.waitForTimeout(2600); // deja drenar con backpressure
  await page.screenshot({ path: `${dir11}/${t}.png`, fullPage: true });
  await page.close();
  console.log('done', t);
}
await browser.close();
