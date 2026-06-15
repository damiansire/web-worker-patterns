import { TestBed } from '@angular/core/testing';
import { CompositorDemoService } from './compositor-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
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
}

describe('CompositorDemoService', () => {
  let svc: CompositorDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CompositorDemoService);
    fake = new FakeWorker();
    example = {
      id: '16-compositor-vs-main',
      order: 16,
      category: 'understanding',
      i18nKey: 'examples.16-compositor-vs-main',
      demo: 'compositor-jank',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('blockMain runs synchronously and returns to idle', () => {
    // reloj que avanza rápido para que el busy-loop salga enseguida en el test
    let t = 0;
    svc.clock = () => (t += 1000);
    svc.blockMain(2500);
    expect(svc.mode()).toBe('idle');
  });

  it('blockWorker posts the compute command and stays in worker mode until the result', () => {
    svc.blockWorker(example, 500);
    expect(fake.posted[0]).toEqual({ command: 'compute', limit: 500 });
    expect(svc.mode()).toBe('worker');

    fake.result({ type: 'result', count: 95 });
    expect(svc.mode()).toBe('idle');
    expect(fake.terminated).toBe(true);
  });

  it('blockWorker ignores a second trigger while already blocking', () => {
    svc.blockWorker(example, 500);
    svc.blockWorker(example, 500);
    expect(fake.posted).toHaveLength(1);
  });

  it('reset clears worker state and stops metering', () => {
    svc.blockWorker(example, 500);
    svc.reset();
    expect(svc.mode()).toBe('idle');
    expect(svc.metering()).toBe(false);
    expect(fake.terminated).toBe(true);
  });
});
