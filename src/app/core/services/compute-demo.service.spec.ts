import { TestBed } from '@angular/core/testing';
import { ComputeDemoService } from './compute-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  posted: unknown[] = [];
  terminated = false;
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  result(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
  fail(message: string): void {
    this.onerror?.({ message });
  }
}

describe('ComputeDemoService', () => {
  let svc: ComputeDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ComputeDemoService);
    fake = new FakeWorker();
    t = 0;
    svc.clock = () => t;
    example = {
      id: '04-offloading-computation',
      order: 4,
      category: 'optimization',
      i18nKey: 'examples.04-offloading-computation',
      demo: 'offload',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('runMain computes on the main thread and records the result + time', () => {
    t = 100;
    svc.runMain(10);
    // entre el inicio y el set del resultado el reloj no avanza en el test, pero
    // el conteo real (división de prueba) sí corre:
    expect(svc.mainResult()).toMatchObject({ count: 4, limit: 10 });
    expect(svc.phase()).toBe('idle');
  });

  it('runWorker posts the compute command and records the worker result', () => {
    t = 100;
    svc.runWorker(example, 500);
    expect(fake.posted[0]).toEqual({ command: 'compute', limit: 500 });
    expect(svc.phase()).toBe('worker');

    t = 450;
    fake.result({ type: 'result', count: 95, limit: 500 });
    expect(svc.workerResult()).toEqual({ count: 95, ms: 350, limit: 500 });
    expect(svc.phase()).toBe('idle');
    expect(fake.terminated).toBe(true);
  });

  it('un fallo del worker (onerror) libera la fase y registra el error (no queda colgado en "worker")', () => {
    t = 100;
    svc.runWorker(example, 500);
    expect(svc.phase()).toBe('worker');

    fake.fail('boom');

    expect(svc.phase()).toBe('idle');
    expect(svc.error()).toBe('boom');
    expect(fake.terminated).toBe(true);
  });

  it('reset clears both results', () => {
    svc.runMain(10);
    svc.reset();
    expect(svc.mainResult()).toBeNull();
    expect(svc.workerResult()).toBeNull();
    expect(svc.liveMs()).toBe(0);
  });
});
