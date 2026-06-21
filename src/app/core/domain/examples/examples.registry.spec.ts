import { EXAMPLES, findExample } from './examples.registry';
import { DemoKind } from './example.model';

/**
 * El registry es el manifiesto que cruza dominio ↔ UI ↔ workers. Estos tests
 * blindan sus invariantes: sin ellos, un id duplicado, un order salteado o un
 * i18nKey desalineado pasa silencioso y rompe el ruteo o el contenido en runtime.
 */
describe('EXAMPLES registry', () => {
  it('los ids son únicos', () => {
    const ids = EXAMPLES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('los orders son únicos y consecutivos 1..N', () => {
    const orders = EXAMPLES.map((e) => e.order).sort((a, b) => a - b);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual(Array.from({ length: EXAMPLES.length }, (_, i) => i + 1));
  });

  it('cada i18nKey es `examples.<id>` (el contrato que consume ExampleContentService)', () => {
    for (const ex of EXAMPLES) {
      expect(ex.i18nKey).toBe(`examples.${ex.id}`);
    }
  });

  it('cada ejemplo con demo interactiva declara su fuente de worker', () => {
    // Los demos puramente conceptuales no necesitan worker (ej. 02-main-thread,
    // 13-graceful-degradation que cae al main). El resto, si tiene demo, debe
    // declarar workerFactory o sharedWorkerFactory.
    const needsWorker: DemoKind[] = [
      'message-exchange',
      'offload',
      'error-handling',
      'lifecycle',
      'transferable',
      'shared-worker',
      'worker-limits',
      'worker-pool',
      'backpressure',
      'shared-memory',
      'offscreen-canvas',
      'clone-cost',
      'compositor-jank',
      'thread-block',
    ];
    for (const ex of EXAMPLES) {
      if (ex.demo && needsWorker.includes(ex.demo)) {
        const hasSource = Boolean(ex.workerFactory) || Boolean(ex.sharedWorkerFactory);
        expect(hasSource, `${ex.id} (${ex.demo}) debería declarar un worker`).toBe(true);
      }
    }
  });

  it('findExample resuelve por id y devuelve undefined si no existe', () => {
    expect(findExample('01-setinterval-counter')?.order).toBe(1);
    expect(findExample('no-existe')).toBeUndefined();
  });
});
