import { TestBed } from '@angular/core/testing';
import { CloneCostDemoService } from './clone-cost-demo.service';
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
  reply(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('CloneCostDemoService', () => {
  let svc: CloneCostDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CloneCostDemoService);
    fake = new FakeWorker();
    t = 0;
    svc.clock = () => t;
    example = {
      id: '15-clone-cost',
      order: 15,
      category: 'optimization',
      i18nKey: 'examples.15-clone-cost',
      demo: 'clone-cost',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  /** El primer postMessage es la vuelta de warm-up (descartada). */
  function warmUp(): void {
    fake.reply({ id: 0, payload: null });
  }

  it('posts a warm-up payload first and marks running', () => {
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2, reps: 1 });
    expect(svc.running()).toBe(true);
    expect(fake.posted).toHaveLength(1);
    expect((fake.posted[0] as { id: number }).id).toBe(0);
  });

  it('discards the warm-up round (no measurement) before timing the sweep', () => {
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2, reps: 1 });
    t = 99;
    warmUp(); // vuelta de warm-up: NO se registra, dispara el barrido real
    expect(svc.measurements()).toHaveLength(0);
    expect(fake.posted).toHaveLength(2); // ya mandó el primer tamaño real
  });

  it('records one measurement per reply and sends the next, sequentially (reps=1)', () => {
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2, reps: 1 }); // sizes [5, 10]
    warmUp();

    t = 5;
    fake.reply({ id: 1, payload: null });
    expect(svc.measurements()).toHaveLength(1);
    expect(svc.measurements()[0]).toMatchObject({ size: 5, depth: 0, ms: 5 });
    expect(svc.measurements()[0].serializedBytes).toBeGreaterThan(0);
    expect(fake.posted).toHaveLength(3); // mandó el siguiente

    t = 12;
    fake.reply({ id: 2, payload: null });
    expect(svc.measurements()).toHaveLength(2);
    expect(svc.measurements()[1]).toMatchObject({ size: 10, ms: 7 });
  });

  it('measures each size `reps` times and records the MEDIAN (robust to an outlier)', () => {
    svc.runSweep(example, { maxSize: 4, depth: 0, steps: 1, reps: 3 });
    warmUp();
    // 3 muestras para el único tamaño: 4ms, 40ms (outlier), 6ms → mediana 6ms
    t = 4;
    fake.reply({ id: 1, payload: null });
    expect(svc.measurements()).toHaveLength(0); // todavía juntando muestras
    t = 44;
    fake.reply({ id: 2, payload: null }); // outlier de 40ms
    expect(svc.measurements()).toHaveLength(0);
    t = 50;
    fake.reply({ id: 3, payload: null }); // 6ms
    expect(svc.measurements()).toHaveLength(1);
    expect(svc.measurements()[0].ms).toBe(6); // mediana de [4, 40, 6], no el outlier
  });

  it('finishes after the last step: stops running and terminates the worker', () => {
    svc.runSweep(example, { maxSize: 4, depth: 0, steps: 1, reps: 1 });
    warmUp();
    t = 3;
    fake.reply({ id: 1, payload: null });
    expect(svc.running()).toBe(false);
    expect(fake.terminated).toBe(true);
  });

  it('records more nodes for a deeper sweep at the same size', () => {
    svc.runSweep(example, { maxSize: 6, depth: 0, steps: 1, reps: 1 });
    warmUp();
    fake.reply({ id: 1, payload: null });
    const flatNodes = svc.measurements()[0].nodeCount;

    svc.runSweep(example, { maxSize: 6, depth: 5, steps: 1, reps: 1 });
    fake.reply({ id: 2, payload: null }); // warm-up de la 2ª corrida
    fake.reply({ id: 3, payload: null });
    const deepNodes = svc.measurements()[0].nodeCount;

    expect(deepNodes).toBeGreaterThan(flatNodes);
  });

  it('ignores runSweep while a sweep is already running', () => {
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2, reps: 1 });
    const postedAfterFirst = fake.posted.length;
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2, reps: 1 });
    expect(fake.posted).toHaveLength(postedAfterFirst);
  });

  it('reset clears measurements and stops', () => {
    svc.runSweep(example, { maxSize: 10, depth: 0, steps: 2 });
    svc.reset();
    expect(svc.measurements()).toHaveLength(0);
    expect(svc.running()).toBe(false);
  });
});
