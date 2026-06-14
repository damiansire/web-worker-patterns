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
