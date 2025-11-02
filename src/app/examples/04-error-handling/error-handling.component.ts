import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-error-handling',
  imports: [CommonModule],
  templateUrl: './error-handling.component.html',
  styleUrl: './error-handling.component.scss',
  standalone: true
})
export class ErrorHandlingComponent implements OnInit, OnDestroy {
  @ViewChild('logContainer', { static: false }) logContainer!: ElementRef<HTMLDivElement>;
  logs = signal<LogEntry[]>([]);
  private worker?: Worker;

  constructor() {
    // Efecto que se ejecuta cuando logs cambia
    effect(() => {
      // Simplemente acceder a logs() hace que el efecto se ejecute cuando cambie
      this.logs();
      // Hacer scroll después de que el DOM se actualice
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  ngOnInit() {
    this.createWorker();
  }

  private scrollToBottom() {
    if (this.logContainer) {
      const element = this.logContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./error-handling.worker', import.meta.url), { type: 'module' });
      this.addLog('🔧 Worker creado exitosamente', 'success');

      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data.message) {
          this.addLog(`📨 ${e.data.message}`, 'success');
        }
        if (e.data.result) {
          this.addLog(`   └─ Resultado: ${e.data.result}`, 'info');
        }
      };

      this.worker.onerror = (e: ErrorEvent) => {
        // Prevenir que el error se propague y cause problemas
        e.preventDefault();
        
        this.addLog('❌ ERROR CAPTURADO EN EL WORKER:', 'error');
        this.addLog(`   └─ Mensaje: ${e.message}`, 'error');
        this.addLog(`   └─ Archivo: ${e.filename}`, 'error');
        this.addLog(`   └─ Línea: ${e.lineno}, Columna: ${e.colno}`, 'error');
        
        // Recrear el worker para que siga funcionando
        this.addLog('🔄 Recreando worker...', 'warning');
        setTimeout(() => {
          this.worker?.terminate();
          this.createWorker();
        }, 100);
      };

      if (this.logs().length === 0) {
        this.addLog('✨ Sistema de manejo de errores listo', 'success');
      }
    }
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  triggerError(errorType: string) {
    this.addLog(`🎯 Provocando error de tipo: "${errorType}"`, 'info');
    this.worker?.postMessage({ action: 'triggerError', errorType });
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog('Consola limpiada', 'info');
  }
}
