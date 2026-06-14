import { TestBed } from '@angular/core/testing';
import { ExampleRunnerService } from './example-runner.service';
import { ThreadMonitorService } from './thread-monitor.service';
import { WorkerExample } from '../domain/examples/example.model';

/**
 * Worker falso: en jsdom no corre un Web Worker real, así que simulamos el
 * protocolo neutral (recibe `start`, emitimos `tick`) para validar el cableado
 * worker -> runner -> monitor sin levantar UI.
 */
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

  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('ExampleRunnerService', () => {
  let runner: ExampleRunnerService;
  let monitor: ThreadMonitorService;
  let fake: FakeWorker;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    runner = TestBed.inject(ExampleRunnerService);
    monitor = TestBed.inject(ThreadMonitorService);
    fake = new FakeWorker();
    example = {
      id: '01-setinterval-counter',
      order: 1,
      category: 'understanding',
      i18nKey: 'examples.01-setinterval-counter',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('starts the worker with the requested interval', () => {
    runner.start(example, { intervalMs: 250 });
    expect(fake.posted[0]).toEqual({ command: 'start', intervalMs: 250 });
    expect(runner.runningId()).toBe('01-setinterval-counter');
  });

  it('records ticks emitted by the worker into the monitor', () => {
    runner.start(example, { intervalMs: 10 });

    fake.emit({ type: 'tick', tick: 1, at: 10 });
    fake.emit({ type: 'tick', tick: 2, at: 20 });

    expect(runner.lastTick()).toBe(2);
    const lane = monitor.lanes().find((l) => l.id === 'worker');
    expect(lane).toBeDefined();
    expect(lane!.segments.length).toBeGreaterThanOrEqual(2);
  });

  it('stop terminates the worker and clears running id', () => {
    runner.start(example);
    runner.stop();
    expect(fake.terminated).toBe(true);
    expect(runner.runningId()).toBeNull();
  });

  it('does nothing for an example without a workerFactory', () => {
    const noWorker: WorkerExample = { ...example, workerFactory: undefined };
    runner.start(noWorker);
    expect(runner.runningId()).toBeNull();
  });
});
