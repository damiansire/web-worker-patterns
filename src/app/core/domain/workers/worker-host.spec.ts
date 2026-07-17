import { WorkerHost } from './worker-host';
import { WorkerExample } from '../examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  posted: unknown[] = [];
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
}

function example(id: string, factory?: () => FakeWorker): WorkerExample {
  return {
    id,
    order: 1,
    category: 'communication',
    i18nKey: `examples.${id}`,
    workerFactory: factory ? () => factory() as unknown as Worker : undefined,
    snippets: {},
  };
}

describe('WorkerHost', () => {
  it('open es idempotente para el mismo id: no crea un worker nuevo', () => {
    const created: FakeWorker[] = [];
    const ex = example('a', () => {
      const w = new FakeWorker();
      created.push(w);
      return w;
    });
    const host = new WorkerHost();
    const noop = { onMessage: () => {}, onError: () => {} };

    host.open(ex, noop);
    host.open(ex, noop); // mismo id → no-op
    expect(created).toHaveLength(1);
    expect(host.isOpen).toBe(true);
  });

  it('open con otro id cierra el anterior y abre uno nuevo', () => {
    const created: FakeWorker[] = [];
    const mk = (id: string) =>
      example(id, () => {
        const w = new FakeWorker();
        created.push(w);
        return w;
      });
    const host = new WorkerHost();
    const noop = { onMessage: () => {}, onError: () => {} };

    host.open(mk('a'), noop);
    host.open(mk('b'), noop);
    expect(created).toHaveLength(2);
    expect(created[0].terminated).toBe(true); // el anterior se terminó
  });

  it('sin workerFactory: cierra lo previo y queda sin worker', () => {
    const created: FakeWorker[] = [];
    const host = new WorkerHost();
    const noop = { onMessage: () => {}, onError: () => {} };
    host.open(
      example('a', () => {
        const w = new FakeWorker();
        created.push(w);
        return w;
      }),
      noop,
    );
    host.open(example('b'), noop); // sin factory
    expect(created[0].terminated).toBe(true);
    expect(host.isOpen).toBe(false);
  });

  it('cablea onMessage y un onerror que ya hace preventDefault y pasa el mensaje', () => {
    let w!: FakeWorker;
    const host = new WorkerHost();
    const messages: unknown[] = [];
    const errors: string[] = [];
    host.open(
      example('a', () => (w = new FakeWorker())),
      { onMessage: (d) => messages.push(d), onError: (m) => errors.push(m) },
    );

    w.onmessage?.({ data: { hello: 1 } } as MessageEvent);
    expect(messages).toEqual([{ hello: 1 }]);

    let prevented = false;
    w.onerror?.({ message: 'boom', preventDefault: () => (prevented = true) });
    expect(prevented).toBe(true);
    expect(errors).toEqual(['boom']);
  });

  it('post envía al worker abierto y es no-op tras close', () => {
    let w!: FakeWorker;
    const host = new WorkerHost();
    host.open(
      example('a', () => (w = new FakeWorker())),
      { onMessage: () => {}, onError: () => {} },
    );
    host.post({ cmd: 'x' });
    expect(w.posted).toEqual([{ cmd: 'x' }]);

    host.close();
    expect(w.terminated).toBe(true);
    expect(host.isOpen).toBe(false);
    host.post({ cmd: 'y' }); // no-op, no tira
    expect(w.posted).toEqual([{ cmd: 'x' }]);
  });
});
