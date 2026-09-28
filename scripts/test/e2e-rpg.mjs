// E2E del juego (theme rpg) en un navegador real, sobre el build de producción
// servido como en Pages. Juega de verdad: habla con cada vecino, recorre CADA
// camino de las 16 misiones con sus workers reales y verifica lo que un test
// unitario no puede ver.
//
//   - ninguna misión termina en "el ayudante falló";
//   - ninguna línea que llega a la pantalla pasa de 8 palabras;
//   - el texto cambia de idioma al aprender la palabra;
//   - la maestra toma examen recién con la región cumplida, y su sello abre el paso;
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

// Las maestras y el vocabulario también se leen del dominio.
const vocabularySource = readFileSync('src/app/core/domain/learning/vocabulary.ts', 'utf8');
const apiOf = Object.fromEntries(
  [...vocabularySource.matchAll(/\{ id: '([^']+)', api: '([^']+)' \}/g)].map(([, id, api]) => [
    id,
    api,
  ]),
);
const mastersSource = readFileSync('src/app/core/domain/learning/masters.ts', 'utf8');
const masters = [
  ...mastersSource.matchAll(/region: '([^']+)',\s+challenges: \[([\s\S]*?)\],\n  \}/g),
].map(([, region, body]) => ({
  region,
  answers: [...body.matchAll(/id: '([^']+)', answer: '([^']+)'/g)].map(([, id, answer]) => ({
    id,
    answer,
  })),
}));
if (masters.length !== 5 || masters.some((master) => master.answers.length !== 3)) {
  console.error(
    `✗ e2e-rpg: leí ${masters.length} maestras del dominio, esperaba 5 con 3 situaciones.`,
  );
  process.exit(1);
}

// Un texto del contenido puede leerse de dos maneras en pantalla, según lo aprendido.
const MARK = /\{([^{}|]+)\|([^{}|]+)(?:\|([^{}|]+))?\}/g;
const inPlain = (text) => text.replace(MARK, (_, plain) => plain);
const inApi = (text) => text.replace(MARK, (_, plain, id, shown) => shown ?? apiOf[id] ?? plain);
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Coincide con el texto tal como se lea hoy: en llano o ya aprendido. */
const either = (text) => new RegExp(`(${escapeRe(inPlain(text))}|${escapeRe(inApi(text))})$`);

// Un guardado con todo recorrido: cada camino de cada misión y los cinco sellos.
const fullProgress = JSON.stringify({
  version: 1,
  learned: Object.keys(apiOf),
  paths: Object.fromEntries(
    missions.map((mission) => [mission.exampleId, mission.paths.map((p) => p.id)]),
  ),
  stamps: masters.map((master) => master.region),
});

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

/** Abre una hoja (vecinos o Workerdex) desde la barra. */
async function openSheet(page, name) {
  await page
    .locator('.g-bar')
    .getByRole('button', { name: new RegExp(name) })
    .click();
  await page.waitForSelector('.g-sheet');
}

async function closeSheet(page) {
  await page.keyboard.press('Escape');
  await page.waitForSelector('.g-sheet', { state: 'detached' });
}

/** Las palabras que hay hoy en el Workerdex. */
async function learnedWords(page) {
  await openSheet(page, content.ui.dex);
  const found = await page.locator('.g-dex .g-term').allInnerTexts();
  await closeSheet(page);
  return found.map((text) => text.trim());
}

async function talkTo(page, exampleId) {
  const name = content.missions[exampleId].npc;
  await openSheet(page, content.ui.neighbors);
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
  await page.getByRole('button', { name: either(written.label) }).click();

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
  const failed = [inPlain(content.ui.failed), inApi(content.ui.failed)];
  assert(!said.some((text) => failed.includes(text)), `${where}: el camino falló ("${failed[0]}")`);
  assert(!said.some((text) => /\[[a-z]+\]/i.test(text)), `${where}: quedó un valor sin completar`);
  return said;
}

const only = process.env.WWP_ONLY;

