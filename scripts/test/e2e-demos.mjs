// E2E de comportamiento: ejercita las demos en un navegador real, sobre el build de
// producción servido como en Pages. Cubre lo que un test unitario con workers falsos
// no puede ver: qué llega a PINTARSE, qué mide un worker de verdad y qué pasa cuando
// el script de un worker no carga.
//
// Cada caso nació de un bug real que los tests unitarios dejaban pasar:
//   04  el estado "CONGELADO" nunca se pintaba (cambio de estado y freeze en la misma tarea)
//   01  salir a mitad de corrida dejaba el botón deshabilitado para siempre
//   07  "transferir" medía el arranque del worker, no el envío del buffer
//   13  con el worker caído no había fallback: la demo quedaba sin resultado
//   --  con localStorage bloqueado la app no arrancaba
//
// Uso: node scripts/test/e2e-demos.mjs [distDir]

import { chromium } from 'playwright';
import { serveDist } from './serve-dist.mjs';

const site = await serveDist('e2e-demos', process.argv[2]);
const browser = await chromium.launch();
const results = [];

async function openExample(page, id) {
  await page.goto(site.url(`t/default/example/${id}`), { waitUntil: 'load', timeout: 60_000 });
  // coi-serviceworker recarga la página una vez para quedar bajo el SW.
  await page.waitForTimeout(1_500);
  await page.waitForLoadState('load');
  await page.waitForSelector('article h1', { timeout: 10_000 });
}

