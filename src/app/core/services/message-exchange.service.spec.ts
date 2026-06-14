import { TestBed } from '@angular/core/testing';
import { MessageExchangeService } from './message-exchange.service';
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

describe('MessageExchangeService', () => {
  let svc: MessageExchangeService;
  let fake: FakeWorker;
  let example: WorkerExample;
  let t: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(MessageExchangeService);
    fake = new FakeWorker();
    t = 0;
    svc.clock = () => t;
    example = {
      id: '03-basic-communication',
      order: 3,
      category: 'communication',
      i18nKey: 'examples.03-basic-communication',
      demo: 'message-exchange',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };
  });

  it('records an outgoing message and posts it to the worker', () => {
    svc.open(example);
    t = 100;
    svc.send('hola');

    expect(fake.posted[0]).toEqual({ id: 0, text: 'hola' });
    const msgs = svc.messages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ direction: 'out', text: 'hola', atMs: 100 });
    expect(svc.pending()).toBe(true);
  });

  it('records the reply with the round-trip time', () => {
    svc.open(example);
    t = 100;
    svc.send('hola');
    t = 450;
    fake.reply({ id: 0, text: 'HOLA', length: 4 });

    const msgs = svc.messages();
    expect(msgs).toHaveLength(2);
    expect(msgs[1]).toMatchObject({ direction: 'in', roundTripMs: 350 });
    expect(msgs[1].text).toContain('HOLA');
    expect(svc.pending()).toBe(false);
  });

  it('ignores empty / whitespace-only sends', () => {
    svc.open(example);
    svc.send('   ');
    expect(svc.messages()).toHaveLength(0);
  });

  it('open() is a no-op for the same example, so the conversation survives a re-mount', () => {
    svc.open(example);
    svc.send('hola');
    svc.open(example); // mismo id → no resetea ni recrea el worker
    expect(svc.messages()).toHaveLength(1);
    expect(fake.terminated).toBe(false);
  });
});