async function check(name, run, contextOptions = {}) {
  if (only && !name.includes(only)) return;
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
  assert((await learnedWords(page)).length === 0, 'el Workerdex no arranca vacío');

  const said = await walkPath(page, '01-setinterval-counter', 'worker');
  assert(
    said.some((text) => text.includes('→')),
    'no anunció la palabra nueva',
  );
  assert(said.includes(inPlain(content.ui.missionDone)), 'cumplir la misión no tuvo su momento');
  await page.getByRole('button', { name: new RegExp(`${content.ui.bye}$`) }).click();
  const dex = await learnedWords(page);
  for (const word of ['worker', 'new Worker()']) {
    assert(dex.includes(word), `${word} no entró al Workerdex (hay: ${dex.join(', ')})`);
  }

  await talkTo(page, '01-setinterval-counter');
  const again = await hear(page, 'morph');
  assert(again.includes('worker'), `la relojera sigue hablando en llano: "${again}"`);
  assert(!again.includes('ayudante'), 'quedó el nombre llano junto al de la API');
  // El cambio es en todos lados: también en los botones.
  await page.getByRole('button', { name: content.ui.next, exact: true }).click();
  const labels = (await page.locator('.g-choices .g-btn').allInnerTexts()).join(' | ');
  assert(labels.includes('worker') && !labels.includes('ayudante'), `botones en llano: ${labels}`);
  await shot(page, '02-idioma-cambiado');
  return `"${again}"`;
});

await check(
  'el teclado nunca se muere: sin tocar el mouse se juega una misión entera',
  async (page) => {
    await open(page);
    // Villa Main: de (8,8) a la calle, a la izquierda hasta la columna 4 y arriba
    // hasta quedar frente a Main, que está en (4,3).
    const route = [...Array(3).fill('ArrowUp'), ...Array(4).fill('ArrowLeft'), 'ArrowUp'];
    for (const key of route) {
      await page.keyboard.press(key);
      await page.waitForTimeout(190);
    }
    await page.keyboard.press(' ');
    await page.waitForFunction(
      () => document.querySelector('.g-who')?.textContent?.trim() === 'Main',
    );
    await hear(page, 'teclado');
    await page.keyboard.press('Enter'); // saluda -> plantea
    await page.waitForSelector('.g-choices .g-key');
    await page.keyboard.press('1'); // el único camino de Main: bloquea de verdad
    await page
      .getByRole('button', { name: content.ui.next, exact: true })
      .waitFor({ timeout: 60_000 });
    // Todo lo que sigue se avanza con Espacio, hasta volver a las opciones.
    for (let i = 0; i < 12 && (await page.locator('.g-choices .g-key').count()) === 0; i++) {
      await hear(page, 'teclado');
      await page.keyboard.press(' ');
      await page.waitForTimeout(80);
    }
    assert(
      (await page.locator('.g-count').innerText()).trim() === '1/16',
      'la misión no se cumplió',
    );
    await page.keyboard.press('2'); // Chau
    await page.waitForTimeout(100);
    const before = await page.locator('.g-map').screenshot();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
    assert(
      !before.equals(await page.locator('.g-map').screenshot()),
      'después de conversar, las flechas no mueven',
    );
  },
);

async function talkToMaster(page) {
  await openSheet(page, content.ui.neighbors);
  await page.locator('.g-neighbors').getByRole('button', { name: content.ui.guard }).click();
  await page.waitForFunction(
    (who) => document.querySelector('.g-who')?.textContent?.trim().toLowerCase() === who,
    content.ui.guard.toLowerCase(),
    { timeout: 15_000 },
  );
}

