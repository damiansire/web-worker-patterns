import { WorkerExample } from '../examples/example.model';
import { WorkerLike } from './worker-like';

export interface WorkerHostHandlers {
  /** Datos de un `onmessage` del worker (event.data). */
  onMessage: (data: unknown) => void;
  /** Un fallo del worker (`onerror`), ya con `preventDefault()` hecho; recibe el mensaje. */
  onError: (message: string) => void;
}

/**
 * Ciclo de vida de UN worker reusable por ejemplo: open idempotente + close +
 * el `onerror` con `preventDefault`. Estaba duplicado casi verbatim entre los
 * demo-services de worker único (message-exchange, error-handling): el mismo
 * guard de idempotencia (`openId === id && worker`), el mismo `close()` que
 * termina el worker, el mismo `onerror`. Cada servicio COMPONE un `WorkerHost`
 * (no hereda) y le pasa SU reacción a mensaje/error; el lifecycle es uno solo,
 * así arreglar un leak o cambiar la idempotencia se toca en un lugar. Dominio
 * puro: no depende de Angular.
 */
export class WorkerHost {
  private worker?: WorkerLike;
  private openId?: string;

  /**
   * Abre el worker del ejemplo. No-op si ya está abierto para el mismo id (no
   * reinicia al re-montar el layout / cambiar de theme). Si el ejemplo no trae
   * `workerFactory`, cierra lo que hubiera y no abre nada.
   */
  open(example: WorkerExample, handlers: WorkerHostHandlers): void {
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
    worker.onmessage = (event: MessageEvent) => handlers.onMessage(event.data);
    worker.onerror = (event) => {
      (event as { preventDefault?: () => void })?.preventDefault?.();
      handlers.onError((event as { message?: string })?.message ?? 'El worker falló');
    };
  }

  /** True si hay un worker abierto. */
  get isOpen(): boolean {
    return this.worker !== undefined;
  }

  /** Envía un mensaje al worker abierto (no-op si no hay ninguno). */
  post(message: unknown): void {
    this.worker?.postMessage(message);
  }

  /** Termina el worker y olvida el id. El estado del servicio lo limpia el servicio. */
  close(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.openId = undefined;
  }
}
