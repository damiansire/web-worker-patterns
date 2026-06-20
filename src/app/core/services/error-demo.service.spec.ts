import { TestBed } from '@angular/core/testing';
import { ErrorDemoService } from './error-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: { message?: string; preventDefault?: () => void }) => void) | null = null;
  posted: Array<{ id: number; payload: string }> = [];
  terminated = false;

  postMessage(message: unknown): void {
    this.posted.push(message as { id: number; payload: string });
  }
  terminate(): void {
    this.terminated = true;
  }
  // Simulan lo que haría el worker real ante el último mensaje recibido.
  succeed(keys: number): void {
    const last = this.posted[this.posted.length - 1];
    this.onmessage?.({ data: { id: last.id, type: 'result', keys } } as MessageEvent);
  }
  fail(message: string): void {
    let prevented = false;
    this.onerror?.({ message, preventDefault: () => (prevented = true) });
    this.lastPrevented = prevented;
  }
  lastPrevented = false;
}

describe('ErrorDemoService', () => {
  let svc: ErrorDemoService;
  let fake: FakeWorker;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ErrorDemoService);
    fake = new FakeWorker();
    example = {
      id: '05-error-handling',
      order: 5,
      category: 'management',
      i18nKey: 'examples.05-error-handling',
      demo: 'error-handling',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
    svc.open(example);
  });

  it('registra una corrida OK con la cantidad de claves', () => {
    svc.run('{"a":1,"b":2}');
    expect(fake.posted[0]).toEqual({ id: 0, payload: '{"a":1,"b":2}' });
    expect(svc.busy()).toBe(true);

    fake.succeed(2);
    expect(svc.busy()).toBe(false);
    expect(svc.events()).toEqual([{ id: 0, status: 'ok', input: '{"a":1,"b":2}', keys: 2 }]);
  });

  it('captura el error del worker sin romper, y lo silencia en consola', () => {
    svc.run('{roto');
    fake.fail('Uncaught SyntaxError: Unexpected token r in JSON');

    expect(fake.lastPrevented).toBe(true); // preventDefault() llamado
    expect(svc.busy()).toBe(false);
    expect(svc.events()).toEqual([
      {
        id: 0,
        status: 'error',
        input: '{roto',
        message: 'Uncaught SyntaxError: Unexpected token r in JSON',
      },
    ]);
  });

  it('sigue vivo después de un error: se puede correr otra tarea', () => {
    svc.run('{roto');
    fake.fail('boom');
    svc.run('{"x":1}');
    fake.succeed(1);

    const events = svc.events();
    expect(events).toHaveLength(2);
    expect(events[0].status).toBe('error');
    expect(events[1]).toEqual({ id: 1, status: 'ok', input: '{"x":1}', keys: 1 });
    expect(fake.terminated).toBe(false);
  });

  it('reset limpia el log y termina el worker', () => {
    svc.run('{"a":1}');
    fake.succeed(1);
    svc.reset();
    expect(svc.events()).toEqual([]);
    expect(svc.busy()).toBe(false);
    expect(fake.terminated).toBe(true);
  });
});
