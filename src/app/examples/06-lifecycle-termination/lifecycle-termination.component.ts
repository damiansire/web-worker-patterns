import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-lifecycle-termination',
  imports: [CommonModule],
  templateUrl: './lifecycle-termination.component.html',
  styleUrl: './lifecycle-termination.component.scss',
  standalone: true
})
export class LifecycleTerminationComponent implements OnInit, OnDestroy {
  logs = signal<LogEntry[]>([]);
  workerStatus = signal<'none' | 'created' | 'working' | 'completed'>('none');
  progress = signal(0);
  createdCount = signal(0);
  completedCount = signal(0);
  terminatedCount = signal(0);
  private worker?: Worker;

  ngOnInit() {
    this.addLog('Sistema iniciado. Crea un worker para comenzar.', 'info');
  }

  ngOnDestroy() {
    this.terminateWorker();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  createWorker() {
    if (this.worker) return;
    
    this.addLog('Creando nuevo Worker...', 'info');
    
    this.worker = new Worker(new URL('./lifecycle-termination.worker', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e: MessageEvent<any>) => {
      if (e.data.type === 'progress') {
        this.progress.set(e.data.progress);
      } else if (e.data.type === 'complete') {
        this.addLog(`Tarea completada: ${e.data.result}`, 'success');
        this.workerStatus.set('completed');
        this.completedCount.update(c => c + 1);
        this.progress.set(0);
      }
    };

    this.worker.onerror = (e: ErrorEvent) => {
      this.addLog(`Error en worker: ${e.message}`, 'error');
    };

    this.workerStatus.set('created');
    this.createdCount.update(c => c + 1);
    this.addLog('Worker creado exitosamente', 'success');
  }

  startTask() {
    if (!this.worker) return;
    
    this.addLog('Iniciando tarea de 5 segundos...', 'info');
    this.workerStatus.set('working');
    this.progress.set(0);
    this.worker.postMessage({ action: 'startLongTask', duration: 5000 });
  }

  terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
      this.workerStatus.set('none');
      this.addLog('Worker terminado', 'warning');
      this.terminatedCount.update(c => c + 1);
    }
  }

  clearLogs() {
    this.logs.set([]);
  }
}
