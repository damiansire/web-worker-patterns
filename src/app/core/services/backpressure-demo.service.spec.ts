import { TestBed } from '@angular/core/testing';
import { BackpressureDemoService } from './backpressure-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  terminated = false;
  posted = 0;
  postMessage(): void {
    this.posted += 1;
    // Ack ASÍNCRONO (microtask): así el productor naive alcanza a disparar todo
    // antes de que llegue el primer ack (la cola se infla de verdad).
    queueMicrotask(() => this.onmessage?.({ data: { type: 'result' } } as MessageEvent));
  }
  terminate(): void {
    this.terminated = true;
  }
}

async function waitUntilIdle(svc: BackpressureDemoService): Promise<void> {
  for (let i = 0; i < 2000 && svc.mode() !== 'idle'; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe('BackpressureDemoService', () => {
  let svc: BackpressureDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(BackpressureDemoService);
    fake = new FakeWorker();
    example = {
      id: '11-backpressure-scheduling',
      order: 11,
      category: 'advanced',
      i18nKey: 'examples.11-backpressure-scheduling',
      demo: 'backpressure',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('sin backpressure: la cola se infla hasta el total', async () => {
    svc.runNaive(example, 1000);
    // dispara TODO de una, antes de cualquier ack.
    expect(svc.pending()).toBe(svc.total);
    await waitUntilIdle(svc);
    expect(svc.naivePeak()).toBe(svc.total); // pico = total
    expect(fake.posted).toBe(svc.total);
  });

  it('con backpressure: la cola nunca pasa de la ventana', async () => {
    svc.runBackpressure(example, 1000);
    expect(svc.pending()).toBe(svc.windowSize); // arranca con la ventana de crédito
    await waitUntilIdle(svc);
    expect(svc.bpPeak()).toBe(svc.windowSize); // pico acotado a la ventana
    expect(fake.posted).toBe(svc.total); // igual procesó todo
  });

  it('el pico con backpressure es mucho menor que sin', async () => {
    svc.runNaive(example, 1000);
    await waitUntilIdle(svc);
    svc.runBackpressure(example, 1000);
    await waitUntilIdle(svc);
    expect(svc.bpPeak()!).toBeLessThan(svc.naivePeak()!);
  });

  it('reset limpia los picos', async () => {
    svc.runNaive(example, 1000);
    await waitUntilIdle(svc);
    svc.reset();
    expect(svc.naivePeak()).toBeNull();
    expect(svc.bpPeak()).toBeNull();
    expect(svc.pending()).toBe(0);
  });
});
