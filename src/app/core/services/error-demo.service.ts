import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerHost } from '../domain/workers/worker-host';

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
  private readonly host = new WorkerHost();
  private nextId = 0;

  private readonly _events = signal<ErrorDemoEvent[]>([]);
  readonly events = this._events.asReadonly();
  /** True mientras esperamos el resultado de una corrida. */
  readonly busy = signal(false);

  /**
   * Abre el worker del ejemplo. No-op si ya está abierto para el mismo ejemplo
   * (no resetea el log al re-montar el layout / cambiar de theme). El onerror
   * registra el fallo como un evento del log (el worker sigue vivo) y libera busy.
   */
  open(example: WorkerExample): void {
    this.host.open(example, {
      onMessage: (data) => this.onResult(data as { keys?: number }),
      onError: (message) => {
        this._events.update((e) => [
          ...e,
          { id: this.pendingId, status: 'error', input: this.pendingInput, message },
        ]);
        this.busy.set(false);
      },
    });
  }

  /** Corre la tarea con un payload (válido o roto). */
  run(payload: string): void {
    if (!this.host.isOpen || this.busy()) {
      return;
    }
    this.pendingId = this.nextId++;
    this.pendingInput = payload;
    this.busy.set(true);
    this.host.post({ id: this.pendingId, payload });
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

  /** Limpia el log (y termina el worker). */
  reset(): void {
    this.host.close();
    this.nextId = 0;
    this.pendingId = 0;
    this.pendingInput = '';
    this._events.set([]);
    this.busy.set(false);
  }
}
