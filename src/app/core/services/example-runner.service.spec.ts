import { TestBed } from '@angular/core/testing';
import { ExampleRunnerService } from './example-runner.service';
import { WorkerExample } from '../domain/examples/example.model';

/**
 * Worker falso: en jsdom no corre un Web Worker real, así que simulamos el
 * protocolo neutral (recibe `start`, emitimos `tick`) para validar el cableado
 * worker -> runner sin levantar UI.
 */
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

  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('ExampleRunnerService', () => {
  let runner: ExampleRunnerService;
  let fake: FakeWorker;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    runner = TestBed.inject(ExampleRunnerService);
    runner.defer = (run) => run(); // sin esperar al pintado: el test es sincrónico
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

  it('runWorkerDemo arranca el worker con el intervalo pedido y llena los carriles en vivo', () => {
    runner.runWorkerDemo(example, { intervalMs: 10, ticks: 3 });
    expect(fake.posted[0]).toEqual({ command: 'start', intervalMs: 10 });

    fake.emit({ type: 'tick', tick: 1 });
    expect(runner.workerLanes()).not.toBeNull();
    fake.emit({ type: 'tick', tick: 2 });
    fake.emit({ type: 'tick', tick: 3 });

    expect(runner.workerTicks()).toBe(3);
    expect(fake.terminated).toBe(true); // se detuvo solo al llegar a ticks
    const lanes = runner.workerLanes()!;
    expect(lanes.find((l) => l.id === 'main')!.segments[0].state).toBe('idle');
    expect(lanes.find((l) => l.id === 'worker')!.segments).toHaveLength(3);
    expect(runner.phase()).toBe('idle');
  });

  it('runMainBlockingDemo marca el carril main como blocked (sin worker)', () => {
    runner.runMainBlockingDemo({ intervalMs: 1, ticks: 1 });
    const lanes = runner.mainLanes();
    expect(lanes).not.toBeNull();
    expect(lanes!.find((l) => l.id === 'main')!.segments[0].state).toBe('blocked');
    expect(lanes!.find((l) => l.id === 'worker')!.segments).toEqual([]);
    expect(runner.mainTicks()).toBe(1);
    expect(runner.phase()).toBe('idle');
  });

  it('stop termina el worker en vuelo', () => {
    runner.runWorkerDemo(example, { intervalMs: 10, ticks: 10 });
    fake.emit({ type: 'tick', tick: 1 }); // corriendo, aún no llegó a ticks
    runner.stop();
    expect(fake.terminated).toBe(true);
  });

  it('stop a mitad de corrida devuelve la fase a idle (el botón no queda trabado)', () => {
    runner.runWorkerDemo(example, { intervalMs: 10, ticks: 10 });
    fake.emit({ type: 'tick', tick: 1 });
    expect(runner.phase()).toBe('worker');

    // Es lo que pasa al salir del ejemplo con la corrida en vuelo (onDestroy).
    runner.stop();

    expect(runner.phase()).toBe('idle');
  });

  it('un worker que falla libera la fase y termina el worker', () => {
    runner.runWorkerDemo(example, { intervalMs: 10, ticks: 10 });

    fake.onerror?.({ message: 'no cargó el script' });

    expect(runner.phase()).toBe('idle');
    expect(fake.terminated).toBe(true);
  });

  it('el bloqueo del main se difiere: la fase "main" queda visible antes de congelar', () => {
    let blockNow: (() => void) | undefined;
    runner.defer = (run) => (blockNow = run);

    runner.runMainBlockingDemo({ intervalMs: 1, ticks: 1 });

    // Todavía no bloqueó: el navegador tiene un frame para pintar el estado.
    expect(runner.phase()).toBe('main');
    expect(runner.mainLanes()).toBeNull();

    blockNow?.();
    expect(runner.phase()).toBe('idle');
    expect(runner.mainLanes()).not.toBeNull();
  });

  it('no hace nada para un ejemplo sin workerFactory', () => {
    const noWorker: WorkerExample = { ...example, workerFactory: undefined };
    runner.runWorkerDemo(noWorker);
    expect(runner.phase()).toBe('idle');
    expect(runner.workerLanes()).toBeNull();
  });
});