await check(
  'la maestra da el sello con la región cumplida, y el sello abre el paso',
  async (page) => {
    await open(page);
    await talkToMaster(page);
    const locked = await hear(page, 'maestra');
    assert(locked.startsWith('Falta'), `la maestra no frena: "${locked}"`);
    await page.getByRole('button', { name: content.ui.next, exact: true }).click();

    const region = masters[0];
    for (const mission of missions.slice(0, 3)) {
      await talkTo(page, mission.exampleId);
      await advanceToChoices(page, 'maestra');
      for (const p of mission.paths.filter((candidate) => candidate.kind === 'pattern')) {
        await walkPath(page, mission.exampleId, p.id);
      }
      await page.getByRole('button', { name: new RegExp(`${content.ui.bye}$`) }).click();
    }
    assert(
      (await page.locator('.g-count').innerText()).trim() === '3/16',
      'el contador no dice 3/16',
    );

    // Con las misiones cumplidas y sin sello, la salida sigue tapada.
    const box = await page.locator('.g-map').boundingBox();
    const exit = { x: box.x + (15.5 / 16) * box.width, y: box.y + (5.5 / 10) * box.height };
    await page.mouse.click(exit.x, exit.y);
    await page.waitForTimeout(1_500);
    assert(
      (await page.locator('.g-region').innerText()).trim() === content.regions[region.region],
      'se pudo salir de la región sin el sello',
    );

    // Tocar la salida tapada no es un silencio: lleva a hablar con la maestra.
    assert(
      (await page.locator('.g-who').innerText()).trim().toLowerCase() ===
        content.ui.guard.toLowerCase(),
      'tocar la salida tapada no llevó a la maestra',
    );

    // Una respuesta equivocada no da el sello.
    await advanceToChoices(page, 'maestra');
    const wrong = page.locator('.g-choices .g-btn').filter({
      hasNotText: new RegExp(
        `(${escapeRe(apiOf[region.answers[0].answer])}|${escapeRe(content.vocab[region.answers[0].answer].plain)})$`,
      ),
    });
    await wrong.first().click();
    const scolded = await hear(page, 'maestra');
    assert(scolded.startsWith('No era esa'), `una respuesta mala pasó: "${scolded}"`);
    await page.getByRole('button', { name: content.ui.next, exact: true }).click();
    assert((await page.locator('.g-stamps .is-earned').count()) === 0, 'dio el sello con un error');

    // Tres aciertos, sello.
    await talkToMaster(page);
    await advanceToChoices(page, 'maestra');
    for (const { answer } of region.answers) {
      await hear(page, 'maestra');
      const label = `{${content.vocab[answer].plain}|${answer}}`;
      await page
        .locator('.g-choices')
        .getByRole('button', { name: either(label) })
        .click();
      await page.waitForTimeout(80);
    }
    const passed = await hear(page, 'maestra');
    assert(passed.includes(content.regions[region.region]), `no dio el sello: "${passed}"`);
    assert(
      (await page.locator('.g-stamps .is-earned').count()) === 1,
      'el sello no aparece en el HUD',
    );
    await shot(page, '03-sello');
    await page.getByRole('button', { name: content.ui.next, exact: true }).click();

    // Ahora sí: caminar hasta la salida cambia de región.
    await page.mouse.click(exit.x, exit.y);
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
      (await page.locator('.g-stamps .is-earned').count()) === 1,
      'el sello se perdió al recargar',
    );
    const where = (await page.locator('.g-region').innerText()).trim();
    assert(
      where === content.regions.communication,
      `al volver aparece en "${where}", no donde quedó trabajo`,
    );
    await shot(page, '04-region-dos');
  },
);

for (const size of [
  { name: 'escritorio', width: 1280, height: 720 },
  { name: 'teléfono', width: 390, height: 844 },
]) {
  await check(
    `entra en pantalla en ${size.name}, con el Workerdex lleno y una escena abierta`,
    async (page) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      // Un alumno que ya recorrió todo: el peor caso para el espacio.
      await page.addInitScript(
        (saved) => localStorage.setItem('wwp-progress', saved),
        fullProgress,
      );
      await open(page, 't/rpg/example/14-offscreen-canvas');
      const overflow = () =>
        page.evaluate(() => ({
          x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        }));
      const states = [['en reposo', await overflow()]];
      await openSheet(page, content.ui.dex);
      states.push(['Workerdex abierto', await overflow()]);
      await closeSheet(page);
      await talkTo(page, '14-offscreen-canvas');
      await advanceToChoices(page, 'pantalla');
      states.push(['escena y opciones', await overflow()]);
      await shot(page, `pantalla-${size.name}`);

      const spilled = states.filter(([, o]) => o.x > 0 || o.y > 0);
      assert(
        spilled.length === 0,
        spilled.map(([state, o]) => `${state}: +${o.x}px ancho, +${o.y}px alto`).join(' · '),
      );
      // La escena no tapa el mapa: vive dentro de la conversación.
      const covered = await page.evaluate(() => {
        const map = document.querySelector('.g-map').getBoundingClientRect();
        const scene = document.querySelector('.g-scene').getBoundingClientRect();
        return !(scene.top >= map.bottom || scene.bottom <= map.top);
      });
      assert(!covered, 'la escena se superpone con el mapa');
    },
  );
}

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

const EXPECTED = 7 + missions.length;
const failed = results.filter((result) => !result.ok);
if (only) {
  console.log(`\nCorrida parcial (WWP_ONLY=${only}): no cuenta como gate.`);
  process.exit(results.some((result) => !result.ok) ? 1 : 0);
}
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
