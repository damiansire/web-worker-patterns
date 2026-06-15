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

  it('tail latency: sin backpressure la última espera detrás de TODAS; con backpressure queda acotada', async () => {
    // Modelamos el costo del worker vía el reloj: el tiempo avanza COST por mensaje PROCESADO
    // (postear es gratis). Así la latencia mide lo que cada respuesta esperó en la cola.
    const COST = 10;
    let processed = 0;
    svc.clock = () => processed * COST;
    const f = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      terminated: false,
      postMessage(): void {
        queueMicrotask(() => {
          processed += 1; // el worker terminó de procesar uno
          this.onmessage?.({ data: { type: 'result' } } as MessageEvent);
        });
      },
      terminate(): void {
        this.terminated = true;
      },
    };
    const ex: WorkerExample = { ...example, workerFactory: () => f as unknown as Worker };

    svc.runNaive(ex, 1000);
    await waitUntilIdle(svc);
    processed = 0; // nueva tanda: reiniciamos el reloj de procesado
    svc.runBackpressure(ex, 1000);
    await waitUntilIdle(svc);

    // Sin control: la última de 40 esperó detrás de las 40 → total * costo.
    expect(svc.naiveMaxLatency()).toBe(svc.total * COST);
    // Con control: nunca esperó más que la ventana → window * costo.
    expect(svc.bpMaxLatency()).toBe(svc.windowSize * COST);
    expect(svc.naiveMaxLatency()!).toBeGreaterThan(svc.bpMaxLatency()!);
  });

  it('reset limpia los picos y las latencias', async () => {
    svc.runNaive(example, 1000);
    await waitUntilIdle(svc);
    svc.reset();
    expect(svc.naivePeak()).toBeNull();
    expect(svc.bpPeak()).toBeNull();
    expect(svc.naiveMaxLatency()).toBeNull();
    expect(svc.bpMaxLatency()).toBeNull();
    expect(svc.pending()).toBe(0);
  });
});
