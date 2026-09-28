// E2E del juego (theme rpg) en un navegador real, sobre el build de producción
// servido como en Pages. Juega de verdad: habla con cada vecino, recorre CADA
// camino de las 16 misiones con sus workers reales y verifica lo que un test
// unitario no puede ver.
//
//   - ninguna misión termina en "el ayudante falló";
//   - ninguna línea que llega a la pantalla pasa de 8 palabras;
//   - el texto cambia de idioma al aprender la palabra;
//   - el guardia abre el paso recién con la región cumplida;
//   - el progreso sobrevive a recargar.
//
// Uso: node scripts/test/e2e-rpg.mjs [distDir]
//   WWP_SHOTS=<carpeta> guarda capturas de cada región y de momentos clave.

import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveDist } from './serve-dist.mjs';

const MAX_WORDS = 8;
const shotsDir = process.env.WWP_SHOTS;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const content = JSON.parse(readFileSync('public/i18n/es.json', 'utf8')).learning;
const missionsSource = readFileSync('src/app/core/domain/learning/missions.ts', 'utf8');
// La estructura se lee del dominio: misión -> caminos, en el orden del recorrido.
const missions = [
  ...missionsSource.matchAll(/exampleId: '([^']+)',\s+paths: \[([\s\S]*?)\],\n  \}/g),
].map(([, exampleId, body]) => ({
  exampleId,
  paths: [...body.matchAll(/id: '([^']+)', kind: '(naive|pattern)'/g)].map(([, id, kind]) => ({
    id,
    kind,
  })),
}));
if (missions.length !== 16 || missions.some((mission) => mission.paths.length === 0)) {
  console.error(`✗ e2e-rpg: leí ${missions.length} misiones del dominio, esperaba 16 con caminos.`);
  process.exit(1);
}

const site = await serveDist('e2e-rpg', process.argv[2]);
const browser = await chromium.launch();
const results = [];
const spoken = [];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;