async function check(name, run, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  try {
    const detail = await run(page);
    results.push({ name, ok: true });
    console.log(`✓ ${name}${detail ? `\n    ${detail}` : ''}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`✗ ${name}\n    ${String(error.message ?? error).split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

// Con el service worker activo, los pedidos los hace el SW y `page.route` no los ve.
// Los casos que interceptan red corren sin él.
const SIN_SERVICE_WORKER = { serviceWorkers: 'block' };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await check('04 · el estado CONGELADO se pinta antes de que el main se bloquee', async (page) => {
  await openExample(page, '04-offloading-computation');
  await page.evaluate(() => {
    const probe = { frozenSeenAt: null, renderedAt: null, longTasks: [] };
    window.__probe = probe;
    new MutationObserver(() => {
      const status = document.querySelector('.e-pat-st');
      if (probe.frozenSeenAt !== null || !status?.textContent.includes('CONGELADO')) {
        return;
      }
      probe.frozenSeenAt = performance.now();
      // Un ResizeObserver recién enganchado avisa en el próximo "update the rendering",
      // después de los rAF y del layout y justo antes del pintado. Sirve de testigo de
      // que el navegador llegó a renderizar con el estado nuevo. Un rAF no sirve: si el
      // cambio de estado ocurre dentro de la fase de rAF, el rAF testigo cae en el
      // frame siguiente aunque este frame sí se pinte.
      new ResizeObserver(() => {
        probe.renderedAt ??= performance.now();
      }).observe(status);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        probe.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ entryTypes: ['longtask'] });
  });

  await page.fill('#e-n', '3000000');
  await page.getByRole('button', { name: 'Que lo haga el main' }).click();
  await page.waitForFunction(() => window.__probe.longTasks.some((t) => t.duration > 150), {
    timeout: 30_000,
  });

  const probe = await page.evaluate(() => window.__probe);
  const freeze = probe.longTasks.reduce((a, b) => (b.duration > a.duration ? b : a));
  assert(probe.frozenSeenAt !== null, 'el texto CONGELADO nunca apareció en el DOM');
  assert(
    probe.frozenSeenAt < freeze.start,
    `CONGELADO entró al DOM en ${probe.frozenSeenAt.toFixed(0)}ms, DESPUÉS de que arrancó ` +
      `el freeze (${freeze.start.toFixed(0)}ms): nunca se vio`,
  );
  assert(
    probe.renderedAt !== null && probe.renderedAt <= freeze.start,
    'el navegador no llegó a renderizar entre el cambio de estado y el freeze',
  );
  return `freeze de ${freeze.duration.toFixed(0)}ms, renderizado ${(freeze.start - probe.renderedAt).toFixed(0)}ms antes`;
});

await check('01 · salir a mitad de corrida no deja el botón trabado', async (page) => {
  await openExample(page, '01-setinterval-counter');
  const run = page.getByRole('button', { name: 'Ejecutar en worker' });
  await run.click();
  await page.waitForTimeout(700); // la corrida dura 2,5s: salimos en el medio
  assert(await run.isDisabled(), 'precondición: el botón debería estar deshabilitado en vuelo');

  await page.getByRole('link', { name: /índice/ }).click();
  await page.waitForURL((url) => !url.pathname.includes('/example/'));
  await page.goBack();
  await page.waitForSelector('article h1');

  const again = page.getByRole('button', { name: 'Ejecutar en worker' });
  assert(await again.isEnabled(), 'al volver, "Ejecutar en worker" sigue deshabilitado');
});

await check('07 · transferir mide menos que clonar (ida y vuelta real)', async (page) => {
  await openExample(page, '07-transferable-objects');
  const readMs = async (heading) => {
    const column = page.locator('section.e-col', { hasText: heading });
    const text = await column.locator('p.e-foot', { hasText: 'round-trip' }).first().innerText();
    return Number(text.match(/round-trip ([\d.]+) ms/)?.[1]);
  };

  // Transferir PRIMERO y en frío: es el caso que antes salía igual o peor que clonar,
  // porque el número incluía bajar y arrancar el worker.
  await page.getByRole('button', { name: 'Transferir buffer' }).click();
  await page.waitForSelector('text=quedó detached', { timeout: 30_000 });
  const transferMs = await readMs('Transferir');

  await page.getByRole('button', { name: 'Clonar buffer' }).click();
  await page.waitForSelector('text=conserva su copia', { timeout: 30_000 });
  const cloneMs = await readMs('Clonar');

  assert(Number.isFinite(transferMs) && Number.isFinite(cloneMs), 'no pude leer los ms');
  assert(
    transferMs < cloneMs,
    `transferir (${transferMs}ms) no fue más rápido que clonar (${cloneMs}ms)`,
  );
  return `transferir ${transferMs}ms · clonar ${cloneMs}ms (64 MB)`;
});

await check(
  '13 · si el worker no carga, degrada al main con el mismo resultado',
  async (page) => {
    await openExample(page, '13-graceful-degradation');
    // El script del worker no llega (deploy viejo, CSP, red): `typeof Worker` sigue en true.
    let blocked = 0;
    await page.route(/\/worker-[^/]+\.js$/, (route) => {
      blocked += 1;
      return route.abort();
    });
    await page.getByRole('button', { name: 'Procesar' }).click();
    await page.waitForSelector('text=Fallback: corrió en el main', { timeout: 30_000 });
    // Sin esto el caso pasaría en falso si el worker hubiera cargado igual.
    assert(blocked > 0, 'el pedido del worker no pasó por el bloqueo: el caso no probó nada');
  },
  SIN_SERVICE_WORKER,
);

await check('app · arranca con localStorage bloqueado', async (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      },
    });
  });
  await page.goto(site.url(), { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('main h1', { timeout: 10_000 });
  assert(errors.length === 0, `excepciones al arrancar: ${errors.join(' | ')}`);
});

await browser.close();
site.close();

const EXPECTED_CHECKS = 5;
if (results.length < EXPECTED_CHECKS) {
  console.error(`\n✗ e2e-demos: corrieron ${results.length} casos, esperaba ${EXPECTED_CHECKS}.`);
  process.exit(1);
}
const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`\n✗ e2e-demos: ${failed.length} de ${results.length} casos fallaron.`);
  process.exit(1);
}
console.log(`\n✓ e2e-demos: ${results.length} casos verdes en navegador real.`);
