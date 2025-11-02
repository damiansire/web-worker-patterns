import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-worker-limits',
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-limits.component.html',
  styleUrl: './worker-limits.component.scss',
  standalone: true
})
export class WorkerLimitsComponent implements OnInit, OnDestroy {
  workerCount = signal(1);
  activeCount = signal(0);
  totalCreated = signal(0);
  errorCount = signal(0);
  logs = signal<LogEntry[]>([]);
  private workers: Worker[] = [];

  ngOnInit() {
    this.addLog('Sistema iniciado', 'success');
  }

  ngOnDestroy() {
    this.terminateAll();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  createWorker() {
    try {
      const worker = new Worker(new URL('./worker-limits.worker', import.meta.url), { type: 'module' });
      worker.onmessage = () => {};
      worker.onerror = () => {
        this.addLog('Error al crear worker', 'error');
        this.errorCount.update(c => c + 1);
      };
      this.workers.push(worker);
      this.activeCount.set(this.workers.length);
      this.totalCreated.update(c => c + 1);
      this.addLog(`Worker #${this.workers.length} creado`, 'success');
    } catch (e: any) {
      this.addLog(`Error: ${e.message}`, 'error');
      this.errorCount.update(c => c + 1);
    }
  }

  stressTest() {
    const count = this.workerCount();
    this.addLog(`Creando ${count} workers...`, 'info');
    
    for (let i = 0; i < count; i++) {
      try {
        const worker = new Worker(new URL('./worker-limits.worker', import.meta.url), { type: 'module' });
        worker.onmessage = () => {};
        this.workers.push(worker);
        this.totalCreated.update(c => c + 1);
      } catch (e: any) {
        this.addLog(`Error creando worker ${i + 1}`, 'error');
        this.errorCount.update(c => c + 1);
      }
    }
    
    this.activeCount.set(this.workers.length);
    this.addLog(`Test completado. Workers activos: ${this.workers.length}`, 'info');
  }

  terminateAll() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.activeCount.set(0);
    this.addLog('Todos los workers terminados', 'warning');
  }

  clearLogs() {
    this.logs.set([]);
  }

  getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Edg") > -1) return "Edge";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    return "Desconocido";
  }

  getCPUCores(): number {
    return navigator.hardwareConcurrency || 4;
  }
}
