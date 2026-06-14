import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';

interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

/**
 * Demo de memoria compartida (ejemplo 12). El main y el worker comparten un
 * SharedArrayBuffer: la MISMA memoria, no una copia. El worker incrementa un
 * entero ahí (Atomics.add); el main LEE esa misma memoria con un poll —sin
 * recibir un solo postMessage— y la muestra subiendo. Esa es la diferencia con
 * el ejemplo 03 (donde cada update viajaba como mensaje).
 *
 * SharedArrayBuffer requiere aislamiento cross-origin (cabeceras COOP/COEP). Si
 * no está disponible, cae a un backend SIMULADO (un buffer local que sube por
 * timer) —rotulado en la UI— para seguir mostrando el concepto. Estado en
 * signals root: sobrevive el cambio de theme (incluso a mitad de la cuenta).
 */
@Injectable({ providedIn: 'root' })
export class SharedMemoryDemoService {
  /** Valor que el main LEE de la memoria compartida. */
  readonly value = signal(0);
  readonly running = signal(false);
  /** False cuando no hay SharedArrayBuffer (se usa el backend simulado). */
  readonly supported = signal(typeof SharedArrayBuffer !== 'undefined');
  /** A cuánto llega la cuenta. */
  readonly target = 50;

  private intervalMs = 60;
  private worker?: WorkerLike;
  private view?: Int32Array;
  private simTimer?: ReturnType<typeof setInterval>;
  private pollTimer?: ReturnType<typeof setInterval>;

  start(example: WorkerExample): void {
    if (this.running()) {
      return;
    }
    this.teardown();
    this.value.set(0);
    this.running.set(true);

    if (this.supported() && example.workerFactory) {
      // Camino real: SharedArrayBuffer compartido con el worker.
      const sab = new SharedArrayBuffer(4); // un Int32
      this.view = new Int32Array(sab);
      const worker = example.workerFactory() as unknown as WorkerLike;
      this.worker = worker;
      worker.postMessage({ command: 'start', sab, target: this.target, intervalMs: this.intervalMs });
    } else {
      // Fallback simulado: un buffer local que "alguien" incrementa por timer.
      this.view = new Int32Array(new ArrayBuffer(4));
      this.simTimer = setInterval(() => {
        if (!this.view) {
          return;
        }
        this.view[0] += 1;
        if (this.view[0] >= this.target) {
          this.stopSim();
        }
      }, this.intervalMs);
    }

    // El main LEE la memoria por su cuenta (no recibe mensajes del worker).
    this.pollTimer = setInterval(() => this.read(), 30);
  }

  private read(): void {
    if (!this.view) {
      return;
    }
    const v = this.supported() ? Atomics.load(this.view, 0) : this.view[0];
    this.value.set(v);
    if (v >= this.target) {
      this.finish();
    }
  }

  private finish(): void {
    this.stopSim();
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.worker?.terminate();
    this.worker = undefined;
    this.running.set(false);
  }

  private stopSim(): void {
    if (this.simTimer !== undefined) {
      clearInterval(this.simTimer);
      this.simTimer = undefined;
    }
  }

  reset(): void {
    this.teardown();
    this.value.set(0);
    this.running.set(false);
  }

  private teardown(): void {
    this.stopSim();
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.worker?.terminate();
    this.worker = undefined;
    this.view = undefined;
  }
}
