import { readFileSync } from 'node:fs';
import { fill, LearningContent, spokenLines } from './content.model';
import { MASTERS } from './masters';
import { MISSIONS, REGIONS } from './missions';
import { unknownTerms, wordCount } from './morph';
import { VOCABULARY } from './vocabulary';

/**
 * Gate del contenido del juego. Las reglas de diseño que se pueden medir están
 * acá como tests, porque una regla escrita que nadie verifica vuelve a romperse:
 *   - como mucho 8 palabras en pantalla por línea de diálogo, 4 por botón;
 *   - ningún nombre de API aparece antes de haberse aprendido;
 *   - todo lo que la estructura promete tiene su texto, y nada sobra.
 */
const content = (
  JSON.parse(readFileSync('public/i18n/es.json', 'utf8')) as { learning: LearningContent }
).learning;

const MAX_LINE = 8;
const MAX_LABEL = 4;

/** Una línea con los valores medidos ya puestos: cada marca ocupa una palabra. */
const asShown = (text: string) => text.replace(/\[=?[a-z]+\]/gi, 'valor');

const lines: [where: string, text: string][] = [];
const labels: [where: string, text: string][] = [];
for (const [id, mission] of Object.entries(content.missions)) {
  lines.push(
    [`${id} hello`, mission.hello],
    [`${id} ask`, mission.ask],
    [`${id} done`, mission.done],
  );
  for (const [pathId, path] of Object.entries(mission.paths)) {
    labels.push([`${id} ${pathId} label`, path.label]);
    if (path.act) labels.push([`${id} ${pathId} act`, path.act]);
    spokenLines(path).forEach((text, i) => lines.push([`${id} ${pathId} #${i}`, text]));
  }
}
for (const [id, term] of Object.entries(content.vocab)) {
  lines.push([`vocab ${id} note`, term.note]);
}
for (const key of [
  'start',
  'startTouch',
  'startDone',
  'nobody',
  'missionDone',
  'guardLocked',
  'guardOpen',
  'failed',
  'restartAsk',
]) {
  lines.push([`ui ${key}`, content.ui[key]]);
}
for (const key of ['ready', 'wrong', 'missing', 'pass', 'final'] as const) {
  lines.push([`masters ${key}`, content.masters[key]]);
}
for (const [region, challenges] of Object.entries(content.masters.challenges)) {
  for (const [id, text] of Object.entries(challenges)) {
    lines.push([`masters ${region} ${id}`, text]);
  }
}

describe('contenido del juego: presupuesto de palabras', () => {
  it('el gate está mirando contenido de verdad', () => {
    expect(lines.length).toBeGreaterThan(120);
    expect(labels.length).toBeGreaterThan(20);
  });

  it(`ninguna línea de diálogo pasa de ${MAX_LINE} palabras`, () => {
    const over = lines
      .map(([where, text]) => [where, wordCount(asShown(text)), text] as const)
      .filter(([, count]) => count > MAX_LINE);

    expect(over).toEqual([]);
  });

  it(`ningún botón pasa de ${MAX_LABEL} palabras`, () => {
    const over = labels
      .map(([where, text]) => [where, wordCount(text), text] as const)
      .filter(([, count]) => count > MAX_LABEL);

    expect(over).toEqual([]);
  });
});

describe('contenido del juego: el Workerdex', () => {
  it('la nota de cada palabra entra en 5 palabras', () => {
    const over = Object.entries(content.vocab)
      .map(([id, term]) => [id, wordCount(term.note), term.note] as const)
      .filter(([, count]) => count > 5);

    expect(over).toEqual([]);
  });
});

