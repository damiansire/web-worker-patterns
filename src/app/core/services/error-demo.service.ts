import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: { message?: string; preventDefault?: () => void }) => void) | null;
}

/** Una corrida de la tarea: salió OK (claves parseadas) o falló (error capturado). */
export interface ErrorDemoEvent {
  id: number;
  status: 'ok' | 'error';
  /** Payload que se envió (recortado), para dar contexto en el log. */
  input: string;
  /** Sólo OK: cantidad de claves del objeto parseado. */
  keys?: number;
  /** Sólo error: el mensaje del error capturado por el main. */
  message?: string;
}

/**
 * Demo de manejo de errores (ejemplo 05). El worker corre una tarea que puede
 * lanzar (parsear JSON). Cuando lanza, el error NO rompe la página: lo captura
 * el `onerror` del worker en el main y queda registrado en el log. El worker
 * sigue vivo, así que se pueden seguir corriendo tareas después de un error.
 *
 * Estado en signals root: la conversación y el worker viven acá, así cambiar de
 * theme no reinicia el log (mismo principio que el runner y el exchange).
 */
@Injectable({ providedIn: 'root' })
export class ErrorDemoService {
  private worker?: WorkerLike;
  private openId?: string;
  private nextId = 0;

  private readonly _events = signal<ErrorDemoEvent[]>([]);
  readonly events = this._events.asReadonly();
  /** True mientras esperamos el resultado de una corrida. */
  readonly busy = signal(false);

  /**
   * Abre el worker del ejemplo. No-op si ya está abierto para el mismo ejemplo
   * (no resetea el log al re-montar el layout / cambiar de theme).
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
    worker.onmessage = (event: MessageEvent) => this.onResult(event.data);
    worker.onerror = (event) => this.onError(event);
  }

  /** Corre la tarea con un payload (válido o roto). */
  run(payload: string): void {
    if (!this.worker || this.busy()) {
      return;
    }
    this.pendingId = this.nextId++;
    this.pendingInput = payload;
    this.busy.set(true);
    this.worker.postMessage({ id: this.pendingId, payload });
  }

  private pendingId = 0;
  private pendingInput = '';

  private onResult(data: { keys?: number }): void {
    this._events.update((e) => [
      ...e,
      { id: this.pendingId, status: 'ok', input: this.pendingInput, keys: data.keys ?? 0 },
    ]);
    this.busy.set(false);
  }

  private onError(event: { message?: string; preventDefault?: () => void }): void {
    // Silenciamos el log de consola del navegador: ya lo mostramos en la UI.
    event.preventDefault?.();
    this._events.update((e) => [
      ...e,
      {
        id: this.pendingId,
        status: 'error',
        input: this.pendingInput,
        message: event.message ?? 'Error desconocido en el worker',
      },
    ]);
    this.busy.set(false);
  }

  /** Limpia el log (y termina el worker). */
  reset(): void {
    this.close();
  }

  private close(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.openId = undefined;
    this.nextId = 0;
    this.pendingId = 0;
    this.pendingInput = '';
    this._events.set([]);
    this.busy.set(false);
  }
}
