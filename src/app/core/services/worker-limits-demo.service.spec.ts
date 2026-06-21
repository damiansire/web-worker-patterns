import { TestBed } from '@angular/core/testing';
import { WorkerLimitsDemoService } from './worker-limits-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  postMessage(message: unknown): void {
    void message;
    // Responde de inmediato (síncrono): onmessage ya está seteado en runK.
    this.onmessage?.({ data: { type: 'result', count: 1 } } as MessageEvent);
  }
  terminate(): void {
    this.terminated = true;
  }
}

/** Worker que SIEMPRE falla (dispara onerror) en vez de responder. */
class FailingWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  postMessage(): void {
    this.onerror?.({ message: 'boom' });
  }
  terminate(): void {
    this.terminated = true;
  }
}

describe('WorkerLimitsDemoService', () => {
  let svc: WorkerLimitsDemoService;
  let created: FakeWorker[];
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(WorkerLimitsDemoService);
    svc.clock = () => 0;
    created = [];
    example = {
      id: '09-worker-limits',
      order: 9,
      category: 'management',
      i18nKey: 'examples.09-worker-limits',
      demo: 'worker-limits',
      workerFactory: () => {
        const w = new FakeWorker();
        created.push(w);
        return w as unknown as Worker;
      },
      snippets: {},
    };
  });

  it('expone los núcleos del CPU como umbral', () => {
    expect(svc.hardwareConcurrency()).toBeGreaterThan(0);
  });

  it('corre la escala completa 1,2,4,8,16,32 y registra una corrida por cada K', async () => {
    await svc.runScale(example, 1000);
    expect(svc.runs().map((r) => r.workers)).toEqual([1, 2, 4, 8, 16, 32]);
    expect(svc.running()).toBe(false);
    // total de workers creados = 1+2+4+8+16+32 = 63, todos terminados.
    expect(created).toHaveLength(63);
    expect(created.every((w) => w.terminated)).toBe(true);
  });

  it('no arranca una escala nueva si ya está corriendo', async () => {
    const p = svc.runScale(example, 1000);
    await svc.runScale(example, 1000); // ignorado mientras corre la primera
    await p;
    expect(created).toHaveLength(63); // una sola escala
  });

  it('reset limpia las corridas', async () => {
    await svc.runScale(example, 1000);
    svc.reset();
    expect(svc.runs()).toEqual([]);
    expect(svc.currentWorkers()).toBe(0);
  });

  it('un worker que falla (onerror) no cuelga la escala: running vuelve a false y queda el error', async () => {
    const failing: FailingWorker[] = [];
    const failingExample: WorkerExample = {
      ...example,
      workerFactory: () => {
        const w = new FailingWorker();
        failing.push(w);
        return w as unknown as Worker;
      },
    };

    await svc.runScale(failingExample, 1000);

    // pese a que TODOS los workers fallan, la escala no queda colgada.
    expect(svc.running()).toBe(false);
    expect(svc.currentWorkers()).toBe(0);
    expect(svc.error()).toBe('boom');
    // y los workers creados se terminaron (sin leak de hilos).
    expect(failing.every((w) => w.terminated)).toBe(true);
  });
});
