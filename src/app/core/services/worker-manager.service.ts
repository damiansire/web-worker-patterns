import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface WorkerMessage {
  type: string;
  payload?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerManagerService {
  private activeWorkers = new Map<string, Worker>();
  private messageSubjects = new Map<string, Subject<WorkerMessage>>();

  /**
   * Crea un nuevo Worker y lo gestiona
   */
  createWorker(workerId: string, workerScript: string | Worker): Subject<WorkerMessage> {
    // Si ya existe, retornar el subject existente
    if (this.messageSubjects.has(workerId)) {
      return this.messageSubjects.get(workerId)!;
    }

    // Crear nuevo worker
    const worker = typeof workerScript === 'string' 
      ? new Worker(workerScript, { type: 'module' })
      : workerScript;

    // Crear subject para mensajes
    const messageSubject = new Subject<WorkerMessage>();
    this.messageSubjects.set(workerId, messageSubject);
    this.activeWorkers.set(workerId, worker);

    // Escuchar mensajes del worker
    worker.onmessage = (event) => {
      messageSubject.next(event.data);
    };

    // Escuchar errores del worker
    worker.onerror = (error) => {
      messageSubject.error({
        type: 'error',
        error: error.message
      });
    };

    return messageSubject;
  }

  /**
   * Envía un mensaje a un worker específico
   */
  postMessage(workerId: string, message: WorkerMessage): void {
    const worker = this.activeWorkers.get(workerId);
    if (worker) {
      worker.postMessage(message);
    }
  }

  /**
   * Termina un worker y limpia recursos
   */
  terminateWorker(workerId: string): void {
    const worker = this.activeWorkers.get(workerId);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(workerId);
      const subject = this.messageSubjects.get(workerId);
      if (subject) {
        subject.complete();
        this.messageSubjects.delete(workerId);
      }
    }
  }

  /**
   * Verifica si un worker existe
   */
  hasWorker(workerId: string): boolean {
    return this.activeWorkers.has(workerId);
  }

  /**
   * Obtiene el contador de workers activos
   */
  getActiveWorkerCount(): number {
    return this.activeWorkers.size;
  }

  /**
   * Termina todos los workers activos
   */
  terminateAllWorkers(): void {
    this.activeWorkers.forEach((worker, id) => {
      worker.terminate();
      const subject = this.messageSubjects.get(id);
      if (subject) {
        subject.complete();
      }
    });
    this.activeWorkers.clear();
    this.messageSubjects.clear();
  }
}

