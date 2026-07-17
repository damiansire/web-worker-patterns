import { TestBed } from '@angular/core/testing';
import { SharedWorkerDemoService } from './shared-worker-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

// En Node no existe SharedWorker, así que el servicio cae al backend simulado:
// estos tests ejercitan justamente esa lógica de "un estado compartido, N clientes".
describe('SharedWorkerDemoService (backend simulado)', () => {
  let svc: SharedWorkerDemoService;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(SharedWorkerDemoService);
    example = {
      id: '08-shared-worker',
      order: 8,
      category: 'communication',
      i18nKey: 'examples.08-shared-worker',
      demo: 'shared-worker',
      // factory dummy: en Node nunca se llama (no hay SharedWorker → camino simulado).
      sharedWorkerFactory: () => ({}) as SharedWorker,
      snippets: {},
    };
    svc.open(example);
  });

  it('arranca con dos conexiones al mismo backend (mismo instanceId, clients=2)', () => {
    expect(svc.supported()).toBe(false); // sin SharedWorker real → simulado
    expect(svc.panels()).toHaveLength(2);
    expect(svc.clients()).toBe(2);
    expect(svc.count()).toBe(0);
    expect(svc.instanceId()).toMatch(/^sim-/);
  });

  it('un +1 en un panel se ve en TODOS: es el mismo contador', () => {
    svc.inc('#1');
    expect(svc.count()).toBe(1);
    // ambos paneles registraron el evento (recibieron el broadcast).
    const panels = svc.panels();
    expect(panels[0].logs.at(-1)).toMatchObject({ by: '#1', count: 1 });
    expect(panels[1].logs.at(-1)).toMatchObject({ by: '#1', count: 1 });
  });

  it('una conexión nueva hereda el estado actual del worker', () => {
    svc.inc('#1');
    svc.inc('#2');
    expect(svc.count()).toBe(2);

    svc.addPanel(); // tercer cliente
    expect(svc.panels()).toHaveLength(3);
    expect(svc.clients()).toBe(3);
    expect(svc.count()).toBe(2); // el contador NO se reinició: vive en el worker
  });

  it('cerrar una conexión baja la cuenta de clientes y deja al menos una', () => {
    svc.closePanel('#2');
    expect(svc.panels()).toHaveLength(1);
    expect(svc.clients()).toBe(1);

    svc.closePanel('#1'); // no debería cerrar la última
    expect(svc.panels()).toHaveLength(1);
  });

  it('reset pone el contador compartido en cero', () => {
    svc.inc('#1');
    svc.inc('#1');
    svc.reset('#1');
    expect(svc.count()).toBe(0);
  });
});

// El camino REAL (realConn/MessagePort) nunca corre en Node porque typeof
// SharedWorker === 'undefined'. Lo cubrimos forzando supported=true y un
// sharedWorkerFactory fake con un MessagePort espiable: así el wiring de
// MessagePort (start/onmessage/postMessage/close), la tesis del ejemplo 08, deja
// de ser código muerto para los tests.
describe('SharedWorkerDemoService (backend real / MessagePort)', () => {
  class FakePort {
    onmessage: ((event: MessageEvent) => void) | null = null;
    started = false;
    closed = false;
    posted: unknown[] = [];
    start(): void {
      this.started = true;
    }
    postMessage(message: unknown): void {
      this.posted.push(message);
    }
    close(): void {
      this.closed = true;
    }
    /** Simula un mensaje del backend hacia este puerto. */
    emit(data: unknown): void {
      this.onmessage?.({ data } as MessageEvent);
    }
  }
  class FakeSharedWorker {
    readonly port = new FakePort();
  }

  let svc: SharedWorkerDemoService;
  let created: FakeSharedWorker[];
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(SharedWorkerDemoService);
    created = [];
    example = {
      id: '08-shared-worker',
      order: 8,
      category: 'communication',
      i18nKey: 'examples.08-shared-worker',
      demo: 'shared-worker',
      sharedWorkerFactory: () => {
        const sw = new FakeSharedWorker();
        created.push(sw);
        return sw as unknown as SharedWorker;
      },
      snippets: {},
    };
    svc.open(example); // en Node abre 2 paneles simulados (supported=false)
    svc.supported.set(true); // fuerza el camino real para el próximo panel
  });

  it('realConn ata onmessage, llama port.start() y usa el MessagePort del factory', () => {
    svc.addPanel(); // '#3', ya por el camino real
    expect(created).toHaveLength(1);
    const port = created[0].port;
    expect(port.started).toBe(true); // olvidar port.start() rompería el ejemplo real
    expect(typeof port.onmessage).toBe('function');

    // Un mensaje del backend por ESE puerto actualiza el estado compartido.
    port.emit({ type: 'hello', instanceId: 'real-abc', clients: 3, count: 7 });
    expect(svc.instanceId()).toBe('real-abc');
    expect(svc.count()).toBe(7);
  });

  it('inc y closePanel viajan por el MessagePort real (postMessage/close)', () => {
    svc.addPanel(); // '#3' real
    const port = created[0].port;

    svc.inc('#3');
    expect(port.posted).toContainEqual({ type: 'inc', portLabel: '#3' });

    svc.closePanel('#3');
    expect(port.closed).toBe(true);
  });
});