describe('contenido del juego: coincide con la estructura', () => {
  it('cada misión y cada camino tienen su texto, y no hay texto de más', () => {
    expect(Object.keys(content.missions).sort()).toEqual(MISSIONS.map((m) => m.exampleId).sort());
    for (const mission of MISSIONS) {
      const written = Object.keys(content.missions[mission.exampleId].paths).sort();
      expect(written, mission.exampleId).toEqual(mission.paths.map((path) => path.id).sort());
    }
  });

  it('cada situación de cada maestra tiene su texto, y no hay texto de más', () => {
    for (const master of MASTERS) {
      const written = Object.keys(content.masters.challenges[master.region] ?? {}).sort();
      expect(written, master.region).toEqual(master.challenges.map((c) => c.id).sort());
    }
    expect(Object.keys(content.masters.challenges).sort()).toEqual([...REGIONS].sort());
  });

  it('cada término y cada región tienen su nombre', () => {
    expect(Object.keys(content.vocab).sort()).toEqual(VOCABULARY.map((term) => term.id).sort());
    expect(Object.keys(content.regions).sort()).toEqual([...REGIONS].sort());
  });

  it('las marcas de término apuntan a términos que existen', () => {
    const broken = lines.flatMap(([where, text]) => unknownTerms(text).map((id) => [where, id]));

    expect(broken).toEqual([]);
  });

  it('todo término que una misión enseña aparece nombrado en sus textos', () => {
    const missing: string[] = [];
    for (const mission of MISSIONS) {
      const written = content.missions[mission.exampleId];
      const text = [written.done, ...Object.values(written.paths).flatMap(spokenLines)].join(' ');
      for (const term of mission.paths.flatMap((path) => path.teaches)) {
        if (!text.includes(`|${term}}`)) missing.push(`${mission.exampleId}: ${term}`);
      }
    }

    expect(missing).toEqual([]);
  });
});

describe('contenido del juego: el idioma cambia solo al aprender', () => {
  it('ningún nombre de API está escrito fuera de su marca', () => {
    const leaks: string[] = [];
    for (const [where, text] of [...lines, ...labels]) {
      const outsideMarks = text.replace(/\{[^{}]+\}/g, ' ');
      for (const term of VOCABULARY) {
        // `worker` es también una palabra de otras APIs (SharedWorker): se busca entera.
        const api = new RegExp(`(^|[^a-z])${escape(term.api)}([^a-z]|$)`, 'i');
        if (api.test(outsideMarks)) {
          leaks.push(`${where}: "${term.api}"`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it('"ayudante" nunca queda suelto: aprendido, se lee worker en todos lados', () => {
    const loose = [...lines, ...labels]
      .filter(([, text]) => /ayudante/i.test(text.replace(/\{[^{}]+\}/g, ' ')))
      .map(([where]) => where);

    expect(loose).toEqual([]);
  });

  it('el nombre llano de un término no es su nombre de API', () => {
    for (const term of VOCABULARY) {
      expect(content.vocab[term.id].plain.toLowerCase(), term.id).not.toContain(
        term.api.toLowerCase(),
      );
    }
  });
});

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('fill', () => {
  it('completa las marcas con lo que midió la misión', () => {
    expect(fill('Contó [count] en [seg].', { count: '216.816', seg: '1,2 s' })).toBe(
      'Contó 216.816 en 1,2 s.',
    );
  });

  it('una marca sin valor queda a la vista, no desaparece', () => {
    expect(fill('Tardó [ms] ms.', {})).toBe('Tardó [ms] ms.');
  });

  it('un dato de la plataforma sale marcado como dato', () => {
    expect(fill('Volvió [=reply].', { reply: 'HOLA' })).toBe('Volvió {=HOLA}.');
    // Las llaves son la sintaxis de las marcas: un dato no puede traer las suyas.
    expect(fill('Volvió [=reply].', { reply: '{HOLA}' })).toBe('Volvió {=HOLA}.');
    expect(fill('Volvió [=reply].', {})).toBe('Volvió [=reply].');
  });

  it('no toca las marcas de término', () => {
    expect(fill('Es {la copia|structured-clone}.', { copia: 'x' })).toBe(
      'Es {la copia|structured-clone}.',
    );
  });
});
