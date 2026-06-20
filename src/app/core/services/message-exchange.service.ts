import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { ExchangeMessage } from '../domain/communication';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

/**
 * Intercambio de mensajes main <-> worker (ejemplo 03). Mantiene un log
 * direccional de mensajes y mide el round-trip de cada respuesta. Estado en
 * signals root: como el worker y la conversación viven acá, cambiar de theme no
 * la reinicia (mismo principio que el runner del ejemplo 01).
 */
@Injectable({ providedIn: 'root' })
export class MessageExchangeService {
  /** Reloj inyectable para tests deterministas. */
  clock: () => number = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  private worker?: WorkerLike;
  private openId?: string;
  private nextId = 0;

  private readonly _messages = signal<ExchangeMessage[]>([]);
  readonly messages = this._messages.asReadonly();
  /** True mientras esperamos la respuesta de un envío. */
  readonly pending = signal(false);

  /**
   * Abre el worker del ejemplo. Si ya está abierto para el mismo ejemplo, es un
   * no-op (no resetea la conversación al re-montar el layout / cambiar de theme).
   */
  open(example: WorkerExample): void {
    if (this.openId === example.id && this.worker) {
      return;
    }
    this.close();
    if (!example.workerFactory) {
      return;
    }
    const worker = example.workerFactory() as unknown as WorkerLike;
    this.worker = worker;
    this.openId = example.id;
    worker.onmessage = (event: MessageEvent) => this.receive(event.data);
  }

  /** Envía un mensaje al worker (lo registra como saliente). */
  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !this.worker) {
      return;
    }
    const id = this.nextId++;
    this._messages.update((m) => [
      ...m,
      { id, direction: 'out', text: trimmed, atMs: this.clock() },
    ]);
    this.pending.set(true);
    this.worker.postMessage({ id, text: trimmed });
  }

  private receive(data: { id?: number; text?: string; length?: number }): void {
    const at = this.clock();
    this._messages.update((m) => {
      const out = m.find((x) => x.id === data.id && x.direction === 'out');
      // Sub-milisegundo: el round-trip real es tan barato que redondear a entero daría
      // siempre 0. Mostramos 2 decimales para que se vea el costo honesto de cruzar el hilo.
      const roundTripMs = out ? Math.round((at - out.atMs) * 100) / 100 : undefined;
      const text = String(data.text ?? '');
      const meta = data.length != null ? `${data.length} chars` : undefined;
      return [...m, { id: data.id ?? -1, direction: 'in', text, meta, atMs: at, roundTripMs }];
    });
    this.pending.set(false);
  }

  /** Limpia la conversación (y termina el worker). */
  reset(): void {
    this.close();
  }

  private close(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.openId = undefined;
    this.nextId = 0;
    this._messages.set([]);
    this.pending.set(false);
  }
}
