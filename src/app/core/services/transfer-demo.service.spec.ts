import { TestBed } from '@angular/core/testing';
import { TransferDemoService } from './transfer-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: Array<{ message: { mode: string }; transfer?: Transferable[] }> = [];
  terminated = false;

  postMessage(message: unknown, transfer?: Transferable[]): void {
    this.posted.push({ message: message as { mode: string }, transfer });
  }
  terminate(): void {
    this.terminated = true;
  }
  result(bytes: number, mode: string): void {
    this.onmessage?.({ data: { type: 'result', mode, bytes } } as MessageEvent);
  }
}

describe('TransferDemoService', () => {
  let svc: TransferDemoService;
  let workers: FakeWorker[];
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TransferDemoService);
    workers = [];
    t = 0;
    svc.clock = () => t;
    example = {
      id: '07-transferable-objects',
      order: 7,
      category: 'optimization',
      i18nKey: 'examples.07-transferable-objects',
      demo: 'transferable',
      workerFactory: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w as unknown as Worker;
      },
      snippets: {},
    };
  });

  it('runTransfer manda el buffer con transfer list y mide el round-trip', () => {
    t = 100;
    svc.runTransfer(example, 32);
    const posted = workers[0].posted[0];
    expect(posted.message.mode).toBe('transfer');
    expect(posted.transfer).toHaveLength(1); // se pasó la transfer list [buf]
    expect(svc.busy()).toBe(true);

    t = 100.4;
    workers[0].result(32 * 1024 * 1024, 'transfer');
    const r = svc.transferResult();
    expect(r?.ms).toBe(0.4);
    expect(r?.mb).toBe(32);
    expect(svc.busy()).toBe(false);
    expect(workers[0].terminated).toBe(true);
  });

  it('runClone manda el buffer SIN transfer list (structured clone)', () => {
    t = 100;
    svc.runClone(example, 32);
    const posted = workers[0].posted[0];
    expect(posted.message.mode).toBe('clone');
    expect(posted.transfer).toBeUndefined(); // sin transfer list → se clona

    t = 118;
    workers[0].result(32 * 1024 * 1024, 'clone');
    const r = svc.cloneResult();
    expect(r?.ms).toBe(18);
    expect(r?.detached).toBe(false); // el main conserva su copia
  });

  it('reset limpia ambos resultados', () => {
    svc.runClone(example, 8);
    workers[0].result(8 * 1024 * 1024, 'clone');
    svc.reset();
    expect(svc.transferResult()).toBeNull();
    expect(svc.cloneResult()).toBeNull();
    expect(svc.busy()).toBe(false);
  });
});
