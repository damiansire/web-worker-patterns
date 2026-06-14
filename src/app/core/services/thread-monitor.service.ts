import { Injectable, signal } from '@angular/core';

/**
 * Monitor de hilos (ARQUITECTURA §3.2).
 *
 * El servicio EMITE datos de actividad de hilos como signals; no pinta nada.
 * Cada theme dibuja estos mismos `lanes` a su manera (barras diagonales en
 * editorial, celdas duras en brutalist, etc). El contrato `ThreadLane[]` es la
 * frontera entre dominio y presentación.
 */

export type ThreadState = 'main' | 'worker' | 'blocked' | 'idle';

export interface ThreadSegment {
  startMs: number;
  endMs: number;
  state: ThreadState;
}

export interface ThreadLane {
  id: string; // 'main' | 'timer' | 'worker' | ...
  label: string;
  segments: ThreadSegment[];
}

@Injectable({ providedIn: 'root' })
export class ThreadMonitorService {
  /**
   * Reloj inyectable para mantener el servicio determinista en tests.
   * En runtime usa `performance.now()`.
   */
  clock: () => number = () =>
    typeof performance !== 'undefined' ? performance.now() : 0;

  private t0 = 0;
  private readonly labels = new Map<string, string>();

  private readonly _lanes = signal<ThreadLane[]>([]);
  readonly lanes = this._lanes.asReadonly();
  readonly elapsedMs = signal(0);

  /** Etiqueta opcional para un carril (se usa al crearlo en el primer push). */
  registerLane(id: string, label: string): void {
    this.labels.set(id, label);
  }

  /** Marca el inicio de la línea de tiempo. */
  start(at?: number): void {
    this.t0 = at ?? this.clock();
    this.elapsedMs.set(0);
  }

  /**
   * Registra que `laneId` pasa a `state` en este instante: cierra el segmento
   * abierto del carril y abre uno nuevo.
   */
  push(laneId: string, state: ThreadState): void {
    const now = this.clock() - this.t0;
    this.elapsedMs.set(now);

    this._lanes.update((lanes) => {
      const next = lanes.map((l) => ({ ...l, segments: [...l.segments] }));
      let lane = next.find((l) => l.id === laneId);
      if (!lane) {
        lane = { id: laneId, label: this.labels.get(laneId) ?? laneId, segments: [] };
        next.push(lane);
      }
      const open = lane.segments[lane.segments.length - 1];
      if (open) {
        open.endMs = now;
      }
      lane.segments.push({ startMs: now, endMs: now, state });
      return next;
    });
  }

  reset(): void {
    this._lanes.set([]);
    this.elapsedMs.set(0);
    this.t0 = this.clock();
  }
}