async function open(page, route = 't/rpg') {
  await page.goto(site.url(route), { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(1_500); // coi-serviceworker recarga una vez
  await page.waitForLoadState('load');
  await page.waitForSelector('.g-map', { timeout: 15_000 });
}

const line = (page) => page.locator('.g-line').innerText();

/** Lee lo que dice la caja de diálogo y lo anota para el chequeo de palabras. */
async function hear(page, where) {
  const text = (await line(page)).replace(/\s+/g, ' ').trim();
  spoken.push({ where, text, words: words(text) });
  return text;
}

/** Avanza con "Seguir" hasta que aparezcan opciones para elegir. */
async function advanceToChoices(page, where) {
  for (let i = 0; i < 12; i++) {
    await hear(page, where);
    if ((await page.locator('.g-choices .g-btn .g-key').count()) > 0) return;
    await page.getByRole('button', { name: content.ui.next, exact: true }).click();
    await page.waitForTimeout(60);
  }
  throw new Error(`${where}: la conversación no llegó a ofrecer opciones`);
}

async function talkTo(page, exampleId) {
  const name = content.missions[exampleId].npc;
  await page.locator('.g-neighbors').getByRole('button', { name, exact: true }).click();
  await page.waitForFunction(
    (npc) => document.querySelector('.g-who')?.textContent?.trim().toLowerCase() === npc,
    name.toLowerCase(),
    { timeout: 15_000 },
  );
}

/** Recorre un camino y devuelve todo lo que se dijo hasta volver a las opciones. */
async function walkPath(page, exampleId, pathId) {
  const written = content.missions[exampleId].paths[pathId];
  const where = `${exampleId}/${pathId}`;
  await page.getByRole('button', { name: new RegExp(`${written.label}$`) }).click();

  if (written.act) {
    const act = page.getByRole('button', { name: written.act, exact: true });
    await act.waitFor({ timeout: 15_000 });
    await page.waitForTimeout(900); // que la tarea avance unos pasos antes de cortarla
    await act.click();
  }
  // Terminó de correr cuando vuelve a haber un botón para seguir la conversación.
  await page
    .getByRole('button', { name: content.ui.next, exact: true })
    .waitFor({ timeout: 120_000 });

  const said = [];
  for (let i = 0; i < 12; i++) {
    const text = await hear(page, where);
    said.push(text);
    if ((await page.locator('.g-choices .g-btn .g-key').count()) > 0) break;
    await page.getByRole('button', { name: content.ui.next, exact: true }).click();
    await page.waitForTimeout(60);
  }
  assert(!said.includes(content.ui.failed), `${where}: el camino falló ("${content.ui.failed}")`);
  assert(!said.some((text) => /\[[a-z]+\]/i.test(text)), `${where}: quedó un valor sin completar`);
  return said;
}

async function check(name, run, contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ...contextOptions,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/404/.test(message.text())) errors.push(message.text());
  });
  try {
    const detail = await run(page);
    assert(errors.length === 0, `errores en consola: ${errors.slice(0, 3).join(' | ')}`);
    results.push({ name, ok: true });
    console.log(`✓ ${name}${detail ? `\n    ${detail}` : ''}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`✗ ${name}\n    ${String(error.message ?? error).split('\n')[0]}`);
    if (shotsDir) {
      await page
        .screenshot({ path: path.join(shotsDir, `falla-${results.length}.png`) })
        .catch(() => {});
    }
  } finally {
    await context.close();
  }
}

const shot = async (page, name) => {
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
};

await check('el juego arranca con el mapa dibujado y entra en una pantalla', async (page) => {
  await open(page);
  assert((await line(page)).trim() === content.ui.start, 'no está la línea de bienvenida');
  const painted = await page.evaluate(() => {
    const cv = document.querySelector('.g-map');
    const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4 * 97)
      colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    return colors.size;
  });
  assert(painted > 6, `el mapa tiene ${painted} colores: no se dibujó`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );
  assert(
    overflow <= 0,
    `la página scrollea ${overflow}px a 1280x720: el juego no entra en pantalla`,
  );
  await shot(page, '01-arranque');
});

await check('se camina con el teclado y no se atraviesan paredes', async (page) => {
  await open(page);
  await page.locator('.g-map').focus();
  const at = () =>
    page.evaluate(() => window.ng?.getComponent?.(document.querySelector('rpg-game')) ?? null);
  void at;
  // Villa Main: se arranca en (8,8), con camino libre hacia arriba hasta la calle (8,5).
  const before = await page.locator('.g-map').screenshot();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
  }
  const moved = await page.locator('.g-map').screenshot();
  assert(!before.equals(moved), 'el mapa no cambió después de caminar');
  // Contra el borde sur no hay por dónde: tres intentos dejan el mapa igual.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
  }
  const south = await page.locator('.g-map').screenshot();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
  }
  assert(south.equals(await page.locator('.g-map').screenshot()), 'caminó a través de una pared');
});

await check('el texto cambia de idioma al aprender la palabra', async (page) => {
  await open(page);
  await talkTo(page, '01-setinterval-counter');
  await advanceToChoices(page, 'morph');
  assert((await page.locator('.g-dex .g-term').count()) === 0, 'el Workerdex no arranca vacío');

  const said = await walkPath(page, '01-setinterval-counter', 'worker');
  assert(
    said.some((text) => text.includes('→')),
    'no anunció la palabra nueva',
  );
  assert(
    (await page.locator('.g-dex .g-term', { hasText: 'new Worker()' }).count()) === 1,
    'new Worker() no entró al Workerdex',
  );
  await page.getByRole('button', { name: new RegExp(`${content.ui.bye}$`) }).click();

  await talkTo(page, '01-setinterval-counter');
  const again = await hear(page, 'morph');
  assert(again.includes('new Worker()'), `la relojera sigue hablando en llano: "${again}"`);
  assert(!again.includes('un ayudante'), 'quedó el nombre llano junto al de la API');
  await shot(page, '02-idioma-cambiado');
  return `"${again}"`;
});

await check('el guardia abre el paso recién con la región cumplida', async (page) => {
  await open(page);
  const guard = page.locator('.g-neighbors').getByRole('button', { name: content.ui.guard });
  await guard.click();
  await page.waitForFunction(
    (who) => document.querySelector('.g-who')?.textContent?.trim().toLowerCase() === who,
    content.ui.guard.toLowerCase(),
  );
  const locked = await hear(page, 'guardia');
  assert(locked.startsWith('Falta'), `el guardia no frena: "${locked}"`);
  await page.getByRole('button', { name: content.ui.next, exact: true }).click();

  for (const mission of missions.slice(0, 3)) {
    await talkTo(page, mission.exampleId);
    await advanceToChoices(page, 'guardia');
    for (const p of mission.paths.filter((candidate) => candidate.kind === 'pattern')) {
      await walkPath(page, mission.exampleId, p.id);
    }
    await page.getByRole('button', { name: new RegExp(`${content.ui.bye}$`) }).click();
  }
  assert(
    (await page.locator('.g-count').innerText()).trim() === '3/16',
    'el contador no dice 3/16',
  );

  await guard.click();
  await page.waitForFunction(
    (who) => document.querySelector('.g-who')?.textContent?.trim().toLowerCase() === who,
    content.ui.guard.toLowerCase(),
  );
  const open_ = await hear(page, 'guardia');
  assert(open_.includes(content.regions.communication), `el guardia no abre: "${open_}"`);
  await page.getByRole('button', { name: content.ui.next, exact: true }).click();

  // Caminar hasta la salida cambia de región.
  await page.locator('.g-map').focus();
  const box = await page.locator('.g-map').boundingBox();
  await page.mouse.click(box.x + (15.5 / 16) * box.width, box.y + (5.5 / 10) * box.height);
  await page.waitForFunction(
    (name) => document.querySelector('.g-region')?.textContent?.trim() === name,
    content.regions.communication,
    { timeout: 15_000 },
  );

  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.g-map');
  await page.waitForTimeout(800);
  assert(
    (await page.locator('.g-count').innerText()).trim() === '3/16',
    'el progreso se perdió al recargar',
  );
  assert(
    (await page.locator('.g-region').innerText()).trim() === content.regions.communication,
    `al volver aparece en "${(await page.locator('.g-region').innerText()).trim()}", no en la región con trabajo pendiente`,
  );
  await shot(page, '03-region-dos');
});

for (const mission of missions) {
  const npc = content.missions[mission.exampleId].npc;
  await check(`${mission.exampleId} · ${npc}: todos sus caminos corren de verdad`, async (page) => {
    await open(page, `t/rpg/example/${mission.exampleId}`);
    await talkTo(page, mission.exampleId);
    await advanceToChoices(page, mission.exampleId);
    await shot(page, `mision-${mission.exampleId}`);
    const summary = [];
    for (const p of mission.paths) {
      const said = await walkPath(page, mission.exampleId, p.id);
      summary.push(`${p.id}: ${said[0]}`);
    }
    return summary.join(' · ');
  });
}

await browser.close();
site.close();

const over = spoken.filter((entry) => entry.words > MAX_WORDS);
if (over.length > 0) {
  console.log(
    `\n✗ presupuesto de palabras: ${over.length} líneas pasan de ${MAX_WORDS} en pantalla`,
  );
  for (const entry of over.slice(0, 10))
    console.log(`    ${entry.where} (${entry.words}): ${entry.text}`);
} else {
  console.log(
    `\n✓ presupuesto de palabras: ${spoken.length} líneas leídas en pantalla, ninguna pasa de ${MAX_WORDS}`,
  );
}

const EXPECTED = 4 + missions.length;
const failed = results.filter((result) => !result.ok);
if (results.length < EXPECTED || spoken.length < 100) {
  console.error(
    `\n✗ e2e-rpg: corrieron ${results.length} casos (esperaba ${EXPECTED}) y se leyeron ` +
      `${spoken.length} líneas (esperaba >= 100). El gate no verificó lo que dice verificar.`,
  );
  process.exit(1);
}
if (failed.length > 0 || over.length > 0) {
  console.error(`\n✗ e2e-rpg: ${failed.length} de ${results.length} casos fallaron.`);
  process.exit(1);
}
console.log(
  `✓ e2e-rpg: ${results.length} casos verdes, las 16 misiones jugadas en navegador real.`,
);
