import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { WorkerLike } from '../domain/workers/worker-like';
import { SharedCounterBuffer, isSharedMemorySupported } from '@worker-patterns/core';

/**
 * Demo de memoria compartida (ejemplo 12). El main y el worker comparten un
 * SharedArrayBuffer: la MISMA memoria, no una copia. El worker incrementa un
 * entero ahí (Atomics.add); el main LEE esa misma memoria con un poll —sin
 * recibir un solo postMessage— y la muestra subiendo. Esa es la diferencia con
 * el ejemplo 03 (donde cada update viajaba como mensaje).
 *
 * SharedArrayBuffer requiere aislamiento cross-origin (cabeceras COOP/COEP). Si
 * no está disponible, cae a un backend SIMULADO (un buffer local que sube por
 * timer) —rotulado en la UI— para seguir mostrando el concepto.
 *
 * El wrapper real (creación del SAB, arranque del worker, fallback simulado,
 * polling con Atomics) vive en `SharedCounterBuffer` de `@worker-patterns/core`
 * — paquete agnóstico de framework (wwp-3/wwp-5, `packages/worker-patterns-core/`).
 * Este servicio es el adaptador delgado: signals root (para que el estado
 * sobreviva el cambio de theme, incluso a mitad de la cuenta) sobre los eventos
 * del wrapper.
 */
@Injectable({ providedIn: 'root' })
export class SharedMemoryDemoService {
  /** Valor que el main LEE de la memoria compartida. */
  readonly value = signal(0);
  readonly running = signal(false);
  /**
   * False cuando no se puede compartir memoria de verdad (se usa el backend simulado).
   * El gate fiable NO es `typeof SharedArrayBuffer` (el constructor puede existir y aún
   * así fallar al compartir): es `crossOriginIsolated`, que sólo es true cuando el
   * documento sirvió COOP/COEP. Sin aislamiento, instanciar/compartir un SAB tira o no
   * comparte en silencio — así que sólo entramos al camino real si AMBOS son ciertos.
   */
  readonly supported = signal(isSharedMemorySupported());
  /** A cuánto llega la cuenta. */
  readonly target = 50;

  private intervalMs = 60;
  private buffer = new SharedCounterBuffer();

  start(example: WorkerExample): void {
    if (this.running()) {
      return;
    }
    this.value.set(0);
    this.running.set(true);

    const worker =
      this.supported() && example.workerFactory
        ? (example.workerFactory() as unknown as WorkerLike)
        : undefined;

    this.buffer.start(
      worker,
      { target: this.target, intervalMs: this.intervalMs },
      {
        onValue: (v) => this.value.set(v),
        onFinish: (v) => {
          this.value.set(v);
          this.running.set(false);
        },
      },
    );
  }

  reset(): void {
    this.buffer.stop();
    this.value.set(0);
    this.running.set(false);
  }
}
