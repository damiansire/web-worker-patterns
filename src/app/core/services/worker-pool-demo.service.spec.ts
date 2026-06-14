import { TestBed } from '@angular/core/testing';
import { WorkerPoolDemoService } from './worker-pool-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  terminated = false;
  postMessage(): void {
    // Responde en un microtask (asíncrono, como un worker real), así el trabajo
    // se reparte entre los slots del pool en vez de drenar todo un solo worker.
    queueMicrotask(() => this.onmessage?.({ data: { type: 'result' } } as MessageEvent));
  }
  terminate(): void {
    this.terminated = true;
  }
}

async function waitUntil(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 1000 && !cond(); i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe('WorkerPoolDemoService', () => {
  let svc: WorkerPoolDemoService;
  let created: FakeWorker[];
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(WorkerPoolDemoService);
    svc.stepDelayMs = 0; // sin throttle en el test
    created = [];
    example = {
      id: '10-worker-pool',
      order: 10,
      category: 'optimization',
      i18nKey: 'examples.10-worker-pool',
      demo: 'worker-pool',
      workerFactory: () => {
        const w = new FakeWorker();
        created.push(w);
        return w as unknown as Worker;
      },
      snippets: {},
    };
  });

  it('crea EXACTAMENTE N workers (no uno por tarea) y drena las M tareas', async () => {
    svc.start(example, 1000);
    await waitUntil(() => !svc.running());

    // se crearon poolSize workers, NO taskCount.
    expect(created).toHaveLength(svc.poolSize());
    expect(created.length).toBeLessThan(svc.taskCount);
    // todas las tareas quedaron hechas.
    expect(svc.processed()).toBe(svc.taskCount);
    expect(svc.tasks().every((t) => t.state === 'done')).toBe(true);
  });

  it('reusa los slots: la suma de procesados por slot es M y algún slot hizo más de una', async () => {
    svc.start(example, 1000);
    await waitUntil(() => !svc.running());

    const perSlot = svc.slots().map((s) => s.processed);
    expect(perSlot.reduce((a, b) => a + b, 0)).toBe(svc.taskCount);
    expect(Math.max(...perSlot)).toBeGreaterThan(1); // hubo reuso real
  });

  it('termina los workers al vaciar la cola', async () => {
    svc.start(example, 1000);
    await waitUntil(() => !svc.running());
    expect(created.every((w) => w.terminated)).toBe(true);
  });

  it('la tesis numérica: workers creados = N, sin pool serían M', () => {
    expect(svc.workersCreated()).toBe(svc.poolSize());
    expect(svc.spawnedWithoutPool).toBe(svc.taskCount);
    expect(svc.workersCreated()).toBeLessThan(svc.spawnedWithoutPool);
  });

  it('reset limpia la cola y los slots', async () => {
    svc.start(example, 1000);
    await waitUntil(() => !svc.running());
    svc.reset();
    expect(svc.tasks()).toEqual([]);
    expect(svc.slots()).toEqual([]);
    expect(svc.running()).toBe(false);
  });
});
