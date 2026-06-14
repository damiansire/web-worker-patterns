import { TestBed } from '@angular/core/testing';
import { LifecycleDemoService } from './lifecycle-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: Array<{ command: string; steps: number }> = [];
  terminated = false;

  postMessage(message: unknown): void {
    this.posted.push(message as { command: string; steps: number });
  }
  terminate(): void {
    this.terminated = true;
  }
  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('LifecycleDemoService', () => {
  let svc: LifecycleDemoService;
  let workers: FakeWorker[];
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(LifecycleDemoService);
    workers = [];
    example = {
      id: '06-lifecycle-termination',
      order: 6,
      category: 'management',
      i18nKey: 'examples.06-lifecycle-termination',
      demo: 'lifecycle',
      workerFactory: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w as unknown as Worker;
      },
      snippets: {},
    };
  });

  it('arranca la tarea y refleja el progreso', () => {
    svc.start(example, 10);
    expect(workers[0].posted[0]).toEqual({ command: 'start', steps: 10 });
    expect(svc.status()).toBe('running');

    workers[0].emit({ type: 'progress', step: 3, steps: 10 });
    expect(svc.step()).toBe(3);
    expect(svc.steps()).toBe(10);
  });

  it('terminate corta a mitad: mata el worker y congela el progreso', () => {
    svc.start(example, 10);
    workers[0].emit({ type: 'progress', step: 4, steps: 10 });
    svc.terminate();

    expect(workers[0].terminated).toBe(true);
    expect(svc.status()).toBe('terminated');
    expect(svc.step()).toBe(4); // el progreso queda donde estaba
  });

  it('marca done cuando la tarea completa', () => {
    svc.start(example, 3);
    workers[0].emit({ type: 'progress', step: 3, steps: 3 });
    workers[0].emit({ type: 'done', steps: 3 });
    expect(svc.status()).toBe('done');
  });

  it('un worker terminado no se reusa: start crea uno nuevo', () => {
    svc.start(example, 10);
    workers[0].emit({ type: 'progress', step: 4, steps: 10 });
    svc.terminate();

    svc.start(example, 5);
    expect(workers).toHaveLength(2); // se creó un worker fresco
    expect(workers[1].posted[0]).toEqual({ command: 'start', steps: 5 });
    expect(svc.status()).toBe('running');
    expect(svc.step()).toBe(0);
  });

  it('reset vuelve a idle y termina el worker', () => {
    svc.start(example, 10);
    svc.reset();
    expect(svc.status()).toBe('idle');
    expect(svc.step()).toBe(0);
    expect(workers[0].terminated).toBe(true);
  });
});
