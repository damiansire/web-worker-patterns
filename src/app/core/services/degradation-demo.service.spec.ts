import { TestBed } from '@angular/core/testing';
import { DegradationDemoService } from './degradation-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  terminated = false;
  posted: unknown[] = [];
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  result(count: number): void {
    this.onmessage?.({ data: { type: 'result', count } } as MessageEvent);
  }
}

describe('DegradationDemoService', () => {
  let svc: DegradationDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(DegradationDemoService);
    fake = new FakeWorker();
    t = 0;
    svc.clock = () => t;
    example = {
      id: '13-graceful-degradation',
      order: 13,
      category: 'advanced',
      i18nKey: 'examples.13-graceful-degradation',
      demo: 'degradation',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('expone el feature-detect de Worker', () => {
    expect(typeof svc.supported()).toBe('boolean');
  });

  it('camino worker: corre off-thread y reporta path = worker', () => {
    svc.supported.set(true);
    t = 100;
    svc.run(example, 500);
    expect(fake.posted[0]).toEqual({ command: 'compute', limit: 500 });
    expect(svc.running()).toBe(true);

    t = 140;
    fake.result(95);
    expect(svc.result()).toEqual({ value: 95, ms: 40, path: 'worker' });
    expect(svc.running()).toBe(false);
    expect(fake.terminated).toBe(true);
  });

  it('fallback forzado: corre en el main, mismo resultado, path = main', () => {
    svc.supported.set(true);
    svc.toggleFallback();
    expect(svc.forceFallback()).toBe(true);

    svc.run(example, 10); // countPrimesUpTo(10) = 4
    const r = svc.result();
    expect(r?.path).toBe('main');
    expect(r?.value).toBe(4);
    expect(fake.posted).toHaveLength(0); // no se usó el worker
  });

  it('si Worker no está soportado, cae al main aunque no se fuerce', () => {
    svc.supported.set(false);
    svc.run(example, 10);
    expect(svc.result()?.path).toBe('main');
    expect(svc.result()?.value).toBe(4);
  });

  it('reset limpia el resultado y el fallback', () => {
    svc.supported.set(true);
    svc.toggleFallback();
    svc.run(example, 10);
    svc.reset();
    expect(svc.result()).toBeNull();
    expect(svc.forceFallback()).toBe(false);
  });
});
